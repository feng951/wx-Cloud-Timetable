// timetableSettings.js - 云同步版本
const { timetableApi, localApi } = require('../../utils/cloudApi.js');

Page({
  data: {
    timetableId: null,
    timetableName: '',
    settings: {
      name: '我的课表',
      startDate: '2025-09-01',
      totalWeeks: 20,
      showSaturday: true,
      showSunday: true,
      showOtherWeeks: true,
      cellHeight: 64,
      cellRadius: 4,
      isDefault: false,
      timeSlots: [
        { start: '08:00', end: '08:50' },
        { start: '09:00', end: '09:50' },
        { start: '10:10', end: '11:00' },
        { start: '11:10', end: '12:00' },
        { start: '13:30', end: '14:20' },
        { start: '14:30', end: '15:20' },
        { start: '15:40', end: '16:30' },
        { start: '16:40', end: '17:30' },
        { start: '18:30', end: '19:20' },
        { start: '19:30', end: '20:20' }
      ]
    },
    currentWeek: 1,
    weekOptions: ['10周', '11周', '12周', '13周', '14周', '15周', '16周', '17周', '18周', '19周', '20周', '21周', '22周', '23周', '24周', '25周'],
    defaultTimeSlots: [
      { start: '08:00', end: '08:50' },
      { start: '09:00', end: '09:50' },
      { start: '10:10', end: '11:00' },
      { start: '11:10', end: '12:00' },
      { start: '13:30', end: '14:20' },
      { start: '14:30', end: '15:20' },
      { start: '15:40', end: '16:30' },
      { start: '16:40', end: '17:30' },
      { start: '18:30', end: '19:20' },
      { start: '19:30', end: '20:20' }
    ],
    hasOtherDefault: false,
    otherDefaultName: '',
    isSaving: false
  },

  onLoad(options) {
    const { timetableId } = options;
    if (!timetableId) {
      wx.showToast({ title: '课表ID不能为空', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ timetableId });
    this.loadTimetableInfo();
    this.loadSettings();
    this.checkOtherDefaultTimetable();
  },

  // 加载课表信息 - 从云端和本地
  async loadTimetableInfo() {
    try {
      // 优先从云端获取最新数据
      const result = await timetableApi.getTimetables();
      
      let timetable = null;
      
      if (result.result?.success && result.result.data) {
        timetable = result.result.data.find(t => t._id === this.data.timetableId);
      }
      
      // 如果云端没有，从本地获取
      if (!timetable) {
        const timetables = localApi.getTimetables();
        timetable = timetables.find(t => (t._id || t.id) === this.data.timetableId);
      }

      if (timetable) {
        this.setData({
          timetableName: timetable.name,
          'settings.name': timetable.name
        });
      }
    } catch (err) {
      console.error('加载课表信息失败:', err);
      // 从本地获取
      const timetables = localApi.getTimetables();
      const timetable = timetables.find(t => (t._id || t.id) === this.data.timetableId);
      if (timetable) {
        this.setData({
          timetableName: timetable.name,
          'settings.name': timetable.name
        });
      }
    }
  },

  // 加载设置
  loadSettings() {
    const settings = localApi.getSettings(this.data.timetableId);

    if (settings) {
      const timeSlots = settings.timeSlots || this.data.defaultTimeSlots;
      this.setData({
        settings: {
          ...this.data.settings,
          ...settings,
          timeSlots: timeSlots
        }
      });
    }

    this.calculateCurrentWeek();
  },

  // 检查是否有其他默认课表
  checkOtherDefaultTimetable() {
    const timetables = localApi.getTimetables();

    const otherDefault = timetables.find(t => {
      if ((t._id || t.id) === this.data.timetableId) return false;
      const settings = localApi.getSettings(t._id || t.id);
      return settings && settings.isDefault;
    });

    if (otherDefault) {
      const otherSettings = localApi.getSettings(otherDefault._id || otherDefault.id);
      this.setData({
        hasOtherDefault: true,
        otherDefaultName: otherSettings ? otherSettings.name : otherDefault.name
      });
    } else {
      this.setData({
        hasOtherDefault: false,
        otherDefaultName: ''
      });
    }
  },

  // 计算当前周
  calculateCurrentWeek() {
    const now = new Date();
    const startDate = new Date(this.data.settings.startDate);
    const diffTime = now - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNum = Math.max(1, Math.min(20, Math.floor(diffDays / 7) + 1));

    this.setData({ currentWeek: weekNum });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 输入课表名称
  inputName(e) {
    this.setData({ 'settings.name': e.detail.value });
  },

  // 开学日期变化
  onStartDateChange(e) {
    this.setData({
      'settings.startDate': e.detail.value
    }, () => {
      this.calculateCurrentWeek();
    });
  },

  // 周数变化
  onTotalWeeksChange(e) {
    this.setData({
      'settings.totalWeeks': parseInt(e.detail.value) + 10
    });
  },

  // 课程时间变化
  onTimeSlotChange(e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;

    const timeSlots = this.data.settings.timeSlots;
    timeSlots[index][type] = value;

    this.setData({
      'settings.timeSlots': timeSlots
    });
  },

  // 恢复默认时间
  resetTimeSlots() {
    wx.showModal({
      title: '确认恢复',
      content: '是否恢复默认的课程时间设置？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'settings.timeSlots': JSON.parse(JSON.stringify(this.data.defaultTimeSlots))
          });
          wx.showToast({ title: '已恢复默认', icon: 'success' });
        }
      }
    });
  },

  // 切换默认配置
  toggleDefault(e) {
    const isDefault = e.detail.value;

    if (isDefault && this.data.hasOtherDefault) {
      wx.showModal({
        title: '覆盖默认设置',
        content: `已有默认课表设置（${this.data.otherDefaultName}），点击将覆盖原有默认设置`,
        confirmText: '覆盖',
        confirmColor: '#667eea',
        success: (res) => {
          if (res.confirm) {
            this.clearOtherDefaultSettings();
            this.setData({
              'settings.isDefault': true,
              hasOtherDefault: false,
              otherDefaultName: ''
            });
          } else {
            this.setData({ 'settings.isDefault': false });
          }
        }
      });
    } else {
      this.setData({ 'settings.isDefault': isDefault });
    }
  },

  // 清除其他课表的默认设置
  clearOtherDefaultSettings() {
    const timetables = localApi.getTimetables();

    timetables.forEach(t => {
      if ((t._id || t.id) !== this.data.timetableId) {
        const settings = localApi.getSettings(t._id || t.id);
        if (settings && settings.isDefault) {
          settings.isDefault = false;
          localApi.saveSettings(t._id || t.id, settings);
        }
      }
    });
  },

  // 保存设置 - 云同步版本
  async saveSettings() {
    if (this.data.isSaving) return;

    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });
    wx.showLoading({ title: '保存中...', mask: true });

    try {
      // 1. 保存设置到本地
      localApi.saveSettings(this.data.timetableId, this.data.settings);

      // 2. 更新本地课表名称
      const timetables = localApi.getTimetables();
      const index = timetables.findIndex(t => (t._id || t.id) === this.data.timetableId);
      if (index !== -1) {
        timetables[index].name = this.data.settings.name;
        localApi.saveTimetables(timetables);
      }

      // 3. 同步到云端 - 更新课表名称
      const updateResult = await timetableApi.updateTimetable(
        this.data.timetableId,
        { name: this.data.settings.name }
      );

      if (!updateResult.result || !updateResult.result.success) {
        console.warn('云端同步失败，但本地已保存:', updateResult);
      }

      wx.hideLoading();
      this.setData({ isSaving: false });

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        }
      });

    } catch (err) {
      wx.hideLoading();
      this.setData({ isSaving: false });
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  }
});
