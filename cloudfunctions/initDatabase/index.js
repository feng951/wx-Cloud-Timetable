// 数据库初始化云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 1. 创建课程表集合
    await db.createCollection('timetable')
    console.log('创建课程表集合成功')
    
    // 2. 创建用户集合
    await db.createCollection('users')
    console.log('创建用户集合成功')
    
    // 3. 创建班级集合
    await db.createCollection('classes')
    console.log('创建班级集合成功')
    
    // 4. 创建评价集合
    await db.createCollection('reviews')
    console.log('创建评价集合成功')
    
    // 5. 创建索引
    // 课程表集合索引
    await db.collection('timetable').createIndex({
      creator: 1
    })
    await db.collection('timetable').createIndex({
      shareCount: -1
    })
    await db.collection('timetable').createIndex({
      averageRating: -1
    })
    
    // 评价集合索引
    await db.collection('reviews').createIndex({
      timetableId: 1,
      userId: 1
    }, {
      unique: true
    })
    
    console.log('创建索引成功')
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    }
  }
}