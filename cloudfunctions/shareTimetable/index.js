// 分享课表云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 确保集合存在
async function ensureCollection(collectionName) {
  try {
    // 尝试获取集合信息，如果不存在会报错
    await db.collection(collectionName).limit(1).get();
  } catch (err) {
    // 集合不存在，尝试创建
    if (err.message && (err.message.includes('collection not found') || err.message.includes('not exist'))) {
      try {
        await db.createCollection(collectionName);
        console.log(`集合 ${collectionName} 创建成功`);
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr);
        // 如果创建失败（可能是权限问题），继续尝试使用
      }
    }
  }
}

// 生成分享码
async function generateShareCode(event, context) {
  const wxContext = cloud.getWXContext();
  const { timetableId } = event;
  
  try {
    // 确保 shareCodes 集合存在
    await ensureCollection('shareCodes');
    
    // 1. 验证课表是否存在且属于当前用户
    const timetableResult = await db.collection('timetables').doc(timetableId).get();
    const timetable = timetableResult.data;
    
    if (!timetable || timetable.openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '课表不存在或无权限'
      };
    }
    
    // 2. 检查是否已有未过期的分享码
    const existingShare = await db.collection('shareCodes')
      .where({
        timetableId: timetableId,
        openid: wxContext.OPENID,
        expireTime: _.gt(new Date())
      })
      .limit(1)
      .get();
    
    if (existingShare.data.length > 0) {
      // 返回已有的分享码
      return {
        success: true,
        data: {
          shareCode: existingShare.data[0].shareCode,
          expireTime: existingShare.data[0].expireTime
        }
      };
    }
    
    // 3. 生成新的分享码（10位数字字母组合）
    const shareCode = generateRandomCode(10);
    
    // 4. 计算过期时间（1小时后）
    const expireTime = new Date(Date.now() + 60 * 60 * 1000);
    
    // 5. 保存到数据库
    await db.collection('shareCodes').add({
      data: {
        shareCode: shareCode,
        timetableId: timetableId,
        openid: wxContext.OPENID,
        timetableData: {
          name: timetable.name,
          courses: timetable.courses
        },
        createTime: db.serverDate(),
        expireTime: expireTime
      }
    });
    
    return {
      success: true,
      data: {
        shareCode: shareCode,
        expireTime: expireTime
      }
    };
    
  } catch (err) {
    console.error('生成分享码失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

// 验证并导入课表
async function importTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  const { shareCode } = event;
  
  try {
    // 确保 shareCodes 集合存在
    await ensureCollection('shareCodes');
    
    // 1. 验证分享码格式
    if (!shareCode || !/^[a-zA-Z0-9]{10}$/.test(shareCode)) {
      return {
        success: false,
        message: '分享码格式错误，请输入10位数字字母组合'
      };
    }
    
    // 2. 查找分享码
    const shareResult = await db.collection('shareCodes')
      .where({
        shareCode: shareCode.toUpperCase()
      })
      .limit(1)
      .get();
    
    if (shareResult.data.length === 0) {
      return {
        success: false,
        message: '分享码不存在'
      };
    }
    
    const shareData = shareResult.data[0];
    
    // 3. 检查是否过期
    const now = new Date();
    const expireTime = new Date(shareData.expireTime);
    if (now > expireTime) {
      return {
        success: false,
        message: '分享码已过期，请重新获取'
      };
    }
    
    // 4. 检查是否导入自己的课表
    if (shareData.openid === wxContext.OPENID) {
      return {
        success: false,
        message: '不能导入自己的课表'
      };
    }
    
    // 5. 创建新课表
    const newTimetable = {
      openid: wxContext.OPENID,
      name: `${shareData.timetableData.name}（导入）`,
      isMain: false,
      courses: shareData.timetableData.courses,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      isDeleted: false
    };
    
    const result = await db.collection('timetables').add({
      data: newTimetable
    });
    
    return {
      success: true,
      data: {
        timetableId: result._id,
        name: newTimetable.name
      }
    };
    
  } catch (err) {
    console.error('导入课表失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

// 生成随机分享码
function generateRandomCode(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 主入口
exports.main = async (event, context) => {
  const { action } = event;
  
  switch (action) {
    case 'generate':
      return await generateShareCode(event, context);
    case 'import':
      return await importTimetable(event, context);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};
