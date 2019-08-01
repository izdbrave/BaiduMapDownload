const fs = require('fs');
const path = require('path');
const TileLnglatTransform = require('tile-lnglat-transform'); //用于经纬度转换为瓦片坐标
const TileLnglatTransformBaidu = TileLnglatTransform.TileLnglatTransformBaidu;

/**
 * 读取配置
 */
function getConfig() {
    let config = fs.readFileSync(path.join(__dirname, '../config.json')).toString();
    config = JSON.parse(config);
    return {
        x1: config.leftTop[0],
        y1: config.leftTop[1],
        x2: config.rightBottom[0],
        y2: config.rightBottom[1],
        minLevel: config.minLevel,
        maxLevel: config.maxLevel,
        style: config.style
    };
}
/**
 * 获取瓦片列表
 */
function getTileList() {
    let config = getConfig();
    let tileList = [];
    let all = [];
    for (i = config.minLevel; i <= config.maxLevel; i++) {
        all[i] = {};
        p1 = TileLnglatTransformBaidu.lnglatToTile(config.x1, config.y1, i);
        p2 = TileLnglatTransformBaidu.lnglatToTile(config.x2, config.y2, i);
        all[i].t = i;
        all[i].x = [p1.tileX, p2.tileX];
        all[i].y = [p2.tileY, p1.tileY];
    }
    for (let z = config.minLevel; z <= all.length - 1; z++) {
        for (let x = all[z].x[0]; x <= all[z].x[1]; x++) {
            for (let y = all[z].y[0]; y <= all[z].y[1]; y++) {
                let url = `http://online0.map.bdimg.com/tile/?qt=tile&x=${x}&y=${y}&z=${z}&styles=${config.style}&scaler=1&udt=20180711`;
                tileList.push(url);
            }
        }
    }
    return tileList;
}

module.exports = getTileList;
