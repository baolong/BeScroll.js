# BeScroll.js
* 移动端模拟滚动插件

> 在安卓4.3及以下内核的浏览器中，默认事件处理并不会促发touchend事件，仅能依靠event.preventDefault()来取消默认事件处理动作，但却会导致页面无法滚动。
> 若需要同时支持页面滚动和检测滑动状态，则需要使用模拟滚动才能兼容4.3及以下内核的浏览器。

### 如何使用：
```javascript
BeScroll.init({
	slideRight: function() {
		alert('右滑了哦');
	},
	slideLeft: function() {
		alert('左滑了哦');
	},
	click: function(target) {
		alert("div" + target.innerHTML + '：你点我干嘛？');
	},
	bescroll: true  //开启模拟滚动
});
```
