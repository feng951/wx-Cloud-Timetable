// 课表相关云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 获取所有课表
async function getTimetables(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    const { data } = await db.collection('timetables')
      .where({
        openid: wxContext.OPENID,
        isDeleted: _.neq(true)
      })
      .orderBy('createTime', 'desc')
      .get();
    
    return {
      success: true,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

// 获取主课表
async function getMainTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    // 先查找用户设置的主课表
    const { data: userData } = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get();
    
    let timetable;
    
    if (userData.length > 0 && userData[0].mainTimetableId) {
      const result = await db.collection('timetables').doc(userData[0].mainTimetableId).get();
      timetable = result.data;
    }
    
    // 如果没有主课表，获取第一个课表
    if (!timetable) {
      const { data } = await db.collection('timetables')
        .where({
          openid: wxContext.OPENID,
          isDeleted: _.neq(true)
        })
        .limit(1)
        .get();
      
      if (data.length > 0) {
        timetable = data[0];
      }
    }
    
    return {
      success: true,
      data: timetable
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

// 创建课表
async function createTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    const timetableData = {
      openid: wxContext.OPENID,
      name: event.name || '我的课表',
      isMain: event.isMain || false,
      courses: event.courses || [[], [], [], [], [], [], []],
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      isDeleted: false
    };
    
    const result = await db.collection('timetables').add({
      data: timetableData
    });
    
    // 如果是主课表，更新用户设置
    if (timetableData.isMain) {
      await db.collection('users').where({
        openid: wxContext.OPENID
      }).update({
        data: {
          mainTimetableId: result._id,
          updateTime: db.serverDate()
        }
      });
    }
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...timetableData
      }
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

// 更新课表
async function updateTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    const updateData = {
      updateTime: db.serverDate()
    };
    
    if (event.name !== undefined) updateData.name = event.name;
    if (event.courses !== undefined) updateData.courses = event.courses;
    if (event.isMain !== undefined) updateData.isMain = event.isMain;
    
    await db.collection('timetables').doc(event.timetableId).update({
      data: updateData
    });
    
    // 如果是设置为主课表
    if (event.isMain) {
      await db.collection('users').where({
        openid: wxContext.OPENID
      }).update({
        data: {
          mainTimetableId: event.timetableId,
          updateTime: db.serverDate()
        }
      });
    }
    
    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

// 删除课表
async function deleteTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    await db.collection('timetables').doc(event.timetableId).update({
      data: {
        isDeleted: true,
        updateTime: db.serverDate()
      }
    });
    
    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}

// 设置主课表
async function setMainTimetable(event, context) {
  const wxContext = cloud.getWXContext();
  
  try {
    // 更新所有课表的isMain状态
    await db.collection('timetables').where({
      openid: wxContext.OPENID
    }).update({
      data: {
        isMain: false
      }
    });
    
    // 设置指定课表为主课表
    await db.collection('timetables').doc(event.timetableId).update({
      data: {
        isMain: true,
        updateTime: db.serverDate()
      }
    });
    
    // 更新用户主课表ID
    await db.collection('users').where({
      openid: wxContext.OPENID
    }).update({
      data: {
        mainTimetableId: event.timetableId,
        updateTime: db.serverDate()
      }
    });
    
    return {
      success: true
    };
  } catch (err) {
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
    case 'getTimetables':
      return await getTimetables(event, context);
    case 'getMainTimetable':
      return await getMainTimetable(event, context);
    case 'create':
      return await createTimetable(event, context);
    case 'update':
      return await updateTimetable(event, context);
    case 'delete':
      return await deleteTimetable(event, context);
    case 'setMain':
      return await setMainTimetable(event, context);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};
