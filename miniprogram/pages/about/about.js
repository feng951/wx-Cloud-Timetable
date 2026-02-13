// about.js - 关于我们页面逻辑
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载
    console.log('关于我们页面加载');
  },

  onShow() {
    // 页面显示
  },

  // 复制QQ号码
  copyQQ() {
    const qqNumber = '1695080607';
    wx.setClipboardData({
      data: qqNumber,
      success: () => {
        wx.showToast({
          title: 'QQ号码已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 复制邮箱地址
  copyEmail() {
    const email = 'yu1695080607@foxmail.com';
    wx.setClipboardData({
      data: email,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 打开GitHub仓库
  openGitHub() {
    const githubUrl = 'https://github.com/feng951/wx-Cloud-Timetable.git';
    this.openExternalLink(githubUrl, 'GitHub');
  },

  // 打开Gitee仓库
  openGitee() {
    const giteeUrl = 'https://gitee.com/beifengc/wx-cloud-timetable.git';
    this.openExternalLink(giteeUrl, 'Gitee');
  },

  // 打开用户协议
  openUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
  },

  // 打开隐私政策
  openPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  // 打开外部链接通用方法
  openExternalLink(url, platformName) {
    wx.showModal({
      title: '提示',
      content: `即将跳转到${platformName}仓库页面`,
      confirmText: '前往',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 复制链接到剪贴板
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success',
                duration: 2000
              });
            }
          });
          
          // 尝试打开链接
          wx.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(url)}`,
            fail: () => {
              // 如果跳转失败，提示用户手动访问
              wx.showModal({
                title: '访问链接',
                content: `链接已复制到剪贴板，请在浏览器中打开：\n${url}`,
                showCancel: false
              });
            }
          });
        }
      }
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '风表 - 简洁高效的课表管理工具',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '风表 - 简洁高效的课表管理工具',
      query: ''
    };
  }
});
