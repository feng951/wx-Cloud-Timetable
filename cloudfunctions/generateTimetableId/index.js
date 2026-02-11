// 生成唯一课表ID云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    // 生成唯一ID：前缀 + 时间戳 + 随机数
    const prefix = 'TT'
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 6)
    const timetableId = prefix + timestamp + random
    
    return {
      success: true,
      timetableId: timetableId
    }
  } catch (error) {
    console.error('生成课表ID失败:', error)
    return {
      success: false,
      message: '生成课表ID失败',
      error: error.message
    }
  }
}