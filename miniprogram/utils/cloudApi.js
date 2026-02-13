// 云开发API封装 - 优化版本
const cloud = wx.cloud;
cloud.init({ env: 'cloudbase-5g3l9ofwe35b022a', traceUser: true });
const db = cloud.database();

const DEFAULT_COURSES = [[], [], [], [], [], [], []];

// 通用调用函数
const callCloud = (name, data) => cloud.callFunction({ name, data });

// 用户相关API
const userApi = {
  login: (userInfo) => callCloud('login', { nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl })
};

// 课表相关API
const timetableApi = {
  getTimetables: () => callCloud('timetable', { action: 'getTimetables' }),
  getMainTimetable: () => callCloud('timetable', { action: 'getMainTimetable' }),
  createTimetable: (name, isMain = false, courses = null) => callCloud('timetable', { action: 'create', name, isMain, courses: courses || DEFAULT_COURSES }),
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
  getOrCreateUserId: () => callCloud('userIdManager', { action: 'getOrCreate' })
};

// 本地存储API
const getUserKey = (prefix = 'timetables') => {
  const userInfo = wx.getStorageSync('userInfo');
  return `${prefix}_${userInfo?.nickName || 'default'}`;
};

const localApi = {
  saveTimetables: (timetables) => wx.setStorageSync(getUserKey(), timetables),
  getTimetables: () => wx.getStorageSync(getUserKey()) || [],
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
