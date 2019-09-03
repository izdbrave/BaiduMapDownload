/**
 * @ Author: izdbrave
 * @ Create Time: 2019-09-03 11:42:57
 * @ Modified by: izdbrave
 * @ Modified time: 2019-09-03 13:43:12
 * @ Description: 读取配置文件
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');

/**
 * 读取配置文件
 */
function getConfig() {
    let config = fs
        .readFileSync(path.join(__dirname, '../config.ini'))
        .toString()
        .replace(/\\+/g, '\\\\');
    config = ini.parse(config);
    config.leftTop = config.leftTop.split(',');
    config.rightBottom = config.rightBottom.split(',');
    config.leftTop.forEach(c => {
        c = Number(c);
    });
    config.rightBottom.forEach(c => {
        c = Number(c);
    });
    return {
        x1: config.leftTop[0],
        y1: config.leftTop[1],
        x2: config.rightBottom[0],
        y2: config.rightBottom[1],
        minLevel: config.minLevel,
        maxLevel: config.maxLevel,
        style: config.style,
        path: config.path
    };
}

module.exports = getConfig;
