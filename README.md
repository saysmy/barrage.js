# barrage.js
Simple barrage plugin for web.  一个轻巧简单的用于web开发的弹幕插件

## Usage
```
yarn build
yarn watch
```

```
let barrageObj = new Barrage({
    row: 5,
    runtime: 6,
    //mode: 'queue' // 弹幕的排队模式（queue）和重叠模式（默认）
})

barrageObj.push([
    {'text': '非常棒1', 'color': 'red'},
    {'text': '非常棒2', 'color': 'red'},
    {'text': '非常棒3', 'color': 'red'},
    {'text': '非常棒4', 'color': 'red'},
    {'text': '非常棒5', 'color': 'red'},
    {'text': '非常棒6', 'color': '#fff'}
])
```