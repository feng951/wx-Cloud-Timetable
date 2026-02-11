// timetableList.js - 云同步版本（含分享功能）
const { timetableApi, localApi, shareApi } = require('../../utils/cloudApi.js');

Page({
  data: {
    timetables: [],
    isLoading: false,
    syncStatus: '',
    // 分享相关
    showShareModal: false,
    shareCode: '',
    currentShareTimetableId: null,
    // 导入相关
    showImportModal: false,
    importCode: ''
  },

  onLoad() {
    this.loadTimetables();
  },

  onShow() {
    this.loadTimetables();
  },

  // 加载课表列表
  async loadTimetables() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true, syncStatus: '同步中...' });

    try {
      const result = await timetableApi.getTimetables();
      
      let timetables = [];
      
      if (result.result?.success && result.result.data) {
        const cloudTimetables = result.result.data;
        
        timetables = cloudTimetables.map(t => {
          const settings = localApi.getSettings(t._id);
          return {
            id: t._id,
            _id: t._id,
            name: t.name,
            isMain: t.isMain,
            courses: t.courses || [[], [], [], [], [], [], []],
            isDefault: settings ? settings.isDefault : false
          };
        });
        
        localApi.saveTimetables(timetables);
      } else {
        const localTimetables = localApi.getTimetables();
        timetables = localTimetables.map(t => {
          const settings = localApi.getSettings(t._id || t.id);
          return {
            ...t,
            id: t._id || t.id,
            isDefault: settings ? settings.isDefault : false
          };
        });
      }

      this.setData({
        timetables: timetables,
        isLoading: false,
        syncStatus: ''
      });

    } catch (err) {
      console.error('加载课表失败:', err);
      this.setData({ isLoading: false, syncStatus: '' });
      
      const localTimetables = localApi.getTimetables();
      const timetables = localTimetables.map(t => {
        const settings = localApi.getSettings(t._id || t.id);
        return {
          ...t,
          id: t._id || t.id,
          isDefault: settings ? settings.isDefault : false
        };
      });
      
      this.setData({ timetables });
    }
  },

  // 添加新课表
  async addTimetable() {
    wx.showModal({
      title: '新建课表',
      placeholderText: '请输入课表名称',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          this.setData({ isLoading: true, syncStatus: '创建中...' });

          try {
            const createResult = await timetableApi.createTimetable(
              res.content,
              false,
              [[], [], [], [], [], [], []]
            );

            if (!createResult.result || !createResult.result.success) {
              throw new Error(createResult.result?.message || '创建失败');
            }

            const newTimetable = {
              id: createResult.result.data._id,
              _id: createResult.result.data._id,
              name: createResult.result.data.name,
              isMain: createResult.result.data.isMain,
              courses: [[], [], [], [], [], [], []]
            };

            const timetables = this.data.timetables;
            timetables.push(newTimetable);
            localApi.saveTimetables(timetables);

            this.applyDefaultSettings(newTimetable._id);

            this.setData({
              timetables: timetables,
              isLoading: false,
              syncStatus: ''
            });

            wx.showToast({ title: '创建成功', icon: 'success' });

          } catch (err) {
            this.setData({ isLoading: false, syncStatus: '' });
            wx.showToast({ title: err.message || '创建失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 应用默认课表设置
  applyDefaultSettings(newTimetableId) {
    const defaultTimetable = this.data.timetables.find(t => t.isDefault);

    if (defaultTimetable) {
      const defaultSettings = localApi.getSettings(defaultTimetable._id);

      if (defaultSettings) {
        const newSettings = {
          ...defaultSettings,
          isDefault: false,
          name: undefined,
          startDate: undefined
        };

        localApi.saveSettings(newTimetableId, newSettings);
      }
    }
  },

  // 选择课表进行编辑
  selectTimetable(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/courseInput/courseInput?timetableId=${id}`
    });
  },

  // 设置主课表
  async setMainTimetable(e) {
    const id = e.currentTarget.dataset.id;
    
    this.setData({ isLoading: true, syncStatus: '设置中...' });

    try {
      const result = await timetableApi.setMainTimetable(id);
      
      if (!result.result || !result.result.success) {
        throw new Error(result.result?.message || '设置失败');
      }

      const timetables = this.data.timetables.map(t => ({
        ...t,
        isMain: (t._id || t.id) === id
      }));
      
      localApi.saveTimetables(timetables);

      this.setData({
        timetables: timetables,
        isLoading: false,
        syncStatus: ''
      });

      wx.showToast({ title: '设置成功', icon: 'success' });

    } catch (err) {
      this.setData({ isLoading: false, syncStatus: '' });
      wx.showToast({ title: err.message || '设置失败', icon: 'none' });
    }
  },

  // 打开课表设置
  openSettings(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/timetableSettings/timetableSettings?timetableId=${id}`
    });
  },

  // 删除课表
  async deleteTimetable(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true, syncStatus: '删除中...' });

          try {
            const result = await timetableApi.deleteTimetable(id);
            
            if (!result.result || !result.result.success) {
              throw new Error(result.result?.message || '删除失败');
            }

            let timetables = this.data.timetables.filter(t => (t._id || t.id) !== id);

            if (timetables.length > 0 && !timetables.find(t => t.isMain)) {
              timetables[0].isMain = true;
              await timetableApi.setMainTimetable(timetables[0]._id || timetables[0].id);
            }

            localApi.saveTimetables(timetables);

            const settingsKey = `timetable_${id}_settings`;
            wx.removeStorageSync(settingsKey);

            this.setData({
              timetables: timetables,
              isLoading: false,
              syncStatus: ''
            });

            wx.showToast({ title: '删除成功', icon: 'success' });

          } catch (err) {
            this.setData({ isLoading: false, syncStatus: '' });
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ==================== 分享功能 ====================

  // 显示分享确认框
  shareTimetable(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '分享课表',
      content: '请问是否要分享课表？',
      confirmText: '是',
      cancelText: '否',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            showShareModal: true,
            shareCode: '',
            currentShareTimetableId: id
          });
          this.generateShareCode(id);
        }
      }
    });
  },

  // 生成分享码
  async generateShareCode(timetableId) {
    try {
      const result = await shareApi.generateShareCode(timetableId);
      
      if (result.result?.success) {
        this.setData({
          shareCode: result.result.data.shareCode
        });
      } else {
        wx.showToast({
          title: result.result?.message || '生成失败',
          icon: 'none'
        });
        this.hideShareModal();
      }
    } catch (err) {
      console.error('生成分享码失败:', err);
      // 检查是否是云函数未部署的错误
      if (err.message && err.message.includes('FunctionName parameter could not be found')) {
        wx.showModal({
          title: '功能未部署',
          content: '分享功能需要部署云函数，请联系管理员部署 shareTimetable 云函数',
          showCancel: false
        });
      } else {
        wx.showToast({ title: '生成失败，请检查网络', icon: 'none' });
      }
      this.hideShareModal();
    }
  },

  // 隐藏分享弹窗
  hideShareModal() {
    this.setData({
      showShareModal: false,
      shareCode: '',
      currentShareTimetableId: null
    });
  },

  // 复制分享码
  copyShareCode() {
    const { shareCode } = this.data;
    if (!shareCode) return;

    wx.setClipboardData({
      data: shareCode,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },

  // ==================== 导入功能 ====================

  // 显示导入弹窗
  showImportDialog() {
    this.setData({
      showImportModal: true,
      importCode: ''
    });
  },

  // 隐藏导入弹窗
  hideImportModal() {
    this.setData({
      showImportModal: false,
      importCode: ''
    });
  },

  // 输入导入码
  onImportInput(e) {
    // 自动转换为大写
    const value = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.setData({ importCode: value });
  },

  // 确认导入
  async confirmImport() {
    const { importCode } = this.data;
    
    if (importCode.length !== 10) {
      wx.showToast({
        title: '请输入10位分享码',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true, syncStatus: '导入中...' });
    this.hideImportModal();

    try {
      const result = await shareApi.importTimetable(importCode);
      
      if (result.result?.success) {
        // 刷新课表列表
        await this.loadTimetables();
        
        wx.showToast({
          title: '导入成功',
          icon: 'success'
        });
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
      // 检查是否是云函数未部署的错误
      if (err.message && err.message.includes('FunctionName parameter could not be found')) {
        wx.showModal({
          title: '功能未部署',
          content: '导入功能需要部署云函数，请联系管理员部署 shareTimetable 云函数',
          showCancel: false
        });
      } else {
        wx.showModal({
          title: '导入失败',
          content: '网络错误，请稍后重试',
          showCancel: false
        });
      }
    }
  },

  // 阻止事件冒泡
  preventHide() {}
});
