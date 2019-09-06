/**
 * @ Author: izdbrave
 * @ Create Time: 2019-08-01 09:12:21
 * @ Modified by: izdbrave
 * @ Modified time: 2019-09-06 20:08:54
 * @ Description: 下载瓦片
 */

const path = require('path');
const url = require('url');
const Bagpipe = require('bagpipe');
const moment = require('moment');
const colors = require('colors');
const fs = require('fs');
const http = require('http');

const getConfig = require('./getConfig');

let totalCount = 0; //瓦片总数
let downCount = 0; //已下载总数
let errorCount = 0; //出错总数
let beginTime = null; //开始时间
let timer = null; //计时器
let config = getConfig(); //基本配置
let errLogPath = './err.log'; //错误日志
let errorTilesCount = {}; //失败次数记录
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
 * 启动下载进程
 */
function downloadTask(src, callback) {
    let queryParam = url.parse(src, true).query;
    let dir = path.join(config.path, queryParam.z, queryParam.x);
    let fileName = queryParam.y + '.png';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let stream = fs.createWriteStream(path.join(dir, fileName));
    stream.on('close', () => {
        callback();
    });
    stream.on('finish', () => {
        downCount++;
    });
    http.get(src, function(res) {
        let buffer = null;
        res.on('data', function(chunk) {
            if (!buffer) {
                buffer = Buffer.from(chunk);
            } else {
                buffer = Buffer.concat([buffer, chunk]);
            }
            // stream.write(chunk);
        });
        res.on('end', function() {
            stream.write(buffer);
            stream.end();
        });
    }).on('error', e => {
        if (typeof errorTilesCount[src] == 'undefined') {
            errorTilesCount[src] = 0;
        }
        errorTilesCount[src]++;
        if (errorTilesCount[src] > 100) {
            console.error((src + '下载失败').red);
            errorCount++;
            fs.writeFileSync(errLogPath, src + '\r\n', { flag: 'a' }, function(err) {});
            stream.destroy();
        } else {
            downloadTask(src, callback);
        }
    });
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
            console.info(`下载完成，共下载瓦片 ${(totalCount - errorCount).toString().green} 张,失败 ${errorCount.toString().green} 张，用时 ${calcTime(endTime - beginTime).toString().green}`.bold);
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

    timer = setInterval(() => {
        let speed = downCount - preCount;
        console.info(
            `${moment().format('HH:mm:ss')} 速度 ${speed.toString().yellow} 张/秒，已完成 ${(Math.floor(((downCount + errorCount) / totalCount) * 10000) / 100 + '%').toString().yellow}，剩余 ${
                (totalCount - downCount - errorCount).toString().yellow
            } 张，预计还需 ${(speed > 0 ? calcTime(((totalCount - errorCount - downCount) / speed) * 1000) : '--').toString().yellow}`
        );
        preCount = downCount;
    }, splitTime * 1000);
}

/**
 * 下载瓦片
 */
function downloadTiles(urlList) {
    if (fs.existsSync(errLogPath)) {
        fs.unlinkSync(errLogPath);
    }
    return new Promise((resolve, reject) => {
        totalCount = urlList.length;
        beginTime = new Date();
        console.info(`开始下载，共有瓦片 ${totalCount.toString().yellow} 张`);
        let bagpipe = new Bagpipe(config.threads, {});

        urlList.forEach(src => {
            bagpipe.push(downloadTask, src, function() {
                downloadCallback(resolve);
            });
        });
        showProgressInfo();
    });
}

module.exports = downloadTiles;
