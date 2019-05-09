/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/barrage.js":
/*!************************!*\
  !*** ./src/barrage.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/**\r\n * @description \r\n * 航道(channel：danmu运行的通道)与船(boat：承载danmu的dom)：\r\n * \r\n * 整个弹幕区域分为若干个航道，每个航道并列，互不覆盖。\r\n * 航道内每个danmu元素占用一艘船。\r\n * 当船进入航道，到船完全在航道内时，航道被锁住(lock: true)；\r\n * 当船已完全进入航道，此航道解封(lock: false)，允许接纳另一艘船。\r\n * \r\n * 1. 当船已到航道尽头，此船处于空闲状态(free: true)。\r\n * 2. 当航道处于解封状态(lock: false)，且该航道有空闲的船(freeBoatsNumber: [])时，新的弹幕搭乘此空闲的船，不再启用新的船只。\r\n * 3. 当船只空闲一定时间(boatDestroyTimeout)时，销毁此船只[remove]。\r\n * 4. 有新的弹幕时，优先启用航道的顺序：\r\n *  a. 航道处于解封（lock: false）状态\r\n *  b. 有空闲船只（free: true）\r\n *  c. 有非空闲船只(free: false)的航道，这样保证让所有航道的船舶较集中，航道利用率（或者满载率）最大化\r\n *  d. 同时满足条件时，按滞留时间较久的优先启用\r\n *  e. 所有航道都处于锁住状态(lock: true)时，选择空闲船只最多的航道\r\n * 由裁判(judgment)记录每个航道的优先级，分配给新的弹幕\r\n * 5. 同一航道内，规定航行时间(runtime)一致，允许船舶超越\r\n * 6. 每艘船有一个唯一编号（channelId-递增数），用来快速定位空闲船只\r\n * \r\n * channel: [\r\n            {\r\n                id: 0, \r\n                lock: false,\r\n                lockChannelTimeout: 0, // 航道锁定时器 \r\n                freeBoatsNumber: [], // 空闲船只编号\r\n                boats: {\r\n                    '0-0': {\r\n                        channelId: 0,\r\n                        free: false,\r\n                        dom: obj\r\n                    },\r\n                    '0-1': {\r\n                        channelId: 0,\r\n                        free: false,\r\n                        dom: obj\r\n                    }\r\n                }\r\n            }\r\n        ]\r\n * \r\n * 添加弹幕方法：\r\n * barrageObj.push([{'text':'test', 'color':'red'}])\r\n *\r\n * @author smy\r\n * @date 2019-01-22\r\n * @param {*} opts\r\n */\nvar Log = {\n  e: console.error.bind(console),\n  w: console.warn.bind(console),\n  l: console.log.bind(console)\n};\nvar config = {};\nvar channelObj = [];\nvar boatDestroyTimeoutArr = []; // 记录船到彼岸后设置的定时销毁定时器，在重置航道后，进行清除\n\nvar boatNumber = 0; // 船只编号，从0开始\n// queue模式下，弹幕排队时的临时存储队列\n\nvar queueCache = [];\n\nfunction barrage(opts) {\n  var defaults = {\n    container: '.barrage_wrap',\n    // 弹幕容器\n    row: 14,\n    // 弹幕行数\n    horizontalGap: 10,\n    // 每一行的词与词间隙\n    verticalGap: 7,\n    // 弹幕行与行之间的间隙\n    runtime: 12,\n    // 弹幕飘屏的时间\n    fontSize: 22,\n    boatDestroyTimeout: 12,\n    // 船只空闲后多久进行销毁处理，单位： s\n    alignY: 'bottom',\n    // 弹幕位置：top, bottom\n    mode: 'overlap' // queue: 弹幕排队显示，不重叠， overlap: 默认方式，弹幕实时显示，会重叠\n\n  };\n  config = this.params = Object.assign(defaults, opts); // 弹幕开启标志\n\n  this.openFlag = true;\n  this.initChannel();\n} // 航道\n\n\nbarrage.prototype.initChannel = function () {\n  var params = this.params; // 初始化danmu区域\n\n  var containerDom = document.querySelector(params.container);\n  var danmuWrap = document.createElement('div');\n  danmuWrap.className = 'gj_danmu_wrap';\n  danmuWrap.style = 'position: absolute;bottom:0;right:0;width: 100%;height: 100%;overflow: hidden;text-shadow: 0 0 1px #424242;pointer-events: none;';\n  containerDom.appendChild(danmuWrap); // 航道属性\n\n  config.channelWidth = this.params.channelWidth = containerDom.offsetWidth;\n\n  if (containerDom.offsetHeight == 0) {\n    Log.w(\"\\u5F39\\u5E55\\u5BB9\\u5668\\u9AD8\\u5EA6\\u4E0D\\u591F\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5BB9\\u5668 \".concat(params.container));\n    return;\n  } // 控制最大航道数\n\n\n  var max_row = parseInt(containerDom.offsetHeight / (config.fontSize * 1.5 + config.verticalGap));\n  config.row = config.row > max_row ? max_row : config.row; // 初始化航道状态\n\n  channelObj = [];\n\n  for (var i = 0; i < params.row; i++) {\n    channelObj.push({\n      id: i,\n      lock: false,\n      freeBoatsNumber: [],\n      // 空闲船只编号\n      boats: {}\n    });\n  }\n};\n\nbarrage.prototype.resize = function () {\n  document.querySelector('.gj_danmu_wrap').remove();\n  this.initChannel(); // 清空船只销毁的定时器\n\n  if (boatDestroyTimeoutArr.length > 0) {\n    Log.l('[Clear boatDestroyTimeoutArr]:', boatDestroyTimeoutArr);\n    boatDestroyTimeoutArr.forEach(function (val, index) {\n      clearTimeout(val);\n\n      if (index == boatDestroyTimeoutArr.length - 1) {\n        boatDestroyTimeoutArr = [];\n      }\n    });\n  }\n}; // 添加弹幕\n\n\nbarrage.prototype.push = function (data) {\n  // 弹幕关闭状态时\n  if (!this.openFlag) return;\n\n  if (Object.prototype.toString.call(data) == '[object Array]') {\n    var _this = this;\n\n    data.map(function (val) {\n      _this.emitPush.call(_this, val);\n    });\n  } else {\n    this.emitPush.call(this, data);\n  }\n};\n\nbarrage.prototype.emitPush = function (people, channelId) {\n  var targetChannelId;\n\n  if (!channelId) {\n    var freeChannel = this.getTargetChannel();\n\n    if (!freeChannel) {\n      // 没有空闲的航道，弹幕需要排队显示，此时mode一定为queue模式\n      if (config.mode !== 'queue') {\n        Log.w('弹幕模式不匹配，选择航道错误');\n        return;\n      } // 临时存储弹幕，等待航道空闲后释放弹幕\n\n\n      queueCache.push(people);\n      return;\n    }\n\n    targetChannelId = freeChannel['id'];\n  } else {\n    targetChannelId = channelId;\n  }\n\n  if (channelObj[targetChannelId].freeBoatsNumber.length > 0) {\n    // 使用空闲船只\n    var boats = channelObj[targetChannelId].boats,\n        targetNumber = channelObj[targetChannelId].freeBoatsNumber[0] || '';\n    channelObj[targetChannelId].freeBoatsNumber.splice(0, 1);\n    var targetBoat = boats[targetNumber];\n    targetBoat.free = false;\n    targetBoat.reRun(people);\n  } else {\n    // 启用新船只\n    var newBoat = new Boat(targetChannelId, this);\n    newBoat.run(people);\n  }\n}; // 关闭弹幕\n\n\nbarrage.prototype.closeDanmu = function () {\n  this.openFlag = false; // 清空现有弹幕区域\n\n  document.querySelector('.gj_danmu_wrap').innerHTML = '';\n}; // 开启弹幕\n\n\nbarrage.prototype.openDanmu = function () {\n  this.openFlag = true;\n};\n\nbarrage.prototype.getTargetChannel = function () {\n  // 筛选航道\n  var len = channelObj.length; // 裁判，记录航道的优先级\n\n  var judgment = new Array();\n\n  for (var i = 0; i < len; i++) {\n    var channel = channelObj[i]; // 对航道优先级（judgment）进行排序，0为最高级\n\n    var freeBoatsNum = channel.freeBoatsNumber.length;\n    var busyBoatsNum = channel.boats.length - freeBoatsNum;\n\n    if (!channel.lock && busyBoatsNum > 0 && freeBoatsNum > 0) {\n      judgment[0] = judgment[0] ? judgment[0] : [];\n      judgment[0].push({\n        id: channel.id\n      });\n      continue;\n    } else if (!channel.lock && freeBoatsNum > 0) {\n      judgment[1] = judgment[1] ? judgment[1] : [];\n      judgment[1].push({\n        id: channel.id\n      });\n      continue;\n    } else if (!channel.lock) {\n      judgment[2] = judgment[2] ? judgment[2] : [];\n      judgment[2].push({\n        id: channel.id\n      });\n      continue;\n    } else if (channel.lock && freeBoatsNum > 0) {\n      judgment[3] = judgment[3] ? judgment[3] : [];\n      judgment[3].push({\n        id: channel.id\n      });\n      continue;\n    } else if (channel.lock) {//Log.w('此航道被锁住')\n    } else {\n      Log.w('进入未知航道状态');\n    }\n  }\n\n  var isAllLock = true;\n  var targetChannel = {};\n\n  for (var j = 0; j < judgment.length; j++) {\n    if (judgment[j] && judgment[j].length != 0) {\n      isAllLock = false;\n      targetChannel = judgment[j][0];\n      break;\n    }\n  }\n\n  if (isAllLock && config.mode == 'queue') {\n    Log.l('航道满载'); // 排队模式下\n\n    return false;\n  } else {\n    // 航道全部塞满时，选择任一航道\n    targetChannel = isAllLock ? {\n      id: parseInt(Math.random() * config.row)\n    } : targetChannel;\n    return targetChannel;\n  }\n};\n\nbarrage.prototype.checkQueueCache = function (channelId) {\n  // Log.l('开始检测queuecache')\n  if (config.mode !== 'queue' || queueCache.length === 0) return;\n  var people = queueCache.shift(); // Log.l('发现waiting船只：', people)\n\n  this.emitPush(people, channelId);\n};\n\nfunction Boat(channelId, barrageObj) {\n  this.barrage = barrageObj; // 新建dom\n\n  var boatDom = document.createElement('div');\n  boatDom.style = 'visibility: hidden;';\n  document.querySelector('.gj_danmu_wrap').appendChild(boatDom);\n  this.dom = boatDom;\n  this.number = channelId + '-' + boatNumber; // 船只编号\n  // 记录船只信息\n\n  this.channelId = channelId;\n  channelObj[channelId].boats[this.number] = this;\n  boatNumber++;\n}\n\nBoat.prototype.run = function (people, isRepeat) {\n  isRepeat = isRepeat || false;\n  var self = this;\n  this.free = false;\n  var danmuText = people.text,\n      color = people.color || '#fff',\n      runtime = config.runtime + 's',\n      fontSize = config.fontSize + 'px',\n      top = (config.fontSize * 1.5 + config.verticalGap) * this.channelId + 5 + 'px';\n\n  if (danmuText.indexOf('<img') != -1) {\n    // 去除img计算弹幕长度\n    var danmuTextRemoveImgArr = danmuText.split(/<img.*>/),\n        temDanmuText = danmuTextRemoveImgArr.join(''),\n        danmuTextWidth = temDanmuText.length * config.fontSize + 40; // 对弹幕内的图片加样式\n\n    var danmuTextArr = danmuText.split('<img');\n    danmuText = danmuTextArr.join('<img style=\"vertical-align: middle;margin: 0 5px;display:inline-block;height:30px;width:30px;\"');\n  } else {\n    var danmuTextWidth = danmuText.length * config.fontSize;\n  }\n\n  var runDistance = config.channelWidth + danmuTextWidth;\n  this.dom.innerHTML = danmuText; // 如果是再次启用闲置的船只\n\n  if (isRepeat) {\n    this.dom.style = 'color: ' + color + '; font-size: ' + fontSize + ';right:-' + danmuTextWidth + 'px;' + config.alignY + ': ' + top + ';display: block;position: absolute;';\n  } // 运行弹幕\n\n\n  setTimeout(function () {\n    self.dom.style = 'color: ' + color + '; font-size: ' + fontSize + ';right:-' + danmuTextWidth + 'px;' + config.alignY + ': ' + top + ';transform: translateX(-' + runDistance + 'px);-webkit-transform: translateX(-' + runDistance + 'px);transition: transform ' + runtime + ' linear;transition: -webkit-transform ' + runtime + ' linear;display: block;position: absolute;';\n  }, 100);\n  var channel = channelObj[this.channelId]; // 锁住该航道\n\n  channel.lock = true;\n  clearTimeout(channel.lockChannelTimeout); // 当船完全进入航道时，此航道解锁\n\n  var speed = runDistance / config.runtime;\n\n  var _this = this;\n\n  channel.lockChannelTimeout = setTimeout(function () {\n    channel.lock = false; // 如果是queue模式，则检测排队队列有没有待插入的弹幕，有则插入弹幕运行\n\n    _this.barrage.checkQueueCache(channel.id);\n  }, (danmuTextWidth + config.horizontalGap) / speed * 1000); // 当船到航道尽头时，此船空闲，此航道空闲船只数量加一\n  // 防止多次注册监听事件，对于重新启用的船只，不需要再次设置监听\n\n  if (!isRepeat) {\n    this.dom.addEventListener('transitionend', onBoatRunEnd);\n    this.dom.addEventListener('webkitTransitionEnd', onBoatRunEnd);\n  }\n\n  clearTimeout(self.destroyTimeout);\n\n  function onBoatRunEnd() {\n    channel.freeBoatsNumber.push(self.number);\n    self.free = true; // 闲置一定时间后，进行销毁\n\n    self.destroyTimeout = setTimeout(function () {\n      self.destroy();\n    }, config.boatDestroyTimeout * 1000); // 记录定时器，在重置航道后，进行清空\n\n    boatDestroyTimeoutArr.push(self.destroyTimeout);\n  }\n};\n/** \r\n * 重新启用空闲的船只\r\n*/\n\n\nBoat.prototype.reRun = function (people) {\n  this.run(people, true);\n};\n\nBoat.prototype.destroy = function () {\n  var channel = channelObj[this.channelId];\n  clearTimeout(this.destroyTimeout);\n\n  if (channel.boats[this.number]) {\n    // 删除dom对象\n    channel.boats[this.number].dom.remove(); // 删除船只对象\n\n    delete channel.boats[this.number];\n  } // 删除空闲船只编号数组中的编号\n\n\n  var index = channel.freeBoatsNumber.indexOf(this.number);\n  channel.freeBoatsNumber.splice(index, 1);\n};\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (barrage);\n\n//# sourceURL=webpack:///./src/barrage.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _index_less__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.less */ \"./src/index.less\");\n/* harmony import */ var _index_less__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_index_less__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _barrage_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./barrage.js */ \"./src/barrage.js\");\n\n\nvar barrageObj = new _barrage_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"]({\n  row: 5,\n  runtime: 6 //mode: 'queue'\n\n});\nbarrageObj.push([{\n  'text': '非常棒1',\n  'color': 'red'\n}, {\n  'text': '非常棒2',\n  'color': 'red'\n}, {\n  'text': '非常棒3',\n  'color': 'red'\n}, {\n  'text': '非常棒4',\n  'color': 'red'\n}, {\n  'text': '非常棒5',\n  'color': 'red'\n}, {\n  'text': '非常棒6',\n  'color': '#fff'\n}]);\nsetTimeout(function () {\n  barrageObj.push([{\n    'text': '非常棒1',\n    'color': 'red'\n  }, {\n    'text': '非常棒2',\n    'color': 'red'\n  }, {\n    'text': '非常棒3',\n    'color': 'red'\n  }, {\n    'text': '非常棒4',\n    'color': 'red'\n  }, {\n    'text': '非常棒5',\n    'color': 'red'\n  }, {\n    'text': '非常棒6',\n    'color': 'red'\n  }]);\n}, 1000);\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ }),

/***/ "./src/index.less":
/*!************************!*\
  !*** ./src/index.less ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("// removed by extract-text-webpack-plugin\n\n//# sourceURL=webpack:///./src/index.less?");

/***/ })

/******/ });