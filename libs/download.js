const fs = require('fs');
const underscore = require('underscore');
const path = require('path');
const Aria2 = require('aria2');
const url = require('url');

const aria2 = new Aria2({
    host: 'localhost',
    port: 6800,
    secure: false,
    secret: 'izdbrave',
    path: '/jsonrpc'
});

aria2
    .open()
    .then()
    .catch(err => console.error('error', err));

let config = fs
    .readFileSync(path.join(__dirname, '../config.json'))
    .toString()
    .replace(/\\+/g, '\\\\');
config = JSON.parse(config);
/**
 * 计算时间
 */
function calcTime(milliseconds) {
    let hours = parseInt(milliseconds / 1000 / 60 / 60)
        .toString()
        .padStart(2, '0');
    let minutes = (parseInt(milliseconds / 1000 / 60) % 60).toString().padStart(2, '0');
    let seconds = (parseInt(milliseconds / 1000) % 60).toString().padStart(2, '0');
    let time = '';
    if (Number(hours)) {
        time += `${hours}:`;
    }
    if (Number(hours) || Number(minutes)) {
        time += `${minutes}:`;
    }
    time += `${seconds}`;
    return time;
}
/**
 * 下载瓦片
 */
function download(urlList) {
    return new Promise((resolve, reject) => {
        console.info(`开始下载，共有瓦片${urlList.length}张`);
        let batch = urlList.map((src, index) => {
            let queryParam = url.parse(src, true).query;
            let dir = path.join(config.path, queryParam.z, queryParam.x);
            let out = queryParam.y + '.png';
            return ['addUri', [src], { dir, out }];
        });
        let sameCount = 1000;
        var batchArr = underscore.chunk(batch, sameCount);
        let downCount = 0;
        let preDownCount = 0;
        let curIndex = 0;
        let beginTime = new Date();

        aria2.on('onDownloadComplete', params => {
            downCount++;
            var downloadIndex = Math.floor(downCount / sameCount);
            if (curIndex < downloadIndex && downloadIndex + 1 < batchArr.length) {
                curIndex = downloadIndex;
                aria2.batch(batchArr[curIndex + 1]).then(msg => {});
            }
            if (batch.length - downCount == 0) {
                aria2.close().then(() => {
                    let endTime = new Date();
                    console.info(`下载完成，共下载瓦片 ${batch.length} 张，用时 ${calcTime(endTime - beginTime)}`);
                    resolve();
                });
            }
        });

        aria2.on('onDownloadError', params => {
            console.error('DownloadError', params);
        });
        aria2.batch(batchArr[curIndex]).then(msg => {});
        if (batchArr.length > curIndex + 1) {
            aria2.batch(batchArr[curIndex + 1]).then(msg => {});
        }
        let splitTime = 1;
        setInterval(() => {
            let speed = (downCount - preDownCount) / splitTime;
            if (speed > 0) {
                console.info(`下载速度：${speed} 张/秒，预计还需 ${calcTime(((batch.length - downCount) / speed) * 1000)}`);
            } else {
                // console.info(`下载速度：${speed}张/秒`);
            }
            preDownCount = downCount;
        }, splitTime * 1000);
    });
}

module.exports = download;
