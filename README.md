# BaiduMapDownload
##### Nodejs百度地图瓦片下载器，nodejs调用下载神器aria2下载百度地图瓦片，可在文件./tools/aria2.conf中修改具体的下载参数，实现最快速下载。

1.执行命令 `npm i` 安装依赖。

2.修改配置文件config.json。

> ​	minLevel：瓦片最小级别
>
> ​	maxLevel：瓦片最大级别
>
> ​	leftTop：地图左上角经纬度
>
> ​	rightBottom：地图右下角经纬度
>
> ​	style：地图风格
>
> ​	path：瓦片保存路径

```json
{
    "minLevel": 1,
    "maxLevel": 13,
    "leftTop": [115.922777, 37.475752],
    "rightBottom": [118.673173, 35.717931],
    "style": "pl",
    "path": "G:/bdtiles"
}

```

3.`node main` 或者执行start.bat开始下载。