// 课表导入云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { timetableId, userId } = event
    
    // 1. 查找课表
    const timetableResult = await db.collection('timetable').doc(timetableId).get()
    
    if (!timetableResult.data) {
      return {
        success: false,
        message: '课表不存在'
      }
    }
    
    const timetable = timetableResult.data
    
    // 2. 更新课表的导入次数
    await db.collection('timetable').doc(timetableId).update({
      data: {
        shareCount: _.inc(1)
      }
    })
    
    // 3. 为用户创建副本（如果需要）
    // 这里可以根据业务需求决定是否创建用户专属副本
    // 暂时只返回课表数据
    
    return {
      success: true,
      timetable: timetable
    }
  } catch (error) {
    console.error('导入课表失败:', error)
    return {
      success: false,
      message: '导入课表失败',
      error: error.message
    }
  }
}