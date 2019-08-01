/**
 * @ Author: izdbrave
 * @ Create Time: 2019-07-31 16:29:07
 * @ Modified by: izdbrave
 * @ Modified time: 2019-08-01 10:13:31
 * @ Description:百度地图下载
 */

const getTileList = require('./libs/getTileList');
const download = require('./libs/download');
require('./libs/aria2process');

//获取瓦片列表
let tileList = getTileList();

//下载瓦片
download(tileList).then(() => {
    process.exit();
});
