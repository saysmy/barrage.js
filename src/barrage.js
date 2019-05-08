/**
 * @description 
 * 航道(channel：danmu运行的通道)与船(boat：承载danmu的dom)：
 * 
 * 整个弹幕区域分为若干个航道，每个航道并列，互不覆盖。
 * 航道内每个danmu元素占用一艘船。
 * 当船进入航道，到船完全在航道内时，航道被锁住(lock: true)；
 * 当船已完全进入航道，此航道解封(lock: false)，允许接纳另一艘船。
 * 
 * 1. 当船已到航道尽头，此船处于空闲状态(free: true)。
 * 2. 当航道处于解封状态(lock: false)，且该航道有空闲的船(freeBoatsNumber: [])时，新的弹幕搭乘此空闲的船，不再启用新的船只。
 * 3. 当船只空闲一定时间(boatDestroyTimeout)时，销毁此船只[remove]。
 * 4. 有新的弹幕时，优先启用航道的顺序：
 *  a. 航道处于解封（lock: false）状态
 *  b. 有空闲船只（free: true）
 *  c. 有非空闲船只(free: false)的航道，这样保证让所有航道的船舶较集中，航道利用率（或者满载率）最大化
 *  d. 同时满足条件时，按滞留时间较久的优先启用
 *  e. 所有航道都处于锁住状态(lock: true)时，选择空闲船只最多的航道
 * 由裁判(judgment)记录每个航道的优先级，分配给新的弹幕
 * 5. 同一航道内，规定航行时间(runtime)一致，允许船舶超越
 * 6. 每艘船有一个唯一编号（channelId-递增数），用来快速定位空闲船只
 * 
 * channel: [
            {
                id: 0, 
                lock: false,
                lockChannelTimeout: 0, // 航道锁定时器 
                freeBoatsNumber: [], // 空闲船只编号
                boats: {
                    '0-0': {
                        channelId: 0,
                        free: false,
                        dom: obj
                    },
                    '0-1': {
                        channelId: 0,
                        free: false,
                        dom: obj
                    }
                }
            }
        ]
 * 
 * 添加弹幕方法：
 * barrageObj.push([{'text':'test', 'color':'red'}])
 *
 * @author smy
 * @date 2019-01-22
 * @param {*} opts
 */
const Log = {
    e: console.error.bind(console),
    w: console.warn.bind(console),
    l: console.log.bind(console)
}

var config = {};
var channelObj = [];
var boatDestroyTimeoutArr = []; // 记录船到彼岸后设置的定时销毁定时器，在重置航道后，进行清除
var boatNumber = 0; // 船只编号，从0开始

// queue模式下，弹幕排队时的临时存储队列
var queueCache = []

function barrage(opts){
    var defaults = {
        container: '.barrage_wrap', // 弹幕容器
        row: 14, // 弹幕行数
        horizontalGap: 10, // 每一行的词与词间隙
        verticalGap: 7, // 弹幕行与行之间的间隙
        runtime: 12, // 弹幕飘屏的时间
        fontSize: 22,
        boatDestroyTimeout: 12, // 船只空闲后多久进行销毁处理，单位： s
        alignY: 'bottom', // 弹幕位置：top, bottom
        mode: 'overlap' // queue: 弹幕排队显示，不重叠， overlap: 默认方式，弹幕实时显示，会重叠
    }

    config = this.params = Object.assign(defaults, opts)
    
    // 弹幕开启标志
    this.openFlag = true;

    this.initChannel()
}
  
// 航道
barrage.prototype.initChannel = function(){
    var params = this.params;
    // 初始化danmu区域
    var containerDom = document.querySelector(params.container);
    var danmuWrap = document.createElement('div');
    danmuWrap.className = 'gj_danmu_wrap';
    danmuWrap.style = 'position: absolute;bottom:0;right:0;width: 100%;height: 100%;overflow: hidden;text-shadow: 0 0 1px #424242;pointer-events: none;';
    containerDom.appendChild(danmuWrap);

    // 航道属性
    config.channelWidth = this.params.channelWidth = containerDom.offsetWidth

    if(containerDom.offsetHeight == 0){
        Log.w(`弹幕容器高度不够，请检查容器 ${params.container}`)
        return
    }

    // 控制最大航道数
    var max_row = parseInt(containerDom.offsetHeight/(config.fontSize*1.5 + config.verticalGap))
    config.row = config.row > max_row ? max_row : config.row

    // 初始化航道状态
    channelObj = []
    for(var i = 0; i<params.row; i++){
        channelObj.push({
            id: i,
            lock: false,
            freeBoatsNumber: [], // 空闲船只编号
            boats: {}
        })
    }
}

barrage.prototype.resize = function(){
    document.querySelector('.gj_danmu_wrap').remove()
    this.initChannel()

    // 清空船只销毁的定时器
    if(boatDestroyTimeoutArr.length > 0){
        console.log('[Clear boatDestroyTimeoutArr]:', boatDestroyTimeoutArr)            
        boatDestroyTimeoutArr.forEach(function(val, index){
            clearTimeout(val)
            if(index == boatDestroyTimeoutArr.length - 1){
                boatDestroyTimeoutArr = []
            }
        })
    }
}

// 添加弹幕
barrage.prototype.push = function(data){
    // 弹幕关闭状态时
    if(!this.openFlag) return

    if(Object.prototype.toString.call(data) == '[object Array]'){
        var _this = this
        data.map(function(val){
            _this.emitPush.call(_this, val)
        })
    }else{
        this.emitPush.call(this, data)
    }
    
}

barrage.prototype.emitPush = function(people, channelId){
    var targetChannelId;
    if(!channelId){
        var freeChannel = this.getTargetChannel()
        if(!freeChannel){
            // 没有空闲的航道，弹幕需要排队显示，此时mode一定为queue模式
            if(config.mode !== 'queue'){
                console.warn('弹幕模式不匹配，选择航道错误')
                return
            }
            // 临时存储弹幕，等待航道空闲后释放弹幕
            queueCache.push(people)
            return
        }
    
        targetChannelId = freeChannel['id'];
    }else{
        targetChannelId = channelId;
    }

    if(channelObj[targetChannelId].freeBoatsNumber.length > 0){
        // 使用空闲船只
        var boats = channelObj[targetChannelId].boats,
        targetNumber = channelObj[targetChannelId].freeBoatsNumber[0] || '';

        channelObj[targetChannelId].freeBoatsNumber.splice(0, 1);
            
        var targetBoat = boats[targetNumber];
        targetBoat.free = false
        targetBoat.reRun(people)
    }else{
        // 启用新船只
        var newBoat = new Boat(targetChannelId, this);
        newBoat.run(people);
    }
}

// 关闭弹幕
barrage.prototype.closeDanmu = function(){
    this.openFlag = false;
    // 清空现有弹幕区域
    document.querySelector('.gj_danmu_wrap').innerHTML = '';
}

// 开启弹幕
barrage.prototype.openDanmu = function(){
    this.openFlag = true;
    
}

barrage.prototype.getTargetChannel = function(){
    // 筛选航道
    var len = channelObj.length;

    // 裁判，记录航道的优先级
    var judgment = new Array();

    for(var i = 0; i < len; i++){
        var channel = channelObj[i]
        
        // 对航道优先级（judgment）进行排序，0为最高级
        var freeBoatsNum = channel.freeBoatsNumber.length
        var busyBoatsNum = channel.boats.length - freeBoatsNum

        if(!channel.lock && busyBoatsNum > 0 && freeBoatsNum > 0){
            judgment[0] = judgment[0] ? judgment[0] : []
            judgment[0].push({id: channel.id})
            continue;
        }else if(!channel.lock && freeBoatsNum > 0){
            judgment[1] = judgment[1] ? judgment[1] : []
            judgment[1].push({id: channel.id})
            continue;
        }else if(!channel.lock){
            judgment[2] = judgment[2] ? judgment[2] : []
            judgment[2].push({id: channel.id})
            continue;
        }else if(channel.lock && freeBoatsNum > 0){
            judgment[3] = judgment[3] ? judgment[3] : []
            judgment[3].push({id: channel.id})
            continue;
        }else if(channel.lock){
            //console.log('此航道被锁住')
        }else{
            console.warn('进入未知航道状态')
        }
    }

    var isAllLock = true;
    var targetChannel = {};
    for(var j = 0; j < judgment.length; j++){
        if(judgment[j] && judgment[j].length != 0) {
            isAllLock = false;
            targetChannel = judgment[j][0]
            break;
        }
    }

    if(isAllLock && config.mode == 'queue'){
        Log.l('航道满载')
        // 排队模式下
        return false
    }else{
        // 航道全部塞满时，选择任一航道
        targetChannel = isAllLock ? {id: parseInt(Math.random()*config.row)} : targetChannel
        return targetChannel
    }
}

barrage.prototype.checkQueueCache = function(channelId){
    // Log.l('开始检测queuecache')
    if(config.mode !== 'queue' || queueCache.length === 0) return

    var people = queueCache.shift()
    // Log.l('发现waiting船只：', people)
    this.emitPush(people, channelId)

}

function Boat(channelId, barrageObj){
    this.barrage = barrageObj
    // 新建dom
    var boatDom = document.createElement('div');
    boatDom.style = 'visibility: hidden;'
    document.querySelector('.gj_danmu_wrap').appendChild(boatDom);
    
    this.dom = boatDom;
    this.number = channelId + '-' + boatNumber;  // 船只编号

    // 记录船只信息
    this.channelId = channelId;
    channelObj[channelId].boats[this.number] = this; 
    boatNumber++;
}

Boat.prototype.run = function(people, isRepeat){
    isRepeat = isRepeat || false
    
    var self = this;
    this.free = false;

    var danmuText = people.text,
        color = people.color || '#fff',
        runtime = config.runtime + 's',
        fontSize = config.fontSize + 'px',
        top = (config.fontSize*1.5 + config.verticalGap)*this.channelId + 5 + 'px';

    if(danmuText.indexOf('<img') != -1){
        // 去除img计算弹幕长度
        var danmuTextRemoveImgArr = danmuText.split(/<img.*>/),
            temDanmuText = danmuTextRemoveImgArr.join(''),
            danmuTextWidth = temDanmuText.length*config.fontSize + 40;

        // 对弹幕内的图片加样式
        var danmuTextArr = danmuText.split('<img');
        danmuText = danmuTextArr.join('<img style="vertical-align: middle;margin: 0 5px;display:inline-block;height:30px;width:30px;"')
    }else{
        var danmuTextWidth = danmuText.length*config.fontSize;
    }
    var runDistance = config.channelWidth + danmuTextWidth

    this.dom.innerHTML = danmuText;
        
    // 如果是再次启用闲置的船只
    if(isRepeat){
        this.dom.style = 'color: '+ color +
                    '; font-size: '+ fontSize +
                    ';right:-'+ danmuTextWidth +
                    'px;'+ config.alignY +': '+ top +
                    ';display: block;position: absolute;';
    }

    // 运行弹幕
    setTimeout(function(){
        self.dom.style = 'color: '+ color +
                '; font-size: '+ fontSize +
                ';right:-'+ danmuTextWidth +
                'px;'+ config.alignY +': '+ top +
                ';transform: translateX(-'+ runDistance +
                'px);-webkit-transform: translateX(-'+ runDistance +
                'px);transition: transform '+ runtime +
                ' linear;transition: -webkit-transform '+ runtime +
                ' linear;display: block;position: absolute;';
    }, 100);

    var channel = channelObj[this.channelId];
    // 锁住该航道
    channel.lock = true;
    clearTimeout(channel.lockChannelTimeout)

    // 当船完全进入航道时，此航道解锁
    var speed = runDistance/config.runtime;
    var _this = this
    channel.lockChannelTimeout = setTimeout(function(){
        channel.lock = false

        // 如果是queue模式，则检测排队队列有没有待插入的弹幕，有则插入弹幕运行
        _this.barrage.checkQueueCache(channel.id)
    }, (danmuTextWidth + config.horizontalGap)/speed*1000)

    // 当船到航道尽头时，此船空闲，此航道空闲船只数量加一
    // 防止多次注册监听事件，对于重新启用的船只，不需要再次设置监听
    if(!isRepeat){
        this.dom.addEventListener('transitionend', onBoatRunEnd)
        this.dom.addEventListener('webkitTransitionEnd', onBoatRunEnd)
    }
    
    clearTimeout(self.destroyTimeout);
    function onBoatRunEnd(){
        channel.freeBoatsNumber.push(self.number);
        self.free = true;

        // 闲置一定时间后，进行销毁
        self.destroyTimeout = setTimeout(function(){
            self.destroy()
        }, config.boatDestroyTimeout*1000)
        // 记录定时器，在重置航道后，进行清空
        boatDestroyTimeoutArr.push(self.destroyTimeout);
    }
}


/** 
 * 重新启用空闲的船只
*/
Boat.prototype.reRun = function(people){
    this.run(people, true);
}

Boat.prototype.destroy = function(){
    var channel = channelObj[this.channelId]
    clearTimeout(this.destroyTimeout)

    if(channel.boats[this.number]){
        // 删除dom对象
        channel.boats[this.number].dom.remove()
        // 删除船只对象
        delete(channel.boats[this.number])
    }

    // 删除空闲船只编号数组中的编号
    var index = channel.freeBoatsNumber.indexOf(this.number)
    channel.freeBoatsNumber.splice(index, 1)
}

export default barrage
