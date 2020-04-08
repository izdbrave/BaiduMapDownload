/**
 * @ Author: izdbrave
 * @ Create Time: 2019-07-31 16:29:07
 * @ Modified by: izdbrave
 * @ Modified time: 2020-04-08 13:41:38
 * @ Description:百度地图瓦片下载
 */
require('colors');
const readlineSync = require('readline-sync');
const downloadTiles = require('./libs/downloadTiles');
console.log(
    `
*****************************************************
                百度地图瓦片下载器 v1.1
                 Powered By 旅行者1号
*****************************************************
`.trim().bold
);
// 下载瓦片
downloadTiles().then(() => {
    readlineSync.keyIn();
    process.exit();
});
