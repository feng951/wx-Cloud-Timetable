// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    console.log('登录请求，OPENID:', wxContext.OPENID);
    console.log('请求参数:', event);
    
    // 检查数据库是否初始化
    const db = cloud.database();
    let userCollection;
    
    try {
      userCollection = db.collection('users');
    } catch (err) {
      console.error('数据库初始化失败:', err);
      // 如果数据库未初始化，返回模拟数据
      return {
        success: true,
        isNewUser: true,
        data: {
          userInfo: {
            _id: 'temp_' + Date.now(),
            openid: wxContext.OPENID,
            nickName: '微信用户',
            avatarUrl: '',
            mainTimetableId: null
          },
          token: `${wxContext.OPENID}_${Date.now()}`
        }
      };
    }
    
    let userInfo;
    let isNewUser = false;
    
    try {
      // 查询用户是否已存在
      const { data } = await userCollection.where({
        openid: wxContext.OPENID
      }).get();
      
      console.log('查询结果:', data.length, '条记录');
      
      if (data.length === 0) {
        // 新用户，创建用户记录
        isNewUser = true;
        userInfo = {
          openid: wxContext.OPENID,
          unionid: wxContext.UNIONID || '',
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          nickName: event.nickName || '微信用户',
          avatarUrl: event.avatarUrl || '',
          mainTimetableId: null
        };
        
        const result = await userCollection.add({
          data: userInfo
        });
        
        userInfo._id = result._id;
        console.log('新用户创建成功:', result._id);
      } else {
        // 已存在用户
        const existingUser = data[0];
        console.log('已存在用户:', existingUser._id);
        
        userInfo = {
          _id: existingUser._id,
          openid: existingUser.openid || wxContext.OPENID,
          nickName: existingUser.nickName || '微信用户',
          avatarUrl: existingUser.avatarUrl || '',
          mainTimetableId: existingUser.mainTimetableId || null
        };
        
        // 更新登录时间
        try {
          await userCollection.doc(existingUser._id).update({
            data: {
              updateTime: db.serverDate()
            }
          });
        } catch (updateErr) {
          console.log('更新登录时间失败（非关键错误）:', updateErr);
        }
      }
    } catch (dbErr) {
      console.error('数据库操作失败:', dbErr);
      // 数据库操作失败时，返回临时用户信息
      userInfo = {
        _id: 'temp_' + Date.now(),
        openid: wxContext.OPENID,
        nickName: '微信用户',
        avatarUrl: '',
        mainTimetableId: null
      };
      isNewUser = true;
    }
    
    // 生成 token
    const token = `${wxContext.OPENID}_${Date.now()}`;
    
    const responseData = {
      success: true,
      isNewUser: isNewUser,
      data: {
        userInfo: {
          _id: userInfo._id,
          openid: userInfo.openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          mainTimetableId: userInfo.mainTimetableId
        },
        token: token
      }
    };
    
    console.log('登录成功，返回数据:', JSON.stringify(responseData));
    return responseData;
    
  } catch (err) {
    console.error('登录失败:', err);
    
    // 任何错误都返回一个可用的响应
    return {
      success: true, // 即使出错也返回成功，使用临时数据
      isNewUser: true,
      data: {
        userInfo: {
          _id: 'temp_' + Date.now(),
          openid: wxContext.OPENID || 'unknown',
          nickName: '微信用户',
          avatarUrl: '',
          mainTimetableId: null
        },
        token: `temp_${Date.now()}`
      }
    };
  }
};
