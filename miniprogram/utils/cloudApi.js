// 云开发API封装
const cloud = wx.cloud;
cloud.init({ env: 'cloudbase-5g3l9ofwe35b022a', traceUser: true });
const db = cloud.database();

// 通用调用函数
const callCloud = (name, data) => cloud.callFunction({ name, data });

// 用户相关API
const userApi = {
  login: (userInfo) => callCloud('login', { nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl }),
  getUserInfo: () => db.collection('users').where({ openid: '{openid}' }).get()
};

// 课表相关API
const timetableApi = {
  getTimetables: () => callCloud('timetable', { action: 'getTimetables' }),
  getMainTimetable: () => callCloud('timetable', { action: 'getMainTimetable' }),
  createTimetable: (name, isMain = false, courses = null) => callCloud('timetable', { action: 'create', name, isMain, courses: courses || [[], [], [], [], [], [], []] }),
  updateTimetable: (timetableId, data) => callCloud('timetable', { action: 'update', timetableId, ...data }),
  deleteTimetable: (timetableId) => callCloud('timetable', { action: 'delete', timetableId }),
  setMainTimetable: (timetableId) => callCloud('timetable', { action: 'setMain', timetableId }),
  updateCourse: (timetableId, courses) => callCloud('timetable', { action: 'update', timetableId, courses })
};

// 分享相关API
const shareApi = {
  generateShareCode: (timetableId) => callCloud('shareTimetable', { action: 'generate', timetableId }),
  importTimetable: (shareCode) => callCloud('shareTimetable', { action: 'import', shareCode })
};

// 用户ID管理API
const userIdApi = {
  getOrCreateUserId: () => callCloud('userIdManager', { action: 'getOrCreate' }),
  queryUserId: () => callCloud('userIdManager', { action: 'query' })
};

// 本地存储API
const localApi = {
  saveTimetables: (timetables) => {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) wx.setStorageSync(`timetables_${userInfo.nickName || 'default'}`, timetables);
  },
  getTimetables: () => {
    const userInfo = wx.getStorageSync('userInfo');
    return userInfo ? wx.getStorageSync(`timetables_${userInfo.nickName || 'default'}`) || [] : [];
  },
  saveSettings: (timetableId, settings) => wx.setStorageSync(`timetable_${timetableId}_settings`, settings),
  getSettings: (timetableId) => wx.getStorageSync(`timetable_${timetableId}_settings`)
};

module.exports = {
  userApi,
  timetableApi,
  shareApi,
  userIdApi,
  localApi,
  cloud,
  db
};
