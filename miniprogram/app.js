// app.js - 优化版本
App({
  onLaunch() {
    wx.cloud?.init({ traceUser: true });
  }
});
