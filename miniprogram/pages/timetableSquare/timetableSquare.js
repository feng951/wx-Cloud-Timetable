// 课表广场页面逻辑
Page({
  data: {
    // 课表列表
    timetables: [],
    // 搜索关键词
    searchKeyword: '',
    // 导入ID
    importId: '',
    // 加载状态
    loading: false,
    // 是否有更多数据
    hasMore: true,
    // 分页参数
    page: 1,
    pageSize: 10
  },
  
  onLoad() {
    this.loadTimetables()
  },
  
  // 加载课表列表
  loadTimetables() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    const skip = (this.data.page - 1) * this.data.pageSize
    
    db.collection('timetable')
      .orderBy('shareCount', 'desc')
      .skip(skip)
      .limit(this.data.pageSize)
      .get({
        success: (res) => {
          if (res.data.length > 0) {
            const newTimetables = this.data.timetables.concat(res.data)
            this.setData({
              timetables: newTimetables,
              loading: false,
              page: this.data.page + 1,
              hasMore: res.data.length === this.data.pageSize
            })
          } else {
            this.setData({
              loading: false,
              hasMore: false
            })
          }
        },
        fail: (err) => {
          console.error('加载课表列表失败:', err)
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      })
  },
  
  // 搜索课表
  searchTimetables() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }
    
    this.setData({ 
      loading: true,
      timetables: [],
      page: 1,
      hasMore: true
    })
    
    const db = wx.cloud.database()
    db.collection('timetable')
      .where({
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
      .orderBy('shareCount', 'desc')
      .limit(this.data.pageSize)
      .get({
        success: (res) => {
          this.setData({
            timetables: res.data,
            loading: false,
            hasMore: res.data.length === this.data.pageSize
          })
        },
        fail: (err) => {
          console.error('搜索课表失败:', err)
          wx.showToast({
            title: '搜索失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      })
  },
  
  // 处理搜索输入
  handleSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },
  
  // 处理导入ID输入
  handleImportIdInput(e) {
    this.setData({
      importId: e.detail.value
    })
  },
  
  // 导入课表
  importTimetable() {
    const importId = this.data.importId.trim()
    if (!importId) {
      wx.showToast({
        title: '请输入课表ID',
        icon: 'none'
      })
      return
    }
    
    this.importTimetableById(importId)
  },
  
  // 根据ID导入课表
  importTimetableById(e) {
    const timetableId = typeof e === 'string' ? e : e.currentTarget.dataset.id
    
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'importTimetable',
      data: {
        timetableId: timetableId,
        userId: wx.getStorageSync('userId') || 'anonymous'
      },
      success: (res) => {
        if (res.result.success) {
          wx.showToast({
            title: '导入成功',
            icon: 'success'
          })
          // 跳转到课表展示页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/timetableShow/timetableShow?timetableId=' + timetableId
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.result.message || '导入失败',
            icon: 'none'
          })
        }
        this.setData({ loading: false })
      },
      fail: (err) => {
        console.error('导入课表失败:', err)
        wx.showToast({
          title: '导入失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },
  
  // 分享课表
  shareTimetable(e) {
    const timetableId = e.currentTarget.dataset.id
    
    wx.showActionSheet({
      itemList: ['复制课表ID', '分享给好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制课表ID
          wx.setClipboardData({
            data: timetableId,
            success: () => {
              wx.showToast({
                title: '课表ID已复制',
                icon: 'success'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 分享给好友
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          })
        }
      }
    })
  },
  
  // 显示课表详情
  showTimetableDetail(e) {
    const timetable = e.currentTarget.dataset.timetable
    
    wx.navigateTo({
      url: '/pages/timetableDetail/timetableDetail?timetableId=' + timetable._id
    })
  },
  
  // 加载更多
  loadMore() {
    this.loadTimetables()
  },
  
  // 防止点击冒泡
  preventTap() {
    // 空函数，用于阻止事件冒泡
  },
  
  // 分享功能
  onShareAppMessage() {
    return {
      title: '智能课程表 - 发现更多优质课表',
      path: '/pages/timetableSquare/timetableSquare',
      imageUrl: ''
    }
  }
})