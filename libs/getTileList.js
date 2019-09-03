/**
 * @ Author: izdbrave
 * @ Create Time: 2019-08-01 09:12:21
 * @ Modified by: izdbrave
 * @ Modified time: 2019-09-03 13:41:40
 * @ Description: 获取瓦片列表
 */

const TileLnglatTransform = require('tile-lnglat-transform'); //用于经纬度转换为瓦片坐标
const TileLnglatTransformBaidu = TileLnglatTransform.TileLnglatTransformBaidu;
const getConfig = require('./getConfig');

/**
 * 获取瓦片列表
 */
function getTileList() {
    let config = getConfig();
    let tileList = [];
    let all = [];
    for (i = config.minLevel; i <= config.maxLevel; i++) {
        all[i] = {};
        let p1 = TileLnglatTransformBaidu.lnglatToTile(config.x1, config.y1, i);
        let p2 = TileLnglatTransformBaidu.lnglatToTile(config.x2, config.y2, i);
        all[i].t = i;
        all[i].x = [p1.tileX, p2.tileX];
        all[i].y = [p2.tileY, p1.tileY];
    }
    for (let z = config.minLevel; z <= all.length - 1; z++) {
        for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
            for (let y = all[z].y[0]; y <= all[z].y[1]; y++) {
                let url = `http://api0.map.bdimg.com/customimage/tile?x=${x}&y=${y}&z=${z}&customid=${config.style}`;
                tileList.push(url);
            }
        }
    }
    return tileList;
}

module.exports = getTileList;
