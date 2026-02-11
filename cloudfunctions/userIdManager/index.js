// 用户ID管理云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 确保集合存在
async function ensureCollection(collectionName) {
  try {
    await db.collection(collectionName).limit(1).get();
  } catch (err) {
    if (err.message && (err.message.includes('collection not found') || err.message.includes('not exist'))) {
      try {
        await db.createCollection(collectionName);
        console.log(`集合 ${collectionName} 创建成功`);
      } catch (createErr) {
        console.error(`创建集合 ${collectionName} 失败:`, createErr);
      }
    }
  }
}

// 获取或创建用户ID
async function getOrCreateUserId(event, context) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    // 确保集合存在
    await ensureCollection('userIds');
    await ensureCollection('userIdCounter');
    
    // 1. 检查用户是否已有ID
    const existingUser = await db.collection('userIds')
      .where({ openid: openid })
      .limit(1)
      .get();
    
    if (existingUser.data.length > 0) {
      // 用户已有ID，直接返回
      return {
        success: true,
        data: {
          userId: existingUser.data[0].userId,
          isNew: false
        }
      };
    }
    
    // 2. 生成新ID
    const newUserId = await generateNextUserId();
    
    // 3. 保存用户ID映射
    await db.collection('userIds').add({
      data: {
        openid: openid,
        userId: newUserId,
        createTime: db.serverDate()
      }
    });
    
    return {
      success: true,
      data: {
        userId: newUserId,
        isNew: true
      }
    };
    
  } catch (err) {
    console.error('获取用户ID失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

// 生成下一个用户ID
async function generateNextUserId() {
  // 使用计数器集合来确保ID唯一性
  const counterDocId = 'userIdCounter';
  
  try {
    // 尝试获取计数器
    const counterResult = await db.collection('userIdCounter').doc(counterDocId).get();
    const currentNum = counterResult.data.currentNum || 1;
    const currentLetter = counterResult.data.currentLetter || 'A';
    
    // 生成ID
    const userId = `${currentLetter}${String(currentNum).padStart(4, '0')}`;
    
    // 计算下一个ID
    let nextNum = currentNum + 1;
    let nextLetter = currentLetter;
    
    if (nextNum > 9999) {
      // 数字进位到字母
      nextNum = 1;
      nextLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      
      // 检查是否超过Z
      if (nextLetter > 'Z') {
        throw new Error('用户ID已达到上限Z9999');
      }
    }
    
    // 更新计数器
    await db.collection('userIdCounter').doc(counterDocId).update({
      data: {
        currentNum: nextNum,
        currentLetter: nextLetter,
        updateTime: db.serverDate()
      }
    });
    
    return userId;
    
  } catch (err) {
    if (err.message && err.message.includes('document not found')) {
      // 计数器不存在，初始化
      await db.collection('userIdCounter').add({
        data: {
          _id: counterDocId,
          currentNum: 2,  // 下一个从2开始，因为当前分配1
          currentLetter: 'A',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      
      return 'A0001';
    }
    
    throw err;
  }
}

// 查询用户ID
async function queryUserId(event, context) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    await ensureCollection('userIds');
    
    const result = await db.collection('userIds')
      .where({ openid: openid })
      .limit(1)
      .get();
    
    if (result.data.length > 0) {
      return {
        success: true,
        data: {
          userId: result.data[0].userId
        }
      };
    } else {
      return {
        success: false,
        message: '用户ID未找到'
      };
    }
    
  } catch (err) {
    console.error('查询用户ID失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

// 主入口
exports.main = async (event, context) => {
  const { action } = event;
  
  switch (action) {
    case 'getOrCreate':
      return await getOrCreateUserId(event, context);
    case 'query':
      return await queryUserId(event, context);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};
