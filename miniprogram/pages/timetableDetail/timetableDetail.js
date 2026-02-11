// 课表详情页面逻辑
Page({
  data: {
    // 课表ID
    timetableId: '',
    // 课表数据
    timetable: {
      name: '',
      courses: [],
      shareCount: 0,
      likeCount: 0,
      ratingCount: 0,
      averageRating: 0,
      isOfficial: false
    },
    // 星期选项
    weekDays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    // 评价列表
    reviews: [],
    // 用户评价状态
    hasLiked: false,
    userRating: 0,
    // 加载状态
    loading: false
  },
  
  onLoad(options) {
    if (options.timetableId) {
      this.setData({
        timetableId: options.timetableId
      })
      this.loadTimetableData()
      this.loadReviews()
      this.checkUserInteraction()
    }
  },
  
  // 加载课表数据
  loadTimetableData() {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    db.collection('timetable').doc(this.data.timetableId).get({
      success: (res) => {
        if (res.data) {
          this.setData({
            timetable: res.data,
            loading: false
          })
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
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },
  
  // 加载评价数据
  loadReviews() {
    const db = wx.cloud.database()
    db.collection('reviews').where({
      timetableId: this.data.timetableId
    }).get({
      success: (res) => {
        this.setData({
          reviews: res.data
        })
      },
      fail: (err) => {
        console.error('加载评价失败:', err)
      }
    })
  },
  
  // 检查用户交互状态
  checkUserInteraction() {
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const db = wx.cloud.database()
    
    // 检查是否点赞
    db.collection('timetable').doc(this.data.timetableId).get({
      success: (res) => {
        if (res.data && res.data.likedUsers && res.data.likedUsers.includes(userId)) {
          this.setData({ hasLiked: true })
        }
      }
    })
    
    // 检查用户评价
    db.collection('reviews').where({
      timetableId: this.data.timetableId,
      userId: userId
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          this.setData({ userRating: res.data[0].rating })
        }
      }
    })
  },
  
  // 导入课表
  importTimetable() {
    wx.cloud.callFunction({
      name: 'importTimetable',
      data: {
        timetableId: this.data.timetableId,
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
              url: '/pages/timetableShow/timetableShow?timetableId=' + this.data.timetableId
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.result.message || '导入失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('导入课表失败:', err)
        wx.showToast({
          title: '导入失败',
          icon: 'none'
        })
      }
    })
  },
  
  // 分享课表
  shareTimetable() {
    wx.showActionSheet({
      itemList: ['复制课表ID', '分享给好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制课表ID
          wx.setClipboardData({
            data: this.data.timetableId,
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
  
  // 点赞课表
  likeTimetable() {
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const db = wx.cloud.database()
    const _ = db.command
    
    if (this.data.hasLiked) {
      // 取消点赞
      db.collection('timetable').doc(this.data.timetableId).update({
        data: {
          likeCount: _.inc(-1),
          likedUsers: _.pull(userId)
        },
        success: () => {
          this.setData({ hasLiked: false })
          this.setData({
            timetable: {
              ...this.data.timetable,
              likeCount: this.data.timetable.likeCount - 1
            }
          })
          wx.showToast({
            title: '已取消点赞',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('取消点赞失败:', err)
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      })
    } else {
      // 点赞
      db.collection('timetable').doc(this.data.timetableId).update({
        data: {
          likeCount: _.inc(1),
          likedUsers: _.push(userId)
        },
        success: () => {
          this.setData({ hasLiked: true })
          this.setData({
            timetable: {
              ...this.data.timetable,
              likeCount: this.data.timetable.likeCount + 1
            }
          })
          wx.showToast({
            title: '点赞成功',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('点赞失败:', err)
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      })
    }
  },
  
  // 评价课表
  rateTimetable(e) {
    const rating = e.currentTarget.dataset.rating
    const userId = wx.getStorageSync('userId') || 'anonymous'
    const db = wx.cloud.database()
    
    // 检查是否已经评价过
    db.collection('reviews').where({
      timetableId: this.data.timetableId,
      userId: userId
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          // 更新评价
          db.collection('reviews').doc(res.data[0]._id).update({
            data: {
              rating: rating
            },
            success: () => {
              this.updateTimetableRating()
              this.setData({ userRating: rating })
              this.loadReviews()
              wx.showToast({
                title: '评价更新成功',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('更新评价失败:', err)
              wx.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          })
        } else {
          // 创建新评价
          db.collection('reviews').add({
            data: {
              timetableId: this.data.timetableId,
              userId: userId,
              rating: rating,
              createTime: new Date()
            },
            success: () => {
              this.updateTimetableRating()
              this.setData({ userRating: rating })
              this.loadReviews()
              wx.showToast({
                title: '评价成功',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('创建评价失败:', err)
              wx.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },
  
  // 更新课表评分
  updateTimetableRating() {
    const db = wx.cloud.database()
    
    // 计算平均评分
    db.collection('reviews').where({
      timetableId: this.data.timetableId
    }).get({
      success: (res) => {
        if (res.data.length > 0) {
          const totalRating = res.data.reduce((sum, review) => sum + review.rating, 0)
          const averageRating = (totalRating / res.data.length).toFixed(1)
          
          // 更新课表评分
          db.collection('timetable').doc(this.data.timetableId).update({
            data: {
              averageRating: parseFloat(averageRating),
              ratingCount: res.data.length
            }
          })
          
          // 更新本地数据
          this.setData({
            timetable: {
              ...this.data.timetable,
              averageRating: parseFloat(averageRating),
              ratingCount: res.data.length
            }
          })
        }
      }
    })
  },
  
  // 获取评分百分比
  getRatingPercentage(rating) {
    const reviews = this.data.reviews
    const count = reviews.filter(review => review.rating === rating).length
    const total = reviews.length
    return total > 0 ? (count / total) * 100 : 0
  },
  
  // 获取评分数量
  getRatingCount(rating) {
    const reviews = this.data.reviews
    return reviews.filter(review => review.rating === rating).length
  },
  
  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  
  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.timetable.name,
      path: `/pages/timetableDetail/timetableDetail?timetableId=${this.data.timetableId}`,
      imageUrl: ''
    }
  }
})