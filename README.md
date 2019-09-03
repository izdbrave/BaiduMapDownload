# BaiduMapDownload

##### Nodejs 百度地图瓦片下载器，nodejs 调用下载神器 aria2 下载百度地图瓦片，可在文件./tools/aria2.conf 中修改具体的下载参数，实现最快速下载。

1.执行命令 `npm i` 安装依赖。

2.修改配置文件 config.ini。

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
> style：地图风格，可选值有常规地图样式(normal)、清新蓝风格(light)、黑夜风格(dark)、自然绿风格(grassgreen)、午夜蓝风格(midnight)、浪漫粉风格(pink)、清新蓝绿风格(bluish)、高端灰风格(grayscale)

```ini
path = ./tiles
minLevel = 1
maxLevel = 17
leftTop = 116.22952831687087,37.54514680399567
rightBottom = 117.9797464385945,35.99644032407451
style = normal
```

3.`node main` 或者执行 start.bat 开始下载。
