// profile.js - 优化版本
const { userIdApi } = require('../../utils/cloudApi.js');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    userId: '',
    timetableCount: 0,
    courseCount: 0,
    isLoading: false,
    showLoginModal: false,
    hasAgreed: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo?.nickName) {
        const userId = await this.getUserId();
        this.setData({ isLoggedIn: true, userInfo, userId });
        this.loadStats();
      } else {
        this.resetUserState();
      }
    } catch (err) {
      console.error('检查登录状态失败:', err);
    }
  },

  // 重置用户状态
  resetUserState() {
    this.setData({
      isLoggedIn: false,
      userInfo: null,
      userId: '',
      timetableCount: 0,
      courseCount: 0
    });
  },

  // 获取用户ID（从云端或本地）
  async getUserId() {
    try {
      const cachedUserId = wx.getStorageSync('userSystemId');
      if (cachedUserId) return cachedUserId;

      const result = await userIdApi.getOrCreateUserId();
      if (result.result?.success && result.result.data?.userId) {
        const { userId } = result.result.data;
        wx.setStorageSync('userSystemId', userId);
        return userId;
      }
      return 'A0000';
    } catch (err) {
      console.error('获取用户ID失败:', err);
      return err.message?.includes('FunctionName parameter could not be found') 
        ? this.getLocalBackupUserId() 
        : 'A0000';
    }
  },

  // 本地备用方案
  getLocalBackupUserId() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return 'A0000';

    const nickName = userInfo.nickName || '';
    let hash = 0;
    for (let i = 0; i < nickName.length; i++) {
      hash = ((hash << 5) - hash) + nickName.charCodeAt(i);
      hash = hash & hash;
    }
    return `A${String(Math.abs(hash) % 9999 + 1).padStart(4, '0')}`;
  },

  // 加载统计数据
  loadStats() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) return;

      const userKey = `timetables_${userInfo.nickName || 'default'}`;
      const timetables = wx.getStorageSync(userKey) || [];

      let courseCount = 0;
      timetables.forEach(t => {
        t.courses?.forEach(day => {
          day.forEach(course => { if (course) courseCount++; });
        });
      });

      this.setData({
        timetableCount: timetables.length,
        courseCount: Math.ceil(courseCount / 2)
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  // 登录流程
  async login() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const loginRes = await wx.login();
      if (!loginRes.code) throw new Error('获取登录凭证失败');

      const result = await wx.cloud.callFunction({
        name: 'login',
        data: { code: loginRes.code }
      });

      const responseData = typeof result.result === 'string' 
        ? JSON.parse(result.result) 
        : result.result;

      if (!responseData?.success) {
        throw new Error(responseData?.message || '登录失败');
      }

      const userInfo = responseData.data?.userInfo || {
        _id: 'temp_' + Date.now(),
        openid: 'temp_openid',
        nickName: '微信用户',
        avatarUrl: ''
      };
      const token = responseData.data?.token || 'temp_token_' + Date.now();

      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('token', token);

      const userId = await this.getUserId();

      this.setData({
        isLoggedIn: true,
        userInfo,
        userId,
        isLoading: false,
        showLoginModal: false
      });

      this.initUserData();
      this.loadStats();

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      console.error('登录失败:', err);
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: err.message || '登录失败，请重试', icon: 'none' });
    }
  },

  // 初始化用户数据
  initUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) return;

      const userKey = `timetables_${userInfo.nickName || 'default'}`;
      if (!wx.getStorageSync(userKey)) {
        wx.setStorageSync(userKey, [{
          id: Date.now(),
          name: '我的课表',
          isMain: true,
          courses: [[], [], [], [], [], [], []]
        }]);
      }
    } catch (err) {
      console.error('初始化用户数据失败:', err);
    }
  },

  // 管理课表
  manageTimetables() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({ url: '/pages/timetableList/timetableList' });
  },

  // 关于我们
  about() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  // 头像加载失败
  onAvatarError() {
    if (this.data.userInfo) {
      this.setData({ 'userInfo.avatarUrl': '/images/avatar.png' });
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后将清除本地数据，是否继续？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userSystemId');
          this.resetUserState();
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  // 显示/关闭登录弹窗
  showLoginModal() { this.setData({ showLoginModal: true, hasAgreed: false }); },
  closeLoginModal() { this.setData({ showLoginModal: false, hasAgreed: false }); },
  preventClose() {},

  // 切换协议同意状态
  toggleAgreement() {
    this.setData({ hasAgreed: !this.data.hasAgreed });
  },

  // 打开协议页面
  openUserAgreement() { wx.navigateTo({ url: '/pages/agreement/agreement' }); },
  openPrivacyPolicy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); }
});
