// 课表展示页面逻辑
Page({
  data: {
    // 课表ID
    timetableId: '',
    // 课表名称
    timetableName: '',
    // 课程列表
    courses: [],
    // 当前视图：week(周视图) 或 day(日视图)
    activeView: 'week',
    // 当前日期
    currentDate: new Date(),
    // 星期选项
    weekDays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    // 时间槽
    timeSlots: [
      '08:00-09:40',
      '10:00-11:40',
      '14:00-15:40',
      '16:00-17:40',
      '19:00-20:40'
    ],
    // 周日期
    weekDates: [],
    // 当前周期文本
    currentPeriodText: '',
    // 当前天文本
    currentDayText: '',
    // 加载状态
    loading: false,
    // 课程详情弹窗
    showDetailModal: false,
    // 选中的课程
    selectedCourse: null
  },
  
  onLoad(options) {
    if (options.timetableId) {
      this.setData({
        timetableId: options.timetableId
      })
      this.loadTimetableData()
    }
  },
  
  onShow() {
    // 读取用户偏好设置
    const savedView = wx.getStorageSync('timetableViewPreference')
    if (savedView) {
      this.setData({
        activeView: savedView
      })
    }
    // 初始化日期数据
    this.initDateData()
  },
  
  // 加载课表数据
  loadTimetableData() {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    db.collection('timetable').doc(this.data.timetableId).get({
      success: (res) => {
        if (res.data) {
          this.setData({
            timetableName: res.data.name,
            courses: res.data.courses,
            loading: false
          })
          // 初始化日期数据
          this.initDateData()
        } else {
          wx.showToast({
            title: '课表不存在',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      },
      fail: (err) => {
        console.error('加载课表失败:', err)
        wx.showToast({
          title: '加载课表失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },
  
  // 初始化日期数据
  initDateData() {
    const currentDate = this.data.currentDate
    
    if (this.data.activeView === 'week') {
      // 计算周日期
      const weekDates = []
      const startOfWeek = new Date(currentDate)
      const dayOfWeek = startOfWeek.getDay() || 7 // 将周日从0改为7
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1) // 本周一
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        weekDates.push(`${date.getMonth() + 1}/${date.getDate()}`)
      }
      
      // 计算当前周期文本
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      const currentPeriodText = `${startOfWeek.getFullYear()}/${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`
      
      this.setData({
        weekDates: weekDates,
        currentPeriodText: currentPeriodText
      })
    } else {
      // 计算当前天文本
      const currentDayText = `${this.data.weekDays[this.data.currentDate.getDay() - 1]} ${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()}`
      
      this.setData({
        currentDayText: currentDayText
      })
    }
  },
  
  // 切换视图
  switchView(e) {
    const view = e.currentTarget.dataset.view
    this.setData({
      activeView: view
    })
    // 初始化日期数据
    this.initDateData()
    // 保存用户偏好设置
    wx.setStorageSync('timetableViewPreference', view)
  },
  
  // 上一周/天
  prevPeriod() {
    const currentDate = new Date(this.data.currentDate)
    
    if (this.data.activeView === 'week') {
      currentDate.setDate(currentDate.getDate() - 7)
    } else {
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    this.setData({
      currentDate: currentDate
    })
    // 初始化日期数据
    this.initDateData()
  },
  
  // 下一周/天
  nextPeriod() {
    const currentDate = new Date(this.data.currentDate)
    
    if (this.data.activeView === 'week') {
      currentDate.setDate(currentDate.getDate() + 7)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    this.setData({
      currentDate: currentDate
    })
    // 初始化日期数据
    this.initDateData()
  },
  
  // 根据时间槽和星期获取课程
  getCoursesByDayAndTime(timeIndex, dayIndex) {
    const courses = this.data.courses
    const dayOfWeek = dayIndex + 1 // 转换为1-7的数字
    
    return courses.filter(course => {
      return course.dayOfWeek === dayOfWeek
    })
  },
  
  // 根据时间槽获取当天课程
  getCoursesByDayTime(timeIndex) {
    const courses = this.data.courses
    const dayOfWeek = this.data.currentDate.getDay() || 7 // 将周日从0改为7
    
    return courses.filter(course => {
      return course.dayOfWeek === dayOfWeek
    })
  },
  
  // 显示课程详情
  showCourseDetail(e) {
    const course = e.currentTarget.dataset.course
    this.setData({
      selectedCourse: course,
      showDetailModal: true
    })
  },
  
  // 关闭课程详情弹窗
  closeDetailModal() {
    this.setData({
      showDetailModal: false,
      selectedCourse: null
    });
  },
  
  // 导航到课程录入页面
  navigateToCourseInput() {
    wx.navigateTo({
      url: '/pages/courseInput/courseInput'
    });
  }
});
