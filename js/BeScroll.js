/**
  * 参数：
  *		bescroll: 是否开启模拟滚动，默认：false
  *		enableScrollBar: 是否打开滚动条，默认：true
  *		barColor: 滚动条颜色，默认：#ff8200
  *		slideUp(): 手指上滑处理事件
  *		slideDown(): 手指下滑处理事件
  *		slideLeft():  手指左滑处理事件
  *		slideRight(): 手指右滑处理事件
  *		touchMove(curX, curY, disX, disY):  手指滑动事件,参数：
  *										curX：当前X坐标，
  *										curY：当前Y坐标
  *										disX: x轴位移
  *										disY：y轴位移
  *		noXSlide(): 滑动取消事件，X轴滑动位移不足，不触发左/右滑事件
  *		noYSlide(): 滑动取消事件，Y轴滑动位移不足，不触发上/下滑事件
  *		click(target): 屏幕点击事件
  *		longClick(target):  长按事件
  *		reachBottom(): 到达底部事件
  *		toTop():   回到顶部，没有滚动动画
  */
var BeScroll = function() {
	var datas = {
		scroller: document.body,
		x: 0,    //touchstart的x坐标
		y: 0,    //touchstart的y坐标
		mx: 0,    //touchmove的x坐标
		my: 0,    //touchmove的xy坐标
		lastMoveY: 0,  //上一次的Y坐标
		hands: 0,  //手指数
		preventDefault: true,
		bescroll: false,   //是否开启模拟滚动
		enableScrollBar: true,   //是否开启滚动条
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
		maxScrollerMarginTop: 0,   //滚动条的最大margintop
		lock: false,   //初始化滚动条的互斥锁
		hands: 0,
		isScrolling: false,
		lastMarginTop: 0
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
			if (datas.scrollTarget) {   //若目标元素可滚动，则滚动目标元素
				datas.scrollTarget.scrollTop = parseInt(datas.scrollTarget.scrollTop) + (y - datas.lastMoveY)*-1;
			} else {   //否则滚动 scroller
				var marginTop = parseInt(datas.scroller.style.marginTop),
					lastMarginTop = 0,
					distance = y - datas.lastMoveY;
				marginTop = marginTop?marginTop:0;
				lastMarginTop = marginTop;
				if (marginTop + distance < datas.maxScrollerMarginTop) {
					marginTop = datas.maxScrollerMarginTop;
				} else {
					marginTop = marginTop + distance;
				}
				if (distance > 0 && marginTop > 0) {
					marginTop = 0;
				}
				datas.scroller.style.marginTop = marginTop + "px";
				datas.scrollBar.style.top = (-1*datas.parentHeight*marginTop/datas.scrollerHeight) + 'px';
				if (marginTop == datas.maxScrollerMarginTop && lastMarginTop > marginTop) {
					_fn.reachBottom && _fn.reachBottom();
				}
			}
			datas.lastMoveY = y;
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
				if (marginTop < 0 && marginTop > datas.maxScrollerMarginTop) {
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
		isFrom : function(tag) {
			//判断目标元素是否未表单
			if (tag == "INPUT" || tag == "TEXTAREA") {
				return true;
			} else {
				return false;
			}
		},
		touchstart : function(event) {
			if (_fn.isFrom(event.target.tagName)) return; //若目标元素为表单，则按默认事件处理
			if (datas.preventDefault) { event.preventDefault(); }
			datas.maxScrollerMarginTop = -1*(parseInt(datas.scroller.clientHeight) - parseInt(datas.scroller.parentElement.clientHeight));
			if (datas.maxScrollerMarginTop > 0) {
				datas.maxScrollerMarginTop = 0;
			}
			var d = new Date();
			datas.startTime = d.getTime();  //获取滑动开始时间
			touchesstart  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.x = touchesstart[0].pageX;
			datas.y = touchesstart[0].pageY;
			datas.mx = touchesstart[0].pageX;
			datas.my = touchesstart[0].pageY;
			datas.lastMoveY = datas.y;
			_fn.getScrollTarget(event.target);
		},
		touchmove : function(event) {
			if (_fn.isFrom(event.target.tagName)) return; //若目标元素为表单，则按默认事件处理
			if (datas.isScrolling) return;
			datas.isScrolling = true;
			if (datas.preventDefault) { event.preventDefault(); }
			touches  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.hands = touches.length;
			if (datas.hands == 1) {
				datas.bescroll ? _fn.bescroll(touches[0].pageY) : null;  //若开启了模拟滚动则执行模拟滚动
			}
			if (_fn.userTouchMove) {
				if (datas.mx != 0 && datas.my != 0) {
					var disX = touches[0].pageX - datas.mx,
						disY = touches[0].pageXY - datas.my;
					_fn.userTouchMove(touches[0].pageX, touches[0].pageY, disX, disY);
				}
				datas.mx = touches[0].pageX;
				datas.my = touches[0].pageY;
			}
			datas.isScrolling = false;
		},
		touchend : function(event) {
			if (_fn.isFrom(event.target.tagName)) return; //若目标元素为表单，则按默认事件处理
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
			} else {
				_fn.noXSlide && _fn.noXSlide();
			}

			if (distanceY >= 100) {   //下滑
				_fn.slideDown && _fn.slideDown();
			} else if (distanceY <= -100) {   //上滑
				_fn.slideUp && _fn.slideUp();
			} else {
				_fn.noYSlide && _fn.noYSlide();
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
			//初始化滚动条
			if (!datas.lock && datas.scrollBar) {
				datas.lock = true;
				datas.parentHeight = parseInt(datas.scroller.parentElement.clientHeight);
				datas.scrollerHeight = parseInt(datas.scroller.clientHeight);
				datas.maxScrollerMarginTop = -1*(datas.scrollerHeight - datas.parentHeight);
				if (datas.maxScrollerMarginTop > 0) {
					datas.maxScrollerMarginTop = 0;
				}
				var scrollHeight = datas.parentHeight*datas.parentHeight/datas.scrollerHeight,
					marginTop = parseInt(datas.scroller.style.marginTop);
				marginTop = marginTop?marginTop:0;
				if (marginTop <= datas.maxScrollerMarginTop) {
					datas.scroller.style.marginTop = datas.maxScrollerMarginTop + "px";
				}
				if (scrollHeight < datas.parentHeight) {
					var style = {
							width: '5px',
							height: scrollHeight + 'px',
							background: datas.barColor,
							position: 'fixed',
							right: '0',
							top: (-1*datas.parentHeight*marginTop/datas.scrollerHeight) + "px",
							'z-index': 99999
						};
					datas.scrollBar.setAttribute('class', 'BeScroll-scrollBar');
					for (var s in style) {
						datas.scrollBar.style[s] = style[s];
					}
					datas.scrollBar.style.display = 'block';
				} else {
					_toTop();
					datas.scrollBar.style.display = 'none';
				}
				datas.lock = false;
			}
		}
	}, _toTop = function() {
		// 回到顶部
		datas.scroller.style.marginTop = 0;
	}, _init = function(params) {
		if (params) {
			/* 初始化用户事件 start */
			datas.bescroll = params.bescroll ? params.bescroll : null;
			datas.enableScrollBar = params.enableScrollBar ? params.enableScrollBar : true;
			datas.barColor = params.barColor ? params.barColor : datas.barColor;
			(params.slideUp && typeof params.slideUp == 'function') ? _fn.slideUp = params.slideUp : null;
			(params.slideDown && typeof params.slideDown == 'function') ? _fn.slideDown = params.slideDown : null;
			(params.slideLeft && typeof params.slideLeft == 'function') ? _fn.slideLeft = params.slideLeft : null;
			(params.slideRight && typeof params.slideRight == 'function') ? _fn.slideRight = params.slideRight : null;
			(params.noXSlide && typeof params.noXSlide == 'function') ? _fn.noXSlide = params.noXSlide : null;
			(params.noYSlide && typeof params.noYSlide == 'function') ? _fn.noYSlide = params.noYSlide : null;
			(params.click && typeof params.click) == 'function' ? _fn.click = params.click : null;
			(params.longClick && typeof params.longClick == 'function') ? _fn.longClick = params.longClick : null;
			(params.touchmove && typeof params.touchmove == 'function') ? _fn.userTouchMove = params.touchmove : null;
			(params.reachBottom && typeof params.reachBottom == 'function') ? _fn.reachBottom = params.reachBottom : null;
			/* 初始化用户事件 end */
		}
		datas.scroller.parentElement.style.overflow = 'hidden';
		datas.scroller.parentElement.style.width = '100%';
		datas.scroller.parentElement.style.height = '100%';
		datas.scroller.parentElement.style.position = 'relative';
		datas.scrollerHeight = parseInt(datas.scroller.clientHeight);
		datas.parentHeight = parseInt(datas.scroller.parentElement.clientHeight);
		datas.maxScrollerMarginTop = -1*(datas.scrollerHeight - datas.parentHeight);
		_fn.initRAF();
		document.addEventListener('touchstart', _fn.touchstart);
		document.addEventListener('touchmove', _fn.touchmove);
		document.addEventListener('touchend', _fn.touchend);
		/* 初始化滚动条 start */
		if (datas.enableScrollBar) {
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
		resetScrollBar: _fn.initScrollBar,
		toTop: _toTop,
		init: _init
	};
}();