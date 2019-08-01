/**
 * @ Author: izdbrave
 * @ Create Time: 2019-07-31 16:29:07
 * @ Modified by: izdbrave
 * @ Modified time: 2019-08-01 09:01:26
 * @ Description:百度地图下载
 */

const getTileList = require('./libs/getTileList');
const download = require('./libs/download');
require('./libs/aria2process');

let tileList = getTileList(); //获取瓦片列表

download(tileList); //下载瓦片
