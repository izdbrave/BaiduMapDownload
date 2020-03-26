# BaiduMapDownload

##### Nodejs 百度地图瓦片下载器，支持不同风格的瓦片下载，兼容windows，mac，linux，速度飞快，基本可占满宽带。

1.执行命令 `npm i` 安装依赖。

2.修改配置文件 config.ini。

> threads: 下载线程数，建议不要超过5000，过高可能被操作系统限制，导致程序退出。
>
> path：瓦片保存路径
>
> minLevel：瓦片最小级别
>
> maxLevel：瓦片最大级别
>
> leftTop：地图左上角经纬度
>
> rightBottom：地图右下角经纬度
>
> customid：地图风格，可选值有常规地图样式(normal)、清新蓝风格(light)、黑夜风格(dark)、自然绿风格(grassgreen)、午夜蓝风格(midnight)、浪漫粉风格(pink)、清新蓝绿风格(bluish)、高端灰风格(grayscale)
>
> 边界信息和地图风格可通过[map.codezd.com](http://map.codezd.com)获取
>
> style：自定义样式，因为有一些特殊字符，需要加引号

```ini
threads = 1000
path = ./tiles
minLevel = 3
maxLevel = 15
leftTop = 116.22952831687087,37.54514680399567
rightBottom = 117.9797464385945,35.99644032407451
customid = normal
style = ''
```

3.`node main` 或者执行 start.bat 开始下载。