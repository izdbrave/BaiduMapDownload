/**
 * @ Author: izdbrave
 * @ Create Time: 2019-08-01 09:12:21
 * @ Modified by: izdbrave
 * @ Modified time: 2020-03-26 18:00:15
 * @ Description: 下载瓦片
 */

const path = require('path');

const Bagpipe = require('bagpipe');
const moment = require('moment');
const fs = require('fs');
const http = require('http');

const getConfig = require('./getConfig');

let totalCount = 0; //瓦片总数
let downCount = 0; //已下载总数
let downSize = 0; //已下载大小
let errorCount = 0; //出错总数
let beginTime = null; //开始时间
let timer = null; //计时器
let config = getConfig(); //基本配置
let errLogPath = './err.log'; //错误日志
let errorTilesCount = {}; //失败次数记录
let httpOpiton = { timeout: 2 * 60 * 1000 }; //请求配置

/**
 * 计算时间
 */
function calcTime(milliseconds) {
    let hours = parseInt(milliseconds / 1000 / 60 / 60)
        .toString()
        .padStart(2, '0');
    let minutes = (parseInt(milliseconds / 1000 / 60) % 60).toString().padStart(2, '0');
    let seconds = Math.ceil(parseFloat(milliseconds / 1000) % 60)
        .toString()
        .padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
/**
 * 计算下载网速
 */
function calcNetSpeed(size) {
    let speed = '';
    if (size < 1024) {
        speed = size + ' B';
    } else if (size < Math.pow(1024, 2)) {
        speed = Math.round(size / 1024) + ' KB';
    } else if (size < Math.pow(1024, 3)) {
        speed = Math.round((size / Math.pow(1024, 2)) * 100) / 100 + ' MB';
    } else {
        speed = Math.round((size / Math.pow(1024, 3)) * 100) / 100 + ' GB';
    }
    return speed + '/s';
}

/**
 * 启动下载进程
 */
function downloadTask(tile, callback) {
    let isError = false;
    let isAborted = false;
    let [x, y, z] = tile;
    let src = `http://api0.map.bdimg.com/customimage/tile?&qt=tile&x=${x}&y=${y}&z=${z}&customid=${config.customid || ''}&styles=${config.style ? encodeURIComponent(config.style) : ''}`;
    let req = http
        .get(src, httpOpiton, function(res) {
            let buffer = null;
            let contentLength = Number(res.headers['content-length']);
            if (res.statusCode !== 200) {
                errorCallback(tile, src, callback);
                return;
            }
            res.on('data', chunk => {
                if (!buffer) {
                    buffer = Buffer.from(chunk);
                } else {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            })
                .on('end', () => {
                    if (!isError && !isAborted) {
                        if (buffer && buffer.length === contentLength && res.complete) {
                            successCallback(tile, buffer, callback);
                        } else {
                            errorCallback(tile, src, callback);
                        }
                    }
                })
                .on('aborted', err => {
                    isAborted = true;
                    errorCallback(tile, src, callback);
                });
        })
        .on('error', e => {
            isError = true;
            errorCallback(tile, src, callback);
        })
        .on('timeout', () => {
            req.abort();
        });
}
/**
 * 下载成功回调
 */
function successCallback(tile, buffer, callback) {
    let dir = path.join(config.path, tile[2].toString(), tile[0].toString());
    let fileName = `${tile[1]}.${config.ext || 'png'}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let stream = fs.createWriteStream(path.join(dir, fileName));
    stream.write(buffer);
    stream.end();
    stream.on('close', () => {
        downCount++;
        downSize += Buffer.byteLength(buffer);
        callback();
    });
}
/**
 * 下载失败回调
 */
function errorCallback(tile, src, callback) {
    let key = `x${tile[0]}y${tile[1]}z${tile[2]}`;
    if (errorTilesCount[key] === undefined) {
        errorTilesCount[key] = 0;
    }
    errorTilesCount[key]++;
    if (errorTilesCount[key] >= 1000) {
        errorCount++;
        console.error((key + '下载失败').red);
        fs.writeFileSync(errLogPath, src + '\r\n', { flag: 'a' }, function(err) {});
        callback();
    } else {
        downloadTask(tile, callback);
    }
}
/**
 * 下载回调方法
 */
function downloadCallback(resolve) {
    if (totalCount - errorCount - downCount <= 0) {
        let endTime = new Date();
        clearInterval(timer);
        console.info('-------------------------------------------------------------------------------');
        if (errorCount > 0) {
            console.info(`下载完成，共下载瓦片 ${(totalCount - errorCount).toString().green} 张，失败 ${errorCount.toString().red} 张，用时 ${calcTime(endTime - beginTime).toString().green}`.bold);
            console.info(`失败的瓦片请在err.log中查看`.red);
        } else {
            console.info(`下载完成，共下载瓦片 ${totalCount.toString().green} 张，用时 ${calcTime(endTime - beginTime).toString().green}`.bold);
        }
        resolve();
    }
}
/**
 * 显示进度信息
 */
function showProgressInfo() {
    let splitTime = 1;
    let preCount = 0;
    let preSize = 0;
    timer = setInterval(() => {
        let speed = downCount - preCount;
        console.info(
            `${moment().format('HH:mm:ss')} 速度 ${speed.toString().yellow} 张/秒 ${calcNetSpeed(downSize - preSize).toString().yellow}，已完成 ${
                (Math.floor(((downCount + errorCount) / totalCount) * 10000) / 100 + '%').toString().yellow
            }，剩余 ${(totalCount - downCount - errorCount).toString().yellow} 张，${errorCount > 0 ? '失败 ' + errorCount.toString().red + ' 张，' : ''}预计还需 ${
                (speed > 0 ? calcTime(((totalCount - errorCount - downCount) / speed) * 1000) : '--').toString().yellow
            }`
        );
        preCount = downCount;
        preSize = downSize;
    }, splitTime * 1000);
}

/**
 * 下载瓦片
 */
function downloadTiles(tileList) {
    if (fs.existsSync(errLogPath)) {
        fs.unlinkSync(errLogPath);
    }

    return new Promise((resolve, reject) => {
        totalCount = tileList.length;
        beginTime = new Date();
        console.info(`开始下载，共有瓦片 ${totalCount.toString().yellow} 张`);
        let bagpipe = new Bagpipe(config.threads, {});
        tileList.forEach(tile => {
            bagpipe.push(downloadTask, tile, function() {
                downloadCallback(resolve);
            });
        });
        showProgressInfo();
    });
}

module.exports = downloadTiles;
