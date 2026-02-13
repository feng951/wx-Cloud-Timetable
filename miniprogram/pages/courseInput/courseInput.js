// courseInput.js - 优化版本
const { timetableApi, localApi } = require('../../utils/cloudApi.js');

Page({
  data: {
    timetableId: null,
    timetableName: '',
    day: 0,
    time: 0,
    isEdit: false,
    course: {
      name: '',
      teacher: '',
      location: '',
      room: '',
      credit: '',
      remark: '',
      color: '#667eea',
      weeks: [],
      startWeek: 1,
      endWeek: 20,
      startPeriod: 1,
      endPeriod: 2
    },
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'],
    showColorPicker: false,
    showWeekPicker: false,
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    timeRange: [['周一', '周二', '周三', '周四', '周五', '周六', '周日'], ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节'], ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节', '第7节', '第8节', '第9节', '第10节']],
    timeIndex: [0, 0, 1],
    oddEven: 0,
    weekOptions: [],
    selectedWeeksText: '请选择上课周数',
    isSaving: false
  },

  onLoad(options) {
    const { timetableId, day, time, edit } = options;
    
    this.setData({
      timetableId: timetableId || null,
      day: day ? parseInt(day) : 0,
      time: time ? parseInt(time) : 0,
      isEdit: edit === 'true'
    });

    this.initWeekOptions();

    // 设置时间段默认值
    if (time !== undefined) {
      const period = parseInt(time);
      this.setData({
        'timeIndex[1]': period,
        'timeIndex[2]': Math.min(period + 1, 9),
        'course.startPeriod': period + 1,
        'course.endPeriod': Math.min(period + 2, 10)
      });
    }

    this.loadTimetableData();
  },

  // 初始化周数选项
  initWeekOptions() {
    const weekOptions = [];
    for (let i = 1; i <= 20; i++) {
      weekOptions.push({ week: i, selected: false, disabled: false });
    }
    this.setData({ weekOptions });
  },

  // 加载课表数据 - 从本地缓存读取
  loadTimetableData() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 从本地缓存获取课表
    const timetables = localApi.getTimetables();
    
    let currentTimetable;
    if (this.data.timetableId) {
      currentTimetable = timetables.find(t => (t._id || t.id) === this.data.timetableId);
    } else {
      currentTimetable = timetables.find(t => t.isMain) || timetables[0];
    }

    if (currentTimetable) {
      this.setData({
        timetableId: currentTimetable._id || currentTimetable.id,
        timetableName: currentTimetable.name
      });

      // 如果是编辑模式，加载课程数据
      if (this.data.isEdit) {
        const existingCourse = currentTimetable.courses[this.data.day][this.data.time];
        if (existingCourse) {
          const weeks = existingCourse.weeks || this.generateWeeksFromRange(existingCourse.startWeek, existingCourse.endWeek);
          
          this.setData({
            course: {
              ...this.data.course,
              ...existingCourse,
              weeks: weeks,
              startPeriod: existingCourse.startPeriod || this.data.time + 1,
              endPeriod: existingCourse.endPeriod || this.data.time + 2
            },
            oddEven: existingCourse.oddEven || 0,
            'timeIndex[0]': this.data.day,
            'timeIndex[1]': (existingCourse.startPeriod || this.data.time + 1) - 1,
            'timeIndex[2]': (existingCourse.endPeriod || this.data.time + 2) - 1
          });

          this.updateWeekOptionsFromSelection(weeks);
          this.updateSelectedWeeksText();
        }
      }
    }
  },

  // 从范围生成周数数组
  generateWeeksFromRange(start, end) {
    const weeks = [];
    for (let i = start; i <= end; i++) weeks.push(i);
    return weeks;
  },

  // 更新周数选项
  updateWeekOptionsFromSelection(weeks) {
    const weekOptions = this.data.weekOptions.map(item => ({
      ...item,
      selected: weeks.includes(item.week)
    }));
    this.setData({ weekOptions });
  },

  // 更新选中的周数文本
  updateSelectedWeeksText() {
    const selectedWeeks = this.data.weekOptions
      .filter(item => item.selected)
      .map(item => item.week)
      .sort((a, b) => a - b);

    let text = '';
    if (selectedWeeks.length === 0) {
      text = '请选择上课周数';
    } else if (selectedWeeks.length === 20) {
      text = '全学期 (1-20周)';
    } else {
      const ranges = this.compressWeeks(selectedWeeks);
      text = ranges.map(r => r.start === r.end ? `第${r.start}周` : `第${r.start}-${r.end}周`).join('、');
    }

    this.setData({
      selectedWeeksText: text,
      'course.weeks': selectedWeeks
    });
  },

  // 压缩周数为区间
  compressWeeks(weeks) {
    if (weeks.length === 0) return [];
    const ranges = [];
    let start = weeks[0], end = weeks[0];

    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i] === end + 1) {
        end = weeks[i];
      } else {
        ranges.push({ start, end });
        start = end = weeks[i];
      }
    }
    ranges.push({ start, end });
    return ranges;
  },

  // 输入处理
  inputName(e) { this.setData({ 'course.name': e.detail.value }); },
  inputCredit(e) { this.setData({ 'course.credit': e.detail.value }); },
  inputRemark(e) { this.setData({ 'course.remark': e.detail.value }); },
  inputTeacher(e) { this.setData({ 'course.teacher': e.detail.value }); },
  inputLocation(e) { this.setData({ 'course.location': e.detail.value, 'course.room': e.detail.value }); },

  // 颜色选择器
  showColorPicker() { this.setData({ showColorPicker: true }); },
  hideColorPicker() { this.setData({ showColorPicker: false }); },
  selectColor(e) {
    this.setData({ 'course.color': e.currentTarget.dataset.color, showColorPicker: false });
  },

  // 周数选择器
  showWeekPicker() { this.setData({ showWeekPicker: true }); },
  hideWeekPicker() { this.setData({ showWeekPicker: false }); },
  confirmWeekPicker() {
    this.updateSelectedWeeksText();
    this.setData({ showWeekPicker: false });
  },
  toggleWeek(e) {
    const index = e.currentTarget.dataset.index;
    const weekOptions = this.data.weekOptions;
    if (weekOptions[index].disabled) return;
    weekOptions[index].selected = !weekOptions[index].selected;
    this.setData({ weekOptions });
  },
  selectAllWeeks() {
    this.setData({ weekOptions: this.data.weekOptions.map(item => ({ ...item, selected: true })) });
  },
  selectOddWeeks() {
    this.setData({ weekOptions: this.data.weekOptions.map(item => ({ ...item, selected: item.week % 2 === 1 })) });
  },
  selectEvenWeeks() {
    this.setData({ weekOptions: this.data.weekOptions.map(item => ({ ...item, selected: item.week % 2 === 0 })) });
  },
  clearWeeks() {
    this.setData({ weekOptions: this.data.weekOptions.map(item => ({ ...item, selected: false })) });
  },

  // 单双周选择 - 修复:实际更新周数选择
  selectOddEven(e) {
    const value = parseInt(e.currentTarget.dataset.value);
    this.setData({ oddEven: value });
    
    // 根据选择更新周数
    if (value === 0) {
      // 全周
      this.selectAllWeeks();
    } else if (value === 1) {
      // 单周
      this.selectOddWeeks();
    } else if (value === 2) {
      // 双周
      this.selectEvenWeeks();
    }
    
    // 更新显示的文本
    this.updateSelectedWeeksText();
  },

  // 时间变化
  onTimeChange(e) {
    const value = e.detail.value;
    this.setData({
      timeIndex: value,
      day: value[0],
      'course.startPeriod': value[1] + 1,
      'course.endPeriod': value[2] + 1
    });
  },

  // 保存课程
  async saveCourse() {
    if (this.data.isSaving) return;

    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo?.nickName) {
      wx.showModal({
        title: '提示',
        content: '您未登录，请登录后重试',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到我的页面进行登录
            wx.switchTab({ url: '/pages/profile/profile' });
          }
        }
      });
      return;
    }

    if (!this.data.course.name) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' });
      return;
    }

    const selectedWeeks = this.data.weekOptions.filter(item => item.selected).map(item => item.week);
    if (selectedWeeks.length === 0) {
      wx.showToast({ title: '请选择上课周数', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });
    wx.showLoading({ title: '保存中...', mask: true });

    try {
      const startWeek = Math.min(...selectedWeeks);
      const endWeek = Math.max(...selectedWeeks);
      const startPeriod = this.data.course.startPeriod;
      const endPeriod = this.data.course.endPeriod;

      // 课程数据
      const courseData = {
        ...this.data.course,
        weeks: selectedWeeks,
        startWeek,
        endWeek,
        startPeriod,
        endPeriod,
        oddEven: this.data.oddEven,
        room: this.data.course.location
      };

      // 1. 先更新本地缓存
      const timetables = localApi.getTimetables();
      const index = timetables.findIndex(t => (t._id || t.id) === this.data.timetableId);
      
      if (index === -1) {
        throw new Error('课表不存在');
      }

      const { day } = this.data;
      // 保存到连续的节次位置
      for (let period = startPeriod - 1; period < endPeriod; period++) {
        timetables[index].courses[day][period] = { ...courseData };
      }

      // 保存到本地
      localApi.saveTimetables(timetables);

      // 2. 同步到云端
      const updateResult = await timetableApi.updateCourse(
        this.data.timetableId,
        timetables[index].courses
      );

      if (!updateResult.result || !updateResult.result.success) {
        console.warn('云端同步失败，但本地已保存:', updateResult);
      }

      wx.hideLoading();
      this.setData({ isSaving: false });

      wx.showToast({
        title: '录入成功',
        icon: 'success',
        success: () => setTimeout(() => wx.navigateBack(), 1000)
      });

    } catch (err) {
      wx.hideLoading();
      this.setData({ isSaving: false });
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  },

  // 删除课程
  async deleteCourse() {
    wx.showModal({
      title: '确认删除',
      content: '是否删除这门课程？',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });

          try {
            // 1. 先更新本地缓存
            const timetables = localApi.getTimetables();
            const index = timetables.findIndex(t => (t._id || t.id) === this.data.timetableId);
            
            if (index !== -1) {
              const { day, course } = this.data;
              const startPeriod = course.startPeriod || this.data.time + 1;
              const endPeriod = course.endPeriod || this.data.time + 2;
              
              // 删除连续节次的课程
              for (let period = startPeriod - 1; period < endPeriod; period++) {
                timetables[index].courses[day][period] = null;
              }
              
              // 保存到本地
              localApi.saveTimetables(timetables);

              // 2. 同步到云端
              await timetableApi.updateCourse(
                this.data.timetableId,
                timetables[index].courses
              );
            }

            wx.hideLoading();
            wx.showToast({ 
              title: '删除成功', 
              icon: 'success', 
              success: () => setTimeout(() => wx.navigateBack(), 1000) 
            });

          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  goBack() { wx.navigateBack(); }
});
