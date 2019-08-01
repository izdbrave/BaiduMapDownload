/**
 * @ Author: izdbrave
 * @ Create Time: 2019-07-31 16:47:52
 * @ Modified by: izdbrave
 * @ Modified time: 2019-08-01 09:02:07
 * @ Description:启动aria2进程
 */

const path = require('path');
const { spawn } = require('child_process');

let aria2c = spawn(path.join(__dirname, '../tools/aria2c'), [`--conf-path=${path.join(__dirname, '../tools/aria2.conf')}`]);

aria2c.stdout.on('data', data => {
    let str = data.toString();
    if (str.trim()) {
        console.log(str);
    }
});

aria2c.stderr.on('data', data => {
    let str = data.toString();
    if (str.trim()) {
        console.error(str);
    }
});
