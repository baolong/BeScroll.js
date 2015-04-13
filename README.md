# BeScroll.js
* 移动端模拟滚动插件

###如何使用：
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