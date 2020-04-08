/**
 * @ Author: izdbrave
 * @ Create Time: 2019-08-01 09:12:21
 * @ Modified by: izdbrave
 * @ Modified time: 2020-04-08 13:54:35
 * @ Description: 下载瓦片
 */

const path = require('path');

const moment = require('moment');
const fs = require('fs');
const http = require('http');

const TileLnglatTransform = require('tile-lnglat-transform'); //用于经纬度转换为瓦片坐标
const TileLnglatTransformBaidu = TileLnglatTransform.TileLnglatTransformBaidu;

const events = require('events');
const eventEmitter = new events.EventEmitter();

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
let httpOpiton = {
    timeout: 30 * 1000,
}; //请求配置

let tileZ = config.minLevel; //瓦片级别,瓦片Z
let p1 = TileLnglatTransformBaidu.lnglatToTile(config.x1, config.y1, tileZ); //左上角
let p2 = TileLnglatTransformBaidu.lnglatToTile(config.x2, config.y2, tileZ); //右下角
let tileX = p1.tileX; //瓦片X
let tileY = p2.tileY - 1; //瓦片Y
let taskList = new Set(); //任务队列
let taskCount = 0; //已添加任务数量

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
function download(tile) {
    let isError = false;
    let [x, y, z] = tile;
    let src = `http://api0.map.bdimg.com/customimage/tile?&qt=tile&x=${x}&y=${y}&z=${z}&customid=${config.customid || ''}&styles=${config.style ? encodeURIComponent(config.style) : ''}`;
    let errorHandler = () => {
        if (!isError) {
            isError = true;
            errorCallback(tile, src);
        }
    };
    let req = http
        .get(src, httpOpiton, (res) => {
            let buffer = null;
            let contentLength = Number(res.headers['content-length']);
            if (res.statusCode !== 200 || isNaN(contentLength)) {
                errorHandler();
                return;
            }
            res.on('data', (chunk) => {
                if (!buffer) {
                    buffer = Buffer.from(chunk);
                } else {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            })
                .on('end', () => {
                    if (!isError) {
                        if (buffer && buffer.length === contentLength && res.complete) {
                            successCallback(tile, buffer);
                        } else {
                            errorHandler();
                        }
                    }
                })
                .on('aborted', (err) => {
                    errorHandler();
                });
        })
        .on('error', (e) => {
            errorHandler();
        })
        .on('timeout', () => {
            req.abort();
        });
}
/**
 * 下载成功回调
 */
function successCallback(tile, buffer, bb) {
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
        eventEmitter.emit('singleTileComplete', tile);
    });
}
/**
 * 下载失败回调
 */
function errorCallback(tile, src, k, bb) {
    let key = `x${tile[0]}y${tile[1]}z${tile[2]}`;
    if (errorTilesCount[key] === undefined) {
        errorTilesCount[key] = 0;
    }
    errorTilesCount[key]++;
    //失败重试1000万次
    if (errorTilesCount[key] > 10000000) {
        delete errorTilesCount[key];
        errorCount++;
        console.error((key + '下载失败').red);
        fs.writeFileSync(errLogPath, src + '\r\n', { flag: 'a' }, function (err) {});
        eventEmitter.emit('singleTileComplete', tile);
    } else {
        download(tile);
    }
}
/**
 * 下载回调方法
 */
function downloadComplete() {
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
function downloadTiles() {
    if (fs.existsSync(errLogPath)) {
        fs.unlinkSync(errLogPath);
    }
    return new Promise((resolve, reject) => {
        beginTime = new Date();
        totalCount = calcTileCount();
        console.info(`开始下载，共有瓦片 ${totalCount.toString().yellow} 张`);
        eventEmitter.on('singleTileComplete', (tile) => {
            taskList.delete(`x${tile[0]}y${tile[1]}z${tile[2]}`);
            if (taskList.size === 0 && taskCount === totalCount) {
                downloadComplete();
                resolve();
            } else if (taskCount < totalCount) {
                addTask();
            }
        });
        for (let i = 0; i < Math.min(config.threads, totalCount); i++) {
            addTask();
        }
        showProgressInfo();
    });
}

/**
 * 添加任务
 */
function addTask() {
    tileY++;
    if (tileY > p1.tileY) {
        tileY = p2.tileY;
        tileX++;
        if (tileX > p2.tileX) {
            tileZ++;
            if (tileZ <= config.maxLevel) {
                p1 = TileLnglatTransformBaidu.lnglatToTile(config.x1, config.y1, tileZ);
                p2 = TileLnglatTransformBaidu.lnglatToTile(config.x2, config.y2, tileZ);

                tileY = p2.tileY;
                tileX = p1.tileX;
            }
        }
    }
    if (tileZ <= config.maxLevel) {
        let task = [tileX, tileY, tileZ];
        taskList.add(`x${tileX}y${tileY}z${tileZ}`);
        download(task);
        taskCount++;
    }
}
/**
 * 计算瓦片数量
 */
function calcTileCount() {
    let count = 0;
    for (i = config.minLevel; i <= config.maxLevel; i++) {
        let p1 = TileLnglatTransformBaidu.lnglatToTile(config.x1, config.y1, i);
        let p2 = TileLnglatTransformBaidu.lnglatToTile(config.x2, config.y2, i);
        count += (Math.abs(p2.tileX - p1.tileX) + 1) * (Math.abs(p2.tileY - p1.tileY) + 1);
    }
    return count;
}
module.exports = downloadTiles;
