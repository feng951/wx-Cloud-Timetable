// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  const db = cloud.database();
  const userCollection = db.collection('users');
  
  try {
    // 查询用户是否已存在
    const { data } = await userCollection.where({
      openid: wxContext.OPENID
    }).get();
    
    if (data.length === 0) {
      // 新用户，创建用户记录
      const userInfo = {
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        nickName: event.nickName || '',
        avatarUrl: event.avatarUrl || '',
        mainTimetableId: null
      };
      
      const result = await userCollection.add({
        data: userInfo
      });
      
      return {
        success: true,
        isNewUser: true,
        userId: result._id,
        openid: wxContext.OPENID
      };
    } else {
      // 已存在用户，更新信息
      await userCollection.doc(data[0]._id).update({
        data: {
          updateTime: db.serverDate(),
          nickName: event.nickName || data[0].nickName,
          avatarUrl: event.avatarUrl || data[0].avatarUrl
        }
      });
      
      return {
        success: true,
        isNewUser: false,
        userId: data[0]._id,
        openid: wxContext.OPENID,
        mainTimetableId: data[0].mainTimetableId
      };
    }
  } catch (err) {
    console.error('登录失败:', err);
    return {
      success: false,
      message: err.message
    };
  }
};
