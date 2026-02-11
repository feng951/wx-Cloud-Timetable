// profile.js - 用户ID管理版本（修复登录）
const { userIdApi } = require('../../utils/cloudApi.js');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    userId: '',
    timetableCount: 0,
    courseCount: 0,
    isLoading: false
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
      if (userInfo && userInfo.nickName) {
        // 获取用户ID（从云端）
        const userId = await this.getUserId();
        
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo,
          userId: userId
        });
        this.loadStats();
      } else {
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          userId: '',
          timetableCount: 0,
          courseCount: 0
        });
      }
    } catch (err) {
      console.error('检查登录状态失败:', err);
    }
  },

  // 获取用户ID（从云端）
  async getUserId() {
    try {
      // 先尝试从本地缓存获取
      const cachedUserId = wx.getStorageSync('userSystemId');
      if (cachedUserId) {
        return cachedUserId;
      }

      // 从云端获取或创建
      const result = await userIdApi.getOrCreateUserId();
      
      if (result.result?.success && result.result.data?.userId) {
        const userId = result.result.data.userId;
        // 缓存到本地
        wx.setStorageSync('userSystemId', userId);
        return userId;
      }
      
      // 如果云端获取失败，返回默认值
      return 'A0000';
    } catch (err) {
      console.error('获取用户ID失败:', err);
      // 检查是否是云函数未部署的错误
      if (err.message && err.message.includes('FunctionName parameter could not be found')) {
        // 云函数未部署，使用本地备用方案
        return this.getLocalBackupUserId();
      }
      return 'A0000';
    }
  },

  // 本地备用方案（当云函数未部署时使用）
  getLocalBackupUserId() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return 'A0000';

    // 使用openid的哈希值生成一个伪ID
    const nickName = userInfo.nickName || '';
    let hash = 0;
    for (let i = 0; i < nickName.length; i++) {
      const char = nickName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // 生成 A0001-A9999 范围内的ID
    const num = Math.abs(hash) % 9999 + 1;
    return `A${String(num).padStart(4, '0')}`;
  },

  // 加载统计数据
  loadStats() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) return;

      const userId = userInfo.nickName || 'default';
      const userKey = `timetables_${userId}`;
      const timetables = wx.getStorageSync(userKey) || [];

      let courseCount = 0;
      timetables.forEach(t => {
        if (t.courses) {
          t.courses.forEach(day => {
            day.forEach(course => {
              if (course) courseCount++;
            });
          });
        }
      });

      // 两小节课算作一大节课
      const bigCourseCount = Math.ceil(courseCount / 2);

      this.setData({
        timetableCount: timetables.length,
        courseCount: bigCourseCount
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  // 登录按钮点击 - 必须使用按钮点击触发
  onLoginButtonTap() {
    console.log('登录按钮被点击');
    // 这里只是记录点击，实际登录在 getUserProfile 中处理
  },

  // 获取用户信息并登录 - 通过按钮点击触发
  async login() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      // 使用 getUserProfile 获取用户信息（必须通过点击触发）
      const res = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });

      if (res.userInfo) {
        await this.handleLoginSuccess(res.userInfo);
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.hideLoading();
      this.setData({ isLoading: false });
      
      if (err.errMsg && err.errMsg.includes('user TAP gesture')) {
        wx.showToast({ title: '请点击按钮登录', icon: 'none' });
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    }
  },

  // 处理登录成功
  async handleLoginSuccess(userInfo) {
    try {
      if (!userInfo || !userInfo.nickName) {
        throw new Error('获取用户信息失败');
      }

      // 保存用户信息
      wx.setStorageSync('userInfo', userInfo);

      // 获取用户系统ID
      const userId = await this.getUserId();

      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        userId: userId,
        isLoading: false
      });

      this.initUserData();
      this.loadStats();

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    }
  },

  // 初始化用户数据
  initUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) return;

      const userId = userInfo.nickName || 'default';
      const userKey = `timetables_${userId}`;

      const existingData = wx.getStorageSync(userKey);
      if (!existingData) {
        const defaultTimetable = {
          id: Date.now(),
          name: '我的课表',
          isMain: true,
          courses: [[], [], [], [], [], [], []]
        };
        wx.setStorageSync(userKey, [defaultTimetable]);
      }
    } catch (err) {
      console.error('初始化用户数据失败:', err);
    }
  },

  // 管理课表
  manageTimetables() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/timetableList/timetableList'
    });
  },

  // 关于我们
  about() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 头像加载失败
  onAvatarError() {
    console.log('头像加载失败，使用默认头像');
    // 头像加载失败时，使用本地默认头像
    const userInfo = this.data.userInfo;
    if (userInfo) {
      this.setData({
        'userInfo.avatarUrl': '/images/avatar.png'
      });
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
          try {
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('userSystemId');

            this.setData({
              isLoggedIn: false,
              userInfo: null,
              userId: '',
              timetableCount: 0,
              courseCount: 0
            });

            wx.showToast({ title: '已退出登录', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '退出失败', icon: 'none' });
          }
        }
      }
    });
  }
});
