# 房地产预订系统 - 技术架构文档

## 一、系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Mantine  │  │ React    │  │ Auth0   │  │ ethers.js      │ │
│  │ UI组件   │  │ Router   │  │ SDK     │  │ (钱包连接)      │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / Web3
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend (Node.js + Express)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Auth0   │  │ 业务逻辑  │  │ ethers.js│  │ Mongoose      │ │
│  │ JWT验证 │  │ 验证     │  │ 区块链交互│  │ (MongoDB)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ Events / Contract Calls
┌────────────────────────────▼────────────────────────────────────┐
│                    Blockchain (Smart Contracts)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Property │  │ Booking  │  │ Token    │                      │
│  │ 房源合约 │  │ 预订合约 │  │ 积分代币 │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、技术栈

### 前端 (Web2 + Web3)

| 技术 | 作用 |
|------|------|
| React + Vite | UI 框架，提供快速的开发体验 |
| Mantine | UI 组件库，构建一致美观的界面 |
| React Router | 路由管理，实现单页应用导航 |
| Axios | HTTP 客户端，调用后端 REST API |
| Auth0 SDK | 身份验证，用户登录和授权 |
| ethers.js / web3.js | 区块链交互，连接钱包和调用合约 |

### 后端

| 技术 | 作用 |
|------|------|
| Node.js + Express | 服务端框架，构建 RESTful API |
| Auth0 JWT | 保护路由，验证用户身份 |
| ethers.js | 区块链交互层，调用智能合约 |
| MongoDB | 链下数据库，存储房源、用户等数据 |
| Prisma / Mongoose | ORM 工具，数据库操作 |

### 智能合约

| 技术 | 作用 |
|------|------|
| Solidity | 智能合约编程语言 |
| Hardhat / Foundry | 合约开发、测试、部署工具 |
| OpenZeppelin | 合约安全库 |

---

## 三、核心模块说明

### 1. 前端层

**Web3 交互流程：**
```
用户点击"预订" → 前端调用后端 API → 后端验证业务逻辑 
→ 前端调用 ethers.js 发起交易 → MetaMask 签名确认 
→ 交易上链 → 合约 emit 事件 → 后端监听事件同步数据
```

### 2. 后端层

| 模块 | 功能 |
|------|------|
| Auth0 JWT 验证 | 保护敏感路由，确保只有已认证用户才能访问 |
| 业务逻辑验证 | 区块链调用之前进行数据校验，避免无效交易 |
| 区块链交互层 | 使用 ethers.js 封装与智能合约的交互 |
| 数据持久化 | MongoDB 存储链下数据（房源信息、用户资料） |
| 事件监听 | 监听链上事件，同步更新数据库 |

### 3. 智能合约层

| 合约 | 功能 |
|------|------|
| Property NFT | 房源 NFT 化，记录产权信息 |
| Booking | 预订记录，不可篡改，可审计 |
| Token | 积分/忠诚度代币系统 |

---

## 四、数据流设计

### 1. 用户浏览房源
```
MongoDB → 后端 API → 前端展示
```

### 2. 用户预订房源
```
前端 → 后端验证 → ethers.js 调用合约 → 交易上链 
→ 合约 emit Booked 事件 → 后端监听 → 更新 MongoDB
```

### 3. 用户连接钱包
```
前端 → MetaMask → 获取地址 → 与 Auth0 ID 关联
```

---

## 五、架构设计亮点

1. **混合架构**：将 Web2 的易用性与 Web3 的信任机制相结合
2. **分层清晰**：前端、后端、智能合约层职责明确
3. **安全可靠**：Auth0 身份验证 + 业务逻辑校验
4. **事件驱动**：通过监听链上事件保持链下数据一致性

---

## 六、面试话术 - 系统架构介绍

> This is a Web2 + Web3 hybrid architecture. The frontend uses React with Vite, Mantine for UI components, and integrates with MetaMask through ethers.js for wallet connection. The backend is built with Node.js and Express, using MongoDB for data persistence and Auth0 for user authentication. Before any blockchain operation, the backend validates the business logic first to prevent invalid on-chain transactions. The smart contracts are written in Solidity and handle property ownership, booking records, and loyalty tokens. The system uses an event-driven design - the backend listens to contract events to keep the off-chain database in sync.

---

## 七、你需要掌握的知识点

| 知识点 | 了解程度 | 状态 |
|--------|---------|------|
| React + Vite | 基础概念 | ✅ 有经验 |
| Express 路由 | 熟练 | ✅ 可快速上手 |
| MongoDB + Mongoose | 熟练 | ✅ 有经验 |
| ethers.js | 熟练 | ✅ viem.js 类似 |
| Auth0 | 了解概念 | ⏳ 需补充 |
| Prisma | 了解概念 | ⏳ 需补充 |
| Solidity | 精通 | ✅ 优势 |

---

## 八、你的项目经验迁移

| 你的项目 | 可迁移到 |
|---------|---------|
| MDLedger (行为记录 + NFT) | Property NFT (房源 NFT) |
| RNT 质押挖矿 | Token 积分系统 |
| NFT Marketplace | Booking 预订流程 |
| 区块链实训平台 | 后端开发经验 |

---

*文档创建时间：2026年3月1日*
