/**
  * 参数：
  *		bescroll: 是否开启模拟滚动，默认：false
  *		scrollBar: 是否打开滚动条，默认：true
  *		barColor: 滚动条颜色，默认：#ff8200
  *		sideUp(): 手指上滑处理事件
  *		sideDown(): 手指下滑处理事件
  *		sideLeft():  手指左滑处理事件
  *		sideRight(): 手指右滑处理事件
  *		click(target): 屏幕点击事件
  *		longClick(target):  长按事件
  */
var BeScroll = function() {
	var datas = {
		scroller: document.body,
		x: 0,    //touchstart的x坐标
		y: 0,    //touchstart的y坐标
		moveY: 0,
		hands: 0,  //手指数
		preventDefault: true,
		bescroll: false,   //是否开启模拟滚动
		scrollBar: true,   //是否开启滚动条
		barColor: '#ff8200',   //滚动条颜色
		curTop: 0, //滚动条当前位置的高度
		maxTop: 0,  //滚动条位置的最大高度
		startTime : null,    //滑动的开始时间，stouchstart的时间
		slideSpeed: 0,  //滑动速度，
		slideDreaction: 1,   //向下为1，向上为-1
		scrollTarget: null,   //滚动目标元素
		request: null,    //requestAnimationFrame 对象
		scrollerHeight: 0,
		parentHeight: 0,
		maxHeight: 0,   //页面最大高度
		lock: false,   //初始化滚动条的互斥锁
		hands: 0
	}, _fn = {
		initRAF : function() {
			/* 功能：初始化requestAnimationFrame 
			 * 描述：1. 统一各浏览器中的方法名为requestAnimationFrame
			 *       2. 不支持requestAnimationFrame的浏览器（如安卓4.3及以下）
			 *          中使用setTimeout代替，提高兼容性
			 */
			var lastTime = 0;
			var vendors = ['ms', 'moz', 'webkit', 'o'];
			for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			}
			if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				window.setTimeout(function() {
					callback(currTime + timeToCall);
				}, timeToCall);
				lastTime = currTime + timeToCall;
			};
		},
		bescroll : function(y) {
			/* 模拟滚动 */
			if (datas.scrollTarget) {
				datas.scrollTarget.scrollTop = parseInt(datas.scrollTarget.scrollTop) + (y - datas.moveY)*-1;
			} else {
				var marginTop = parseInt(datas.scroller.style.marginTop);
				marginTop = marginTop?marginTop:0;
				marginTop = marginTop + (y - datas.moveY);
				if (marginTop < 0 && marginTop > -1*datas.maxHeight) {
					datas.scroller.style.marginTop = marginTop + "px";
					datas.scrollBar.style.top = (-1*datas.parentHeight*marginTop/datas.scrollerHeight) + 'px';
				}
			}
			datas.moveY = y;
		},
		inertialGuidance : function() {
			/* 惯性导航 */
			//cancelAnimationFrame(datas.request);
			datas.slideSpeed -= 0.5;
			if (datas.scrollTarget) {
				var st = datas.scrollTarget.scrollTop;
				st = st?st:0;
				st += datas.slideSpeed*datas.slideDreaction*-1;
				if (st > 0 && st < datas.scrollTarget.scrollHeight) {
					datas.scrollTarget.scrollTop = st;
					if (datas.slideSpeed > 0) {
						datas.request = window.requestAnimationFrame(_fn.inertialGuidance);
					}
				}
			} else {
				var marginTop = parseInt(datas.scroller.style.marginTop);
				marginTop = marginTop?marginTop:0;
				marginTop += datas.slideSpeed*datas.slideDreaction;
				if (marginTop < 0 && marginTop > -1*datas.maxHeight) {
					datas.scroller.style.marginTop = marginTop + "px";
					datas.scrollBar.style.top = (-1*datas.parentHeight*marginTop/datas.scrollerHeight) + 'px';
					if (datas.slideSpeed > 0) {
						datas.request = window.requestAnimationFrame(_fn.inertialGuidance);
					}
				}
			}
		},
		getScrollTarget : function(target) {
			/* 获取滚动目标元素 */
			do {
				if (parseInt(target.clientHeight) < parseInt(target.scrollHeight)  && target != datas.scroller && target != document.documentElement) {
					datas.scrollTarget = target;
					break;
				}
				datas.scrollTarget = null;
				target = target.parentElement;
			}while(target);
		},
		touchstart : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			datas.maxHeight = parseInt(datas.scroller.clientHeight) - parseInt(datas.scroller.parentElement.clientHeight);
			var d = new Date();
			datas.startTime = d.getTime();  //获取滑动开始时间
			touchesstart  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.x = touchesstart[0].pageX;
			datas.y = touchesstart[0].pageY;
			datas.moveY = datas.y;
			_fn.getScrollTarget(event.target);
		},
		touchmove : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			touches  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.hands = touches.length;
			if (datas.hands == 1) {
				datas.bescroll ? _fn.bescroll(touches[0].pageY) : null;  //若开启了模拟滚动则执行模拟滚动
			}
		},
		touchend : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			var d = new Date();
			var endTime = d.getTime(), //滑动结束时间
				touchesend  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			var x1 = parseInt(touchesend[0].pageX),
				y1 = parseInt(touchesend[0].pageY),
				distanceX = x1 - datas.x,
				distanceY = y1 - datas.y;
			if (distanceX >= 100) {  //右滑
				_fn.slideRight && _fn.slideRight();
			} else if (distanceX <= -100) {   //左滑
				_fn.slideLeft && _fn.slideLeft();
			} else if (distanceY >= 100) {   //下滑
				_fn.slideDown && _fn.slideDown();
			} else if (distanceY <= -100) {   //上滑
				_fn.slideUp && _fn.slideUp();
			}
			datas.slideDreaction = distanceY > 0 ? 1 : -1;   //判断滚动方向，上or下
			datas.slideSpeed = Math.round(17*distanceY/(endTime - datas.startTime));  //计算手指滑动速度，单位：px/17ms
			datas.slideSpeed = Math.abs(datas.slideSpeed);   //取绝对值
			if (Math.abs(distanceY) < 10 && Math.abs(distanceX) < 10) {
				if (endTime - datas.startTime >= 700) {
					_fn.longClick && _fn.longClick(event.target);
				} else {
					event.target.click();
					_fn.click && _fn.click(event.target);
				}
			}
			if (datas.bescroll) {
				datas.request = window.requestAnimationFrame(_fn.inertialGuidance);
			}
			datas.x = datas.y = 0;
		},
		initScrollBar : function() {
			//初始化初始化
			if (!datas.lock) {
				datas.lock = true;
				datas.parentHeight = parseInt(datas.scroller.parentElement.clientHeight);
				datas.scrollerHeight = parseInt(datas.scroller.clientHeight);
				datas.lock = false;
				var scrollHeight = datas.parentHeight*datas.parentHeight/datas.scrollerHeight;
				if (scrollHeight < datas.parentHeight) {
					var style = {
							width: '5px',
							height: scrollHeight + 'px',
							background: datas.barColor,
							position: 'fixed',
							right: '0',
							top: '0',
							'z-index': 99999
						};
					datas.scrollBar.setAttribute('class', 'BeScroll-scrollBar');
					for (var s in style) {
						datas.scrollBar.style[s] = style[s];
					}
					datas.scrollBar.style.display = 'block';
				} else {
					datas.scrollBar.style.display = 'none';
				}
			}
		}
	}, _toTop = function() {
		// 回到顶部
		datas.scroller.style.marginTop = 0;
	}, _init = function(params) {
		if (params) {
			/* 初始化用户事件 start */
			datas.bescroll = params.bescroll ? params.bescroll : null;
			datas.scrollBar = params.scrollBar ? params.scrollBar : true;
			datas.barColor = params.barColor ? params.barColor : datas.barColor;
			(params.slideUp && typeof params.slideUp == 'function') ? _fn.slideUp = params.slideUp : null;
			(params.slideDown && typeof params.slideDown == 'function') ? _fn.slideDown = params.slideDown : null;
			(params.slideLeft && typeof params.slideLeft == 'function') ? _fn.slideLeft = params.slideLeft : null;
			(params.slideRight && typeof params.slideRight == 'function') ? _fn.slideRight = params.slideRight : null;
			(params.click && typeof params.click) == 'function' ? _fn.click = params.click : null;
			(params.longClick && typeof params.longClick == 'function') ? _fn.longClick = params.longClick : null;
			/* 初始化用户事件 end */
		}
		datas.scroller.parentElement.style.overflow = 'hidden';
		datas.scroller.parentElement.style.width = '100%';
		datas.scroller.parentElement.style.height = '100%';
		datas.scroller.parentElement.style.position = 'relative';
		datas.scrollerHeight = parseInt(datas.scroller.clientHeight);
		datas.parentHeight = parseInt(datas.scroller.parentElement.clientHeight);
		datas.maxHeight = datas.scrollerHeight - datas.parentHeight;
		_fn.initRAF();
		document.addEventListener('touchstart', _fn.touchstart);
		document.addEventListener('touchmove', _fn.touchmove);
		document.addEventListener('touchend', _fn.touchend);
		/* 初始化滚动条 start */
		if (datas.scrollBar) {
			datas.scrollBar = document.createElement('div');
			/* 当页面内有变化，则重新初始化滚动条 start */
			document.addEventListener("DOMNodeInserted", function (ev) {
				_fn.initScrollBar();
			}, true);
			document.addEventListener("DOMNodeRemoved", function (ev) {
				_fn.initScrollBar();
			}, true);
			/* 当页面内有变化，则重新初始化滚动条 end */
			datas.scrollBar.innerHTML = ' ';
			document.body.appendChild(datas.scrollBar);
		}
		/* 初始化滚动条 end */
	};
	return {
		toTop: _toTop,
		init: _init
	};
}();