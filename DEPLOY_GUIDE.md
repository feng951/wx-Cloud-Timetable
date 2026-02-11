# 云函数部署指南

## 前置条件

确保已开通微信云开发，并且有足够的权限创建集合和部署云函数。

## 一、用户ID管理功能部署

### 第一步：创建数据库集合

1. **打开云开发控制台**
   - 在微信开发者工具中点击工具栏上的"云开发"按钮
   - 进入"数据库"模块

2. **创建 userIds 集合**
   - 点击"添加集合"按钮
   - 输入集合名称：`userIds`
   - 点击确定

3. **创建 userIdCounter 集合**
   - 点击"添加集合"按钮
   - 输入集合名称：`userIdCounter`
   - 点击确定

4. **（可选）创建索引**
   - 进入 `userIds` 集合
   - 点击"索引"标签
   - 添加索引：字段 `openid`，类型：唯一索引

### 第二步：部署云函数

1. **安装依赖**
   ```bash
   cd cloudfunctions/userIdManager
   npm install
   ```

2. **部署云函数**
   - 在开发者工具左侧文件树中找到 `cloudfunctions/userIdManager`
   - 右键点击 `userIdManager` 文件夹
   - 选择 **"创建并部署：云端安装依赖"**
   - 等待部署完成

3. **验证部署**
   - 打开云开发控制台
   - 进入"云函数"模块
   - 确认 `userIdManager` 函数已显示在列表中

## 二、分享课表功能部署（可选）

### 第一步：创建数据库集合

1. **创建 shareCodes 集合**
   - 在云开发控制台数据库模块中
   - 点击"添加集合"按钮
   - 输入集合名称：`shareCodes`
   - 点击确定

2. **（可选）创建索引**
   - 进入 `shareCodes` 集合
   - 点击"索引"标签
   - 添加以下索引：
     - 字段：`shareCode`，类型：唯一索引
     - 字段：`expireTime`，类型：普通索引

### 第二步：部署云函数

1. **安装依赖**
   ```bash
   cd cloudfunctions/shareTimetable
   npm install
   ```

2. **部署云函数**
   - 在开发者工具中找到 `cloudfunctions/shareTimetable`
   - 右键点击 `shareTimetable` 文件夹
   - 选择 **"创建并部署：云端安装依赖"**
   - 等待部署完成

## 三、测试验证

### 测试用户ID功能

1. **重新编译小程序**
   - 点击开发者工具菜单：工具 → 构建 npm
   - 然后点击：编译

2. **测试用户ID生成**
   - 进入"我的"页面
   - 点击登录按钮
   - 授权后查看用户ID显示（格式：A0001）
   - 退出登录后重新登录，确认ID保持一致

3. **测试ID递增**
   - 使用不同微信账号登录
   - 确认新用户ID自动递增（A0001 → A0002 → ...）

### 测试分享功能（如已部署）

1. **测试分享**
   - 进入"管理课表"页面
   - 点击任意课表的"分享课码"按钮
   - 确认能正常生成10位分享码

2. **测试导入**
   - 点击"导入"按钮
   - 输入刚才生成的分享码
   - 确认能成功导入课表

## 四、常见问题

### 用户ID相关问题

**Q: 提示 "FunctionName parameter could not be found"**
A: `userIdManager` 云函数未部署，请按照上述步骤部署。

**Q: 用户ID显示为 "A0000"**
A: 云函数调用失败，已使用本地备用方案。请检查云函数是否部署成功。

**Q: 不同用户ID重复**
A: 云函数未正确部署，使用了本地哈希算法。请确保 `userIdManager` 云函数已部署。

**Q: 用户ID达到上限 Z9999**
A: 系统会抛出错误提示，需要扩展ID位数规则。

### 分享功能相关问题

**Q: 提示 "collection.get:fail -502005 database collection not"**
A: `shareCodes` 集合不存在，请创建该集合。

**Q: 分享码生成失败**
A: 检查云开发环境的数据库权限设置，确保允许云函数读写数据库。

## 五、数据库集合说明

### userIds 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| openid | String | 用户微信openid，唯一索引 |
| userId | String | 系统分配的用户ID（A0001格式） |
| createTime | Date | 创建时间 |

### userIdCounter 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 固定为 'userIdCounter' |
| currentNum | Number | 当前数字序号（1-9999） |
| currentLetter | String | 当前字母（A-Z） |
| updateTime | Date | 更新时间 |

### shareCodes 集合（如使用分享功能）

| 字段 | 类型 | 说明 |
|------|------|------|
| shareCode | String | 10位分享码，唯一索引 |
| timetableId | String | 课表ID |
| openid | String | 分享者openid |
| timetableData | Object | 课表数据 |
| createTime | Date | 创建时间 |
| expireTime | Date | 过期时间 |

## 六、ID生成规则说明

- **初始ID**: A0001
- **递增规则**: 数字从0001递增到9999，然后字母进位（A→B）
- **格式**: 1位字母 + 4位数字（如 A0001, A9999, B0001）
- **上限**: Z9999（约26万个用户）
- **唯一性**: 通过数据库唯一索引和计数器保证
