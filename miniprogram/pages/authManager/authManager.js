// 认证管理页面逻辑
Page({
  data: {
    // 班级绑定相关
    className: '',
    applyReason: '',
    managedClasses: [],
    // 官方认证相关
    // 错误反馈相关
    feedbackTimetableId: '',
    errorTypes: ['课程信息错误', '时间地点错误', '教师信息错误', '周次信息错误', '其他错误'],
    selectedErrorType: '',
    errorDescription: '',
    // 加载状态
    loading: false
  },
  
  onLoad() {
    this.loadManagedClasses()
  },
  
  // 加载管理的班级
  loadManagedClasses() {
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const db = wx.cloud.database()
    
    db.collection('classes').where({
      managerId: userId
    }).get({
      success: (res) => {
        this.setData({
          managedClasses: res.data
        })
      },
      fail: (err) => {
        console.error('加载班级失败:', err)
      }
    })
  },
  
  // 处理班级名称输入
  handleClassNameInput(e) {
    this.setData({
      className: e.detail.value
    })
  },
  
  // 处理申请理由输入
  handleApplyReasonInput(e) {
    this.setData({
      applyReason: e.detail.value
    })
  },
  
  // 申请班级管理员
  applyClassManager() {
    if (!this.data.className) {
      wx.showToast({
        title: '请输入班级名称',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.applyReason) {
      wx.showToast({
        title: '请输入申请理由',
        icon: 'none'
      })
      return
    }
    
    this.setData({ loading: true })
    
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const db = wx.cloud.database()
    
    // 检查班级是否已存在
    db.collection('classes').where({
      className: this.data.className
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          wx.showToast({
            title: '班级已存在',
            icon: 'none'
          })
          this.setData({ loading: false })
        } else {
          // 创建新班级
          db.collection('classes').add({
            data: {
              className: this.data.className,
              managerId: userId,
              createTime: new Date(),
              officialTimetableId: ''
            },
            success: (addRes) => {
              wx.showToast({
                title: '申请成功',
                icon: 'success'
              })
              this.setData({ loading: false })
              // 刷新班级列表
              this.loadManagedClasses()
            },
            fail: (err) => {
              console.error('创建班级失败:', err)
              wx.showToast({
                title: '申请失败',
                icon: 'none'
              })
              this.setData({ loading: false })
            }
          })
        }
      }
    })
  },
  
  // 管理班级课表
  manageClassTimetable(e) {
    const classId = e.currentTarget.dataset.classid
    // 跳转到班级课表管理页面
    wx.navigateTo({
      url: `/pages/classTimetable/classTimetable?classId=${classId}`
    })
  },
  
  // 查看班级成员
  viewClassMembers(e) {
    const classId = e.currentTarget.dataset.classid
    // 跳转到班级成员页面
    wx.navigateTo({
      url: `/pages/classMembers/classMembers?classId=${classId}`
    })
  },
  
  // 申请官方认证
  applyOfficialAuth() {
    wx.showModal({
      title: '申请官方认证',
      content: '请选择需要认证的课表',
      success: (res) => {
        if (res.confirm) {
          // 跳转到课表选择页面
          wx.navigateTo({
            url: '/pages/selectTimetable/selectTimetable?purpose=auth'
          })
        }
      }
    })
  },
  
  // 处理反馈课表ID输入
  handleFeedbackTimetableIdInput(e) {
    this.setData({
      feedbackTimetableId: e.detail.value
    })
  },
  
  // 处理错误类型选择
  handleErrorTypeChange(e) {
    const index = e.detail.value
    this.setData({
      selectedErrorType: this.data.errorTypes[index]
    })
  },
  
  // 处理错误描述输入
  handleErrorDescriptionInput(e) {
    this.setData({
      errorDescription: e.detail.value
    })
  },
  
  // 提交错误反馈
  submitErrorFeedback() {
    if (!this.data.feedbackTimetableId) {
      wx.showToast({
        title: '请输入课表ID',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.selectedErrorType) {
      wx.showToast({
        title: '请选择错误类型',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.errorDescription) {
      wx.showToast({
        title: '请输入错误描述',
        icon: 'none'
      })
      return
    }
    
    this.setData({ loading: true })
    
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const feedbackData = {
      timetableId: this.data.feedbackTimetableId,
      userId: userId,
      errorType: this.data.selectedErrorType,
      description: this.data.errorDescription,
      createTime: new Date(),
      status: 'pending'
    }
    
    // 调用云函数处理错误反馈
    wx.cloud.callFunction({
      name: 'reportError',
      data: feedbackData,
      success: (res) => {
        if (res.result.success) {
          wx.showToast({
            title: '反馈成功',
            icon: 'success'
          })
          // 重置表单
          this.setData({
            feedbackTimetableId: '',
            selectedErrorType: '',
            errorDescription: ''
          })
        } else {
          wx.showToast({
            title: '反馈失败',
            icon: 'none'
          })
        }
        this.setData({ loading: false })
      },
      fail: (err) => {
        console.error('提交反馈失败:', err)
        wx.showToast({
          title: '反馈失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  }
})