# 风表 - 微信云开发课程表小程序

<p align="center">
  <img src="miniprogram/images/logo.png" alt="风表 Logo" width="120">
</p>

<p align="center">
  <a href="https://github.com/feng951/wx-Cloud-Timetable"><img src="https://img.shields.io/badge/GitHub-风表-blue?logo=github" alt="GitHub"></a>
  <a href="https://gitee.com/beifengc/wx-cloud-timetable"><img src="https://img.shields.io/badge/Gitee-风表-red?logo=gitee" alt="Gitee"></a>
  <img src="https://img.shields.io/badge/微信小程序-云开发-green?logo=wechat" alt="微信小程序">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</p>

## 📖 项目简介

**风表**是一款基于微信云开发的课程表小程序，专为大学生设计，提供简洁、高效的课程管理体验。支持多课表管理、课程分享、周次显示等功能，让课程安排一目了然。

## ✨ 核心功能

### 📅 课程管理
- **多课表支持**：创建多个课表，轻松切换不同学期
- **主课表设置**：设置默认主课表，快速查看
- **课程编辑**：支持课程名称、教师、地点、周次等详细信息
- **颜色标记**：为不同课程设置不同颜色，视觉区分更清晰
- **周次管理**：支持单周、双周、全周课程设置

### 🔄 分享与导入
- **分享码分享**：生成分享码，一键分享课表给同学
- **分享码导入**：通过分享码快速导入他人课表
- **权限控制**：灵活的分享权限管理

### ⚙️ 个性化设置
- **周次显示**：自定义开学日期，自动计算当前周次
- **时间设置**：自定义课程时间段
- **课表管理**：重命名、删除、切换课表

### 👤 用户系统
- **微信登录**：一键微信授权登录
- **用户信息**：自动获取微信昵称和头像
- **数据同步**：云端数据存储，多设备同步

## 🛠️ 技术架构

### 前端
- **框架**：微信小程序原生框架
- **样式**：WXSS + 自定义组件
- **状态管理**：本地存储 + 云开发数据库

### 后端
- **云服务**：微信云开发（CloudBase）
- **云函数**：Node.js
- **数据库**：MongoDB（云开发数据库）
- **存储**：云开发存储

### 云函数列表
| 云函数 | 功能说明 |
|--------|----------|
| `login` | 用户登录，获取/创建用户信息 |
| `timetable` | 课表增删改查、主课表设置 |
| `shareTimetable` | 生成分享码、导入分享课表 |
| `userIdManager` | 用户ID管理 |
| `initDatabase` | 数据库初始化 |

## 📁 项目结构

```
wx-Cloud-Timetable/
├── cloudfunctions/          # 云函数目录
│   ├── login/              # 登录云函数
│   ├── timetable/          # 课表管理云函数
│   ├── shareTimetable/     # 分享功能云函数
│   ├── userIdManager/      # 用户ID管理云函数
│   └── initDatabase/       # 数据库初始化云函数
├── miniprogram/            # 小程序前端目录
│   ├── pages/              # 页面目录
│   │   ├── index/          # 首页（课表展示）
│   │   ├── courseInput/    # 课程编辑页
│   │   ├── timetableList/  # 课表列表页
│   │   ├── timetableSettings/ # 课表设置页
│   │   ├── profile/        # 个人中心
│   │   ├── about/          # 关于页面
│   │   ├── privacy/        # 隐私协议
│   │   └── agreement/      # 用户协议
│   ├── utils/              # 工具函数
│   │   └── cloudApi.js     # 云开发API封装
│   ├── images/             # 图片资源
│   └── app.js/app.json/... # 小程序配置
├── project.config.json     # 项目配置文件
└── README.md               # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- 微信开发者工具（最新稳定版）
- 微信云开发环境
- Node.js 14+

### 安装步骤

1. **克隆项目**
   ```bash
   # GitHub
   git clone https://github.com/feng951/wx-Cloud-Timetable.git
   
   # 或 Gitee
   git clone https://gitee.com/beifengc/wx-cloud-timetable.git
   ```

2. **导入项目**
   - 打开微信开发者工具
   - 选择「导入项目」
   - 选择项目根目录
   - 填写自己的 AppID

3. **配置云开发**
   - 开通微信云开发环境
   - 在 `miniprogram/utils/cloudApi.js` 中修改云开发环境 ID
   - 创建数据库集合：`timetables`, `users`, `shares`

4. **部署云函数**
   - 在微信开发者工具中，右键点击每个云函数文件夹
   - 选择「创建并部署：云端安装依赖」

5. **运行项目**
   - 点击「编译」按钮
   - 开始使用风表小程序

## 📱 页面说明

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | `/pages/index/index` | 展示主课表，查看课程安排 |
| 课表列表 | `/pages/timetableList/timetableList` | 管理多个课表 |
| 课程编辑 | `/pages/courseInput/courseInput` | 添加/编辑课程信息 |
| 课表设置 | `/pages/timetableSettings/timetableSettings` | 设置开学日期、时间段 |
| 个人中心 | `/pages/profile/profile` | 用户信息、关于、协议 |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

## 🙏 致谢

- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) - 提供稳定的后端服务
- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/) - 优秀的小程序开发框架

## 📞 联系我们

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/feng951/wx-Cloud-Timetable/issues)
- Gitee Issues: [提交问题](https://gitee.com/beifengc/wx-cloud-timetable/issues)

---

<p align="center">
  Made with ❤️ by 风表团队
</p>
