# Task X: Auth0 用户认证集成

> **Goal:** 实现 Web2 + Web3 混合架构的用户认证系统

---

## 一、问题背景

当前项目使用钱包地址作为用户身份，虽然符合 Web3 标准，但缺少传统 Web2 的用户体系：
- 无法用邮箱注册/登录
- 无法做用户画像、会员等级等 Web2 功能

为了高度还原混合架构设计，需要集成 Auth0。

---

## 二、解决方案

### 架构设计

```
用户登录 (Auth0) → 获取 JWT Token
        ↓
用户连接钱包 (RainbowKit) → 获取钱包地址
        ↓
后端关联: Auth0用户ID ↔ 钱包地址
        ↓
后续操作: JWT认证 + 钱包地址校验
```

### 技术方案

| 组件 | 技术 | 作用 |
|------|------|------|
| 身份验证 | Auth0 | 邮箱注册/登录，获取 JWT |
| 钱包连接 | RainbowKit (已有) | 连接 MetaMask，获取钱包地址 |
| 用户模型 | MongoDB | 关联 Auth0 ID ↔ 钱包地址 |
| API 认证 | JWT | 验证请求合法性 |

---

## 三、实施任务

### 阶段一：Auth0 配置

- [ ] 1.1 创建 Auth0 账号
- [ ] 1.2 创建 Single Page Application
- [ ] 1.3 配置 Callback URLs 和 Logout URLs
- [ ] 1.4 获取 Domain、Client ID、Audience

### 阶段二：后端改动

- [ ] 2.1 安装依赖
  ```bash
  npm install express-oauth0-jwt jwks-rsa
  ```

- [ ] 2.2 创建用户模型 `backend/src/models/User.js`
  ```javascript
  {
    auth0Id: String,      // Auth0 用户 ID
    email: String,         // 用户邮箱
    walletAddress: String,// 关联的钱包地址
    createdAt: Date
  }
  ```

- [ ] 2.3 创建 JWT 验证中间件 `backend/src/middleware/auth.js`
  - 验证 JWT token 有效性
  - 提取 Auth0 用户信息

- [ ] 2.4 创建用户关联 API `backend/src/routes/users.js`
  - `POST /api/users/link-wallet` - 关联钱包地址
  - `GET /api/users/me` - 获取当前用户信息

- [ ] 2.5 修改受保护路由，添加 JWT 验证

### 阶段三：前端改动

- [ ] 3.1 安装依赖
  ```bash
  npm install @auth0/auth0-react
  ```

- [ ] 3.2 配置 Auth0 Provider `frontend/src/main.jsx`

- [ ] 3.3 添加登录/登出按钮 `frontend/src/components/Header.jsx`

- [ ] 3.4 钱包连接时自动关联用户
  - 连接钱包后调用后端 API 关联钱包地址

- [ ] 3.5 API 请求携带 JWT token
  - 使用 Axios 拦截器添加 Authorization header

---

## 四、数据流

### 用户首次登录流程

```
1. 用户点击"登录" (Auth0)
   ↓
2. 跳转 Auth0 登录页面，输入邮箱/密码
   ↓
3. 登录成功，返回 JWT token，页面跳转回前端
   ↓
4. 前端存储 JWT token
   ↓
5. 用户点击"连接钱包" (RainbowKit)
   ↓
6. 用户授权 MetaMask，获取钱包地址
   ↓
7. 前端调用 POST /api/users/link-wallet
   - Header: Authorization: Bearer <JWT>
   - Body: { walletAddress: "0x..." }
   ↓
8. 后端验证 JWT → 获取 Auth0 ID → 关联钱包地址到 MongoDB
   ↓
9. 返回成功，用户可以开始预订
```

### 后续登录流程

```
1. 用户点击"登录" (Auth0) → 获取 JWT
2. 点击"连接钱包" → 获取钱包地址
3. 前端自动调用 /api/users/me 获取用户信息（包含已关联的钱包）
4. 如果钱包已关联，直接显示用户信息
```

---

## 五、涉及文件

### 新增文件

| 文件 | 说明 |
|------|------|
| `backend/src/models/User.js` | 用户模型 |
| `backend/src/middleware/auth.js` | JWT 验证中间件 |
| `backend/src/routes/users.js` | 用户 API |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `backend/package.json` | 添加依赖 |
| `backend/src/index.js` | 注册新路由、中间件 |
| `frontend/src/main.jsx` | 配置 Auth0 Provider |
| `frontend/src/App.jsx` 或 Header | 添加登录/登出按钮 |

---

## 六、环境变量

### Backend (.env)

```bash
AUTH0_DOMAIN=xxx.auth0.com
AUTH0_CLIENT_ID=xxx
AUTH0_AUDIENCE=https://realestate-api
```

### Frontend (.env)

```bash
VITE_AUTH0_DOMAIN=xxx.auth0.com
VITE_AUTH0_CLIENT_ID=xxx
VITE_AUTH0_AUDIENCE=https://realestate-api
```

---

## 七、注意事项

1. **钱包未关联时的处理**
   - 用户已登录但未连接钱包：显示"请连接钱包"
   - 用户已连接钱包但未关联：自动关联

2. **安全性**
   - JWT token 存储在前端内存中（不要存 localStorage）
   - 敏感操作需要同时验证 JWT 和钱包地址

3. **测试**
   - 本地测试需要配置 Auth0 的 localhost 地址
   - 可以创建测试用户

---

## 八、面试亮点

在面试时可以提到：
- "实现了 Web2 + Web3 混合认证架构"
- "结合了 Auth0 的企业级安全和钱包的 Web3 身份"
- "用户可选择用邮箱登录或直接用钱包"
