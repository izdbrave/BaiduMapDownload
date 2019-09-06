/**
 * @ Author: izdbrave
 * @ Create Time: 2019-07-31 16:29:07
 * @ Modified by: izdbrave
 * @ Modified time: 2019-09-04 14:55:21
 * @ Description:百度地图瓦片下载
 */

const getTileList = require('./libs/getTileList');
const downloadTiles = require('./libs/downloadTiles');

//获取瓦片列表
let tileList = getTileList();

//下载瓦片
downloadTiles(tileList).then(() => {
    process.exit();
});
