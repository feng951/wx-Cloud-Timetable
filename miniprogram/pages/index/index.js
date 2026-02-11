// index.js - 优化授权流程版本
const { timetableApi, localApi, shareApi } = require('../../utils/cloudApi.js');

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const DEFAULT_TIME_SLOTS = [
  { start: '08:00', end: '08:50' }, { start: '09:00', end: '09:50' },
  { start: '10:10', end: '11:00' }, { start: '11:10', end: '12:00' },
  { start: '13:30', end: '14:20' }, { start: '14:30', end: '15:20' },
  { start: '15:40', end: '16:30' }, { start: '16:40', end: '17:30' },
  { start: '18:30', end: '19:20' }, { start: '19:30', end: '20:20' }
];

// 默认课表数据（未登录时使用）
const DEFAULT_COURSES = [[], [], [], [], [], [], []];

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    mainTimetableId: null,
    mainTimetableName: '我的课表',
    weekDays: WEEK_DAYS,
    timeSlots: DEFAULT_TIME_SLOTS,
    currentDate: '',
    currentWeek: 1,
    currentDay: 0,
    displayWeek: 1,
    firstWeekStartDate: null,
    weekData: [],
    isEmpty: true,
    isLoading: false,
    syncStatus: '',
    courseCount: 0,
    showLoginModal: false  // 登录弹窗显示状态
  },

  onLoad() {
    this.initDateInfo();
    this.checkLoginStatus();
  },

  onShow() {
    // 无论是否登录都刷新数据
    this.refreshData();
  },

  async refreshData() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(async () => {
      await this.loadSettings();
      await this.loadTimetableData();
    }, 100);
  },

  // 加载设置（兼容未登录状态）
  loadSettings() {
    // 尝试从本地存储加载设置
    const userInfo = wx.getStorageSync('userInfo');
    const timetables = localApi.getTimetables();
    const mainTimetable = timetables.find(t => t.isMain) || timetables[0];

    if (mainTimetable) {
      const settings = localApi.getSettings(mainTimetable._id || mainTimetable.id);
      if (settings?.startDate) {
        const userSetDate = new Date(settings.startDate);
        const daysToMonday = userSetDate.getDay() === 0 ? 6 : userSetDate.getDay() - 1;
        const mondayDate = new Date(userSetDate);
        mondayDate.setDate(userSetDate.getDate() - daysToMonday);
        this.setData({ firstWeekStartDate: mondayDate });
      } else {
        this.setDefaultStartDate();
      }

      if (settings?.timeSlots?.length > 0) {
        this.setData({ timeSlots: settings.timeSlots });
      }
    } else {
      this.setDefaultStartDate();
    }
  },

  setDefaultStartDate() {
    const now = new Date();
    const daysToMonday = (now.getDay() + 6) % 7;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - daysToMonday);
    this.setData({ firstWeekStartDate: mondayDate });
  },

  initDateInfo() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const currentWeek = this.calculateWeekNumber(now);
    const currentDay = (now.getDay() + 6) % 7;

    this.setData({ currentDate: dateStr, currentWeek, currentDay, displayWeek: currentWeek });
    this.generateWeekData();
  },

  calculateWeekNumber(date) {
    if (!this.data.firstWeekStartDate) return 1;
    const startDate = new Date(this.data.firstWeekStartDate);
    startDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(20, Math.floor(diffDays / 7) + 1));
  },

  generateWeekData() {
    if (!this.data.firstWeekStartDate) {
      this.setDefaultStartDate();
    }

    const weekData = [];
    const baseTime = this.data.firstWeekStartDate.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let week = 1; week <= 20; week++) {
      const weekItem = { week, days: [], courses: Array(7).fill(null).map(() => []) };
      const weekStartTime = baseTime + (week - 1) * 7 * oneDay;

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(weekStartTime + day * oneDay);
        weekItem.days.push({
          month: currentDate.getMonth() + 1,
          date: currentDate.getDate(),
          showMonth: currentDate.getDate() === 1 || (day === 0 && currentDate.getMonth() !== new Date(weekStartTime).getMonth()),
          dayOfWeek: day
        });
      }
      weekData.push(weekItem);
    }

    this.setData({ weekData });
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo?.nickName) {
      this.setData({ isLoggedIn: true, userInfo });
    } else {
      this.setData({ isLoggedIn: false, userInfo: null });
    }
  },

  // 加载课表数据（兼容未登录状态）
  async loadTimetableData() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo) {
      // 已登录：从云端加载
      await this.loadMainTimetableFromCloud();
    } else {
      // 未登录：从本地加载或使用默认空课表
      this.loadLocalTimetableOrDefault();
    }
  },

  // 从云端加载主课表
  async loadMainTimetableFromCloud() {
    this.setData({ syncStatus: '加载中...' });

    try {
      const allTimetablesResult = await timetableApi.getTimetables();
      let mainTimetable = null;

      if (allTimetablesResult.result?.success && allTimetablesResult.result.data) {
        const cloudTimetables = allTimetablesResult.result.data;
        const cloudMainTimetable = cloudTimetables.find(t => t.isMain);

        if (cloudMainTimetable) {
          mainTimetable = {
            id: cloudMainTimetable._id, _id: cloudMainTimetable._id,
            name: cloudMainTimetable.name, isMain: true,
            courses: cloudMainTimetable.courses || [[], [], [], [], [], [], []]
          };
        }

        localApi.saveTimetables(cloudTimetables.map(t => ({
          id: t._id, _id: t._id, name: t.name, isMain: t.isMain,
          courses: t.courses || [[], [], [], [], [], [], []]
        })));
      }

      if (!mainTimetable) {
        const localTimetables = localApi.getTimetables();
        mainTimetable = localTimetables.find(t => t.isMain) || localTimetables[0];
      }

      if (!mainTimetable) {
        const createResult = await timetableApi.createTimetable('我的课表', true);
        if (createResult.result?.success) {
          mainTimetable = {
            id: createResult.result.data._id, _id: createResult.result.data._id,
            name: createResult.result.data.name, isMain: true,
            courses: [[], [], [], [], [], [], []]
          };
          localApi.saveTimetables([mainTimetable]);
        }
      }

      this.updateTimetableDisplay(mainTimetable);
    } catch (err) {
      console.error('加载主课表失败:', err);
      this.setData({ syncStatus: '' });
      this.loadLocalTimetableOrDefault();
    }
  },

  // 加载本地课表或使用默认空课表
  loadLocalTimetableOrDefault() {
    const localTimetables = localApi.getTimetables();
    const mainTimetable = localTimetables.find(t => t.isMain) || localTimetables[0];

    if (mainTimetable) {
      this.updateTimetableDisplay(mainTimetable);
    } else {
      // 使用默认空课表
      this.updateTimetableDisplay({
        name: '我的课表',
        courses: DEFAULT_COURSES
      });
    }
  },

  // 更新课表显示
  updateTimetableDisplay(timetable) {
    const settings = timetable?._id ? localApi.getSettings(timetable._id) : null;
    
    if (settings?.timeSlots?.length > 0) {
      this.setData({ timeSlots: settings.timeSlots });
    }

    const courseCount = this.calculateCourseCount(timetable?.courses);

    const weekData = this.data.weekData.map(weekItem => {
      const weekCourses = Array(7).fill(null).map(() => []);
      const courses = timetable?.courses || [];

      for (let day = 0; day < 7; day++) {
        for (let time = 0; time < 10; time++) {
          const course = courses[day]?.[time];
          if (course?.weeks?.includes(weekItem.week)) {
            weekCourses[day][time] = course;
          }
        }
      }
      return { ...weekItem, courses: weekCourses };
    });

    const hasCourse = timetable?.courses?.some(day => day.some(course => course != null));

    this.setData({
      mainTimetableId: timetable?._id || null,
      mainTimetableName: timetable?.name || '我的课表',
      weekData,
      isEmpty: !hasCourse,
      courseCount,
      syncStatus: ''
    });
  },

  calculateCourseCount(courses) {
    if (!courses) return 0;
    let count = 0;

    for (let day = 0; day < 7; day++) {
      const dayCourses = courses[day] || [];
      let i = 0;
      while (i < 8) {
        if (dayCourses[i]) {
          let endPeriod = i;
          while (endPeriod < 8 && dayCourses[endPeriod + 1]) endPeriod++;
          count++;
          i = endPeriod + 1;
        } else {
          i++;
        }
      }
    }
    return count;
  },

  // 显示登录弹窗
  showLoginModal() {
    this.setData({ showLoginModal: true });
  },

  // 关闭登录弹窗
  closeLoginModal() {
    this.setData({ showLoginModal: false });
  },

  // 登录流程
  async login() {
    this.setData({ isLoading: true, syncStatus: '登录中...' });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const res = await wx.getUserProfile({ desc: '用于完善用户资料' });
      const userInfo = res.userInfo;
      if (!userInfo?.nickName) throw new Error('获取用户信息失败');

      wx.setStorageSync('userInfo', userInfo);
      this.setData({ syncStatus: '同步数据中...' });
      await this.syncFromCloud(userInfo);

      this.setData({ 
        isLoggedIn: true, 
        userInfo, 
        isLoading: false, 
        syncStatus: '同步完成',
        showLoginModal: false
      });
      
      this.refreshData();
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => this.setData({ syncStatus: '' }), 2000);
    } catch (err) {
      wx.hideLoading();
      this.setData({ isLoading: false, syncStatus: '' });
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    }
  },

  async syncFromCloud(userInfo) {
    try {
      const result = await timetableApi.getTimetables();
      if (result.result?.success && result.result.data) {
        const localTimetables = result.result.data.map(t => ({
          id: t._id, _id: t._id, name: t.name, isMain: t.isMain,
          courses: t.courses || [[], [], [], [], [], [], []]
        }));
        localApi.saveTimetables(localTimetables);
      }
    } catch (err) {
      console.error('同步云端数据失败:', err);
    }
  },

  // 点击格子 - 未登录时提示登录
  onSlotTap(e) {
    const { day, time, week } = e.currentTarget.dataset;
    
    // 未登录时显示登录引导
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    
    const hasCourse = this.data.weekData[week - 1]?.courses[day][time];
    wx.navigateTo({
      url: `/pages/courseInput/courseInput?day=${day}&time=${time}&edit=${hasCourse ? 'true' : 'false'}&week=${week}`
    });
  },

  // 添加课程 - 未登录时提示登录
  addCourse() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({ url: `/pages/courseInput/courseInput?week=${this.data.displayWeek}` });
  },

  // 管理课表 - 未登录时提示登录
  manageTimetables() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({ url: '/pages/timetableList/timetableList' });
  },

  importFromSchool() {
    wx.showToast({ title: '导入功能开发中', icon: 'none' });
  },

  // 导入课表 - 未登录时提示登录
  showImportDialog() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }

    wx.showModal({
      title: '导入课表',
      placeholderText: '请输入10位课程分享码',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          const shareCode = res.content.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (shareCode.length !== 10) {
            wx.showToast({ title: '请输入10位分享码', icon: 'none' });
            return;
          }

          this.setData({ isLoading: true, syncStatus: '导入中...' });

          try {
            const result = await shareApi.importTimetable(shareCode);
            if (result.result?.success) {
              await this.loadTimetableData();
              wx.showToast({ title: '导入成功', icon: 'success' });
            } else {
              this.setData({ isLoading: false, syncStatus: '' });
              wx.showModal({
                title: '导入失败',
                content: result.result?.message || '分享码无效或已过期',
                showCancel: false
              });
            }
          } catch (err) {
            console.error('导入课表失败:', err);
            this.setData({ isLoading: false, syncStatus: '' });
            wx.showModal({ title: '导入失败', content: '网络错误，请稍后重试', showCancel: false });
          }
        }
      }
    });
  },

  onWeekChange(e) {
    this.setData({ displayWeek: e.detail.current + 1 });
  },

  prevWeek() {
    if (this.data.displayWeek > 1) {
      this.setData({ displayWeek: this.data.displayWeek - 1 });
    }
  },

  nextWeek() {
    if (this.data.displayWeek < 20) {
      this.setData({ displayWeek: this.data.displayWeek + 1 });
    }
  },

  backToCurrentWeek() {
    this.setData({ displayWeek: this.data.currentWeek });
  },

  goToWeek(e) {
    this.setData({ displayWeek: e.currentTarget.dataset.week });
  }
});
