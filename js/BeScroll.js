/**
  * 参数：
  *		bescroll: 是否开启模拟滚动，默认：false
  *		sideUp(): 手指上滑处理事件
  *		sideDown(): 手指下滑处理事件
  *		sideLeft():  手指左滑处理事件
  *		sideRight(): 手指右滑处理事件
  *		click(event): 屏幕点击事件
  */
var BeScroll = function() {
	var datas = {
		x: 0,
		y: 0,
		moveY: 0,
		hands: 0,
		preventDefault: true,
		bescroll: false,
		startTime : null,
		slideSpeed: 0,  //滑动速度，
		slideDreaction: 1,   //向下为1，向上为-1
		request: null,
		maxHeight: 0   //页面最大高度
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
			var mt1 = parseInt(document.body.style.marginTop);
			mt1 = mt1?mt1:0;
			mt1 = mt1 + (y - datas.moveY);
			if (mt1 < 0 && mt1 > -1*datas.maxHeight) {
				document.body.style.marginTop = mt1 + "px";
			}
			datas.moveY = y;
		},
		inertialGuidance : function() {
			/* 惯性导航 */
			//cancelAnimationFrame(datas.request);
			var mt = parseInt(document.body.style.marginTop);
			mt = mt?mt:0;
			datas.slideSpeed -= 0.5;
			mt += datas.slideSpeed*datas.slideDreaction;
			if (mt < 0 && mt > -1*datas.maxHeight) {
				document.body.style.marginTop = mt + "px";
				if (datas.slideSpeed > 0) {
					datas.request = window.requestAnimationFrame(_fn.inertialGuidance);
				}
			}
		},
		touchstart : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			datas.maxHeight = parseInt(document.body.clientHeight) - parseInt(document.documentElement.clientHeight);
			var d = new Date();
			datas.startTime = d.getMilliseconds();  //获取滑动开始时间
			touchesstart  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.x = touchesstart[0].pageX;
			datas.y = touchesstart[0].pageY;
			datas.moveY = datas.y;
		},
		touchmove : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			touches  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			datas.bescroll ? _fn.bescroll(touches[0].pageY) : null;  //若开启了模拟滚动则执行模拟滚动
		},
		touchend : function(event) {
			if (datas.preventDefault) { event.preventDefault(); }
			var d = new Date();
			var endTime = d.getMilliseconds(), //滑动结束时间
				touchesend  = event.changedTouches || event.originalEvent.touches || event.originalEvent.changedTouches;
			var x1 = parseInt(touchesend[0].pageX),
				y1 = parseInt(touchesend[0].pageY),
				distanceX = x1 - datas.x,
				distanceY = y1 - datas.y;
			datas.slideDreaction = distanceY > 0 ? 1 : -1;   //判断滚动方向，上or下
			datas.slideSpeed = Math.round(17*distanceY/(endTime - datas.startTime));  //计算手指滑动速度，单位：px/17ms
			datas.slideSpeed = Math.abs(datas.slideSpeed);   //取绝对值
			if (distanceX >= 100) {  //右滑
				_fn.slideRight && _fn.slideRight();
			} else if (distanceX <= -100) {   //左滑
				_fn.slideLeft && _fn.slideLeft();
			} else if (distanceY >= 100) {   //下滑
				_fn.slideDown && _fn.slideDown();
			} else if (distanceY <= -100) {   //上滑
				_fn.slideUp && _fn.slideUp();
			}
			if (Math.abs(distanceY) < 10 && Math.abs(distanceX) < 10) {
				event.target.click();
				_fn.click && _fn.click(event.target);
			}
			//if (distanceY <= 300 && distanceY >= -300) {
			if (datas.bescroll) {
				datas.request = window.requestAnimationFrame(_fn.inertialGuidance);
			}
			//}
			datas.x = datas.y = 0;
		}
	}, _init = function(params) {
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.width = '100%';
		if (params) {
			/* 初始化用户事件 start */
			params.bescroll ? datas.bescroll = params.bescroll : null;
			(params.slideUp && typeof(params.slideUp) == 'function') ? _fn.slideUp = params.slideUp : null;
			(params.slideDown && typeof(params.slideDown) == 'function') ? _fn.slideDown = params.slideDown : null;
			(params.slideLeft && typeof(params.slideLeft) == 'function') ? _fn.slideLeft = params.slideLeft : null;
			(params.slideRight && typeof(params.slideRight) == 'function') ? _fn.slideRight = params.slideRight : null;
			(params.click && typeof(params.click) == 'function') ? _fn.click = params.click : null;
			/* 初始化用户事件 end */
		}
		_fn.initRAF();
		document.addEventListener('touchstart', _fn.touchstart);
		document.addEventListener('touchmove', _fn.touchmove);
		document.addEventListener('touchend', _fn.touchend);
	};
	return {
		fn: _fn,
		init: _init
	};
}();