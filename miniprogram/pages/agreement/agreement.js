// agreement.js - 用户协议页面
Page({
  data: {

  },

  onLoad() {
    // 页面加载时的逻辑
  },

  onShareAppMessage() {
    return {
      title: '用户协议 - 风表',
      path: '/pages/agreement/agreement'
    };
  }
});
