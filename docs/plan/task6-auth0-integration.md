# Task 6: Auth0 用户认证集成

> **Goal:** 实现 Web2 + Web3 混合架构的用户认证系统

---

## 问题背景

当前项目使用钱包地址作为用户身份，虽然符合 Web3 标准，但缺少传统 Web2 的用户体系：无法用邮箱注册/登录、无法做用户画像、会员等级等 Web2 功能。

为了高度还原混合架构设计，需要集成 Auth0。

---

## 📌 主线：Auth0 集成

### 阶段一：Auth0 配置

#### 支线1：创建 Auth0 应用
- **现象**：
- **猜测/分析**：
- **方法**：在 Auth0 后台创建 Single Page Application
- **结果**：获取了 Domain、Client ID

#### 支线2：获取 Audience
- **现象**：
- **猜测/分析**：
- **方法**：创建 API 获取 Identifier
- **结果**：获取 Audience = `https://realestate-api`

---

### 阶段二：后端改动

#### 支线3：安装依赖
- **现象**：`express-oauth0-jwt` 不存在
- **猜测/分析**：包名错误
- **方法**：搜索正确的包名
- **结果**：安装 `@auth0/express-jwt` (实际是 `express-jwt`)

#### 支线4：创建用户模型
- **现象**：
- **猜测/分析**：
- **方法**：检查 User.js 是否已存在
- **结果**：User 模型已存在，包含 auth0Id、walletAddress、email 字段

#### 支线5：创建 JWT 中间件
- **现象**：
- **猜测/分析**：
- **方法**：创建 `backend/src/middleware/auth.js`
- **结果**：完成 JWT 验证中间件

#### 支线6：创建用户 API
- **现象**：
- **猜测/分析**：
- **方法**：创建 `backend/src/routes/users.js`
- **结果**：完成用户关联 API

#### 支线7：注册路由
- **现象**：
- **猜测/分析**：
- **方法**：在 index.js 添加 users 路由
- **结果**：完成

---

### 阶段三：前端改动

#### 支线8：安装依赖
- **现象**：
- **猜测/分析**：
- **方法**：安装 `@auth0/auth0-react`
- **结果**：安装成功（有 node 版本警告但不影响）

#### 支线9：配置 Auth0 Provider
- **现象**：
- **猜测/分析**：
- **方法**：在 main.jsx 添加 Auth0Provider
- **结果**：完成

#### 支线10：添加登录/登出按钮
- **现象**：
- **猜测/分析**：
- **方法**：在 Header 组件添加 Auth0 按钮
- **结果**：完成

#### 支线11：创建 axios 拦截器
- **现象**：
- **猜测/分析**：
- **方法**：创建 `frontend/src/config/axios.js`
- **结果**：完成

---

### 阶段四：测试

#### 支线12：Auth0 403 错误
- **现象**：点击 Login 返回 403 Forbidden
- **猜测/分析**：Auth0 未配置允许的域名
- **方法**：需要在 Auth0 后台添加 localhost
- **结果**：待解决

#### 支线13：界面设计问题
- **现象**：同时显示"连接钱包"和"Login"按钮
- **猜测/分析**：混合架构设计不一致
- **方法**：需要确定方案
- **结果**：待定（方案A：保留两者 / 方案B：简化）

---

## 🔗 支线问题（遇到的小问题）

| 支线 | 问题 | 发现方法 | 解决方式 |
|------|------|---------|---------|
| 1 | 包名错误 | npm install 404 | 换成 express-jwt |
| 2 | User 模型已存在 | 检查目录 | 跳过创建 |
| 3 | 403 错误 | 测试时发现 | 需要配置 Auth0 |

---

## ✅ 最终解决方案

### 1. Auth0 配置（待完成）
需要在 Auth0 后台添加：
- Allowed Web Origins: `http://localhost:5173`
- Allowed Callback URLs: `http://localhost:5173`

### 2. 界面设计（待定）
- 方案A：保留 Login + 连接钱包
- 方案B：简化为纯钱包登录

---

## 📁 涉及文件修改

| 文件 | 修改内容 |
|------|---------|
| `backend/package.json` | 添加 express-jwt, jwks-rsa |
| `backend/src/middleware/auth.js` | 新增 JWT 验证中间件 |
| `backend/src/routes/users.js` | 新增用户 API |
| `backend/src/index.js` | 注册 users 路由 |
| `frontend/package.json` | 添加 @auth0/auth0-react |
| `frontend/src/main.jsx` | 配置 Auth0Provider |
| `frontend/src/config/axios.js` | 新增 axios 拦截器 |
| `frontend/src/App.jsx` | 添加登录/登出按钮 |

---

## 这个过程教会我们

1. Auth0 集成分为配置端和代码端
2. 混合架构需要考虑 Web2 登录 + Web3 钱包的流程
3. 前端界面设计需要明确是纯 Web3 还是混合
