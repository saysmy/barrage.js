import './index.less'
import Barrage from './barrage.js'

let barrageObj = new Barrage({
    row: 5,
    runtime: 6,
    //mode: 'queue'
})

barrageObj.push([
    {'text': '非常棒1', 'color': 'red'},
    {'text': '非常棒2', 'color': 'red'},
    {'text': '非常棒3', 'color': 'red'},
    {'text': '非常棒4', 'color': 'red'},
    {'text': '非常棒5', 'color': 'red'},
    {'text': '非常棒6', 'color': '#fff'}
])

setTimeout(function(){
    barrageObj.push([
        {'text': '非常棒1', 'color': 'red'},
        {'text': '非常棒2', 'color': 'red'},
        {'text': '非常棒3', 'color': 'red'},
        {'text': '非常棒4', 'color': 'red'},
        {'text': '非常棒5', 'color': 'red'},
        {'text': '非常棒6', 'color': 'red'}
    ])
    
}, 1000)