# 面试演示和话术准备

> 用于 Web3 房地产 DApp 面试演示

---

## 一、演示流程（约 5-8 分钟）

### 演示前准备
1. 打开前端页面：http://localhost:5173
2. 打开后端日志（可选）
3. 确保 MetaMask 已安装并连接到 Sepolia 测试网

---

### Step 1: 项目介绍（1 分钟）

**话术**：
> "这是一个房地产预订 DApp，实现了 Web2 + Web3 混合架构。
> - 前端：React + Mantine UI
> - 后端：Node.js + Express + MongoDB
> - 智能合约：Solidity + Hardhat
> - 特色：Auth0 登录 + 钱包连接 + NFT 铸造"

---

### Step 2: 展示房源列表（30 秒）

**操作**：刷新页面，展示房源卡片

**话术**：
> "用户可以浏览房源列表，每个房源显示名称、位置、价格和图片。"

---

### Step 3: 连接钱包（30 秒）

**操作**：点击 "Connect Wallet"，连接 MetaMask

**话术**：
> "Web3 应用需要连接钱包。这里用 wagmi + MetaMask 实现。"

---

### Step 4: 预订房源（1-2 分钟）

**操作**：
1. 点击房源进入详情页
2. 选择日期（展示日历禁用已预订日期）
3. 点击 "Book Now"
4. 在 MetaMask 确认交易

**话术**：
> "选择日期后点击预订，MetaMask 会弹出交易确认。
> 智能合约会校验：
> - 日期有效性（不能选过去）
> - 房源存在且激活
> - 没有日期重叠
> - 金额匹配"

---

### Step 5: 展示预订记录（1 分钟）

**操作**：跳转到 My Bookings 页面

**话术**：
> "预订成功后，Indexer 会监听链上事件，同步到 MongoDB。
> 用户可以在 My Bookings 查看所有预订。"

---

### Step 6: 铸造 NFT（1 分钟）

**操作**：
1. 找到预订的卡片
2. 点击 "Mint NFT"
3. 确认交易

**话术**：
> "预订确认后可以铸造 NFT。NFT 包含预订信息，可以作为预订凭证。"

---

### Step 7: 展示 Etherscan（30 秒）

**操作**：点击 "View NFT on Etherscan"

**话术**：
> "NFT 可以直接在 Etherscan 上查看。"

---

### Step 8: 取消预订（1 分钟）

**操作**：
1. 找到预订卡片
2. 点击 "Cancel"
3. 确认交易

**话术**：
> "用户可以取消预订，智能合约会释放日期，其他人可以预订。"

---

## 二、面试话术汇总

### 1. 项目架构

> "这是一个前后端分离的 Web3 应用：
> - 前端负责 UI 和钱包连接
> - 后端负责业务逻辑和区块链交互
> - Indexer 监听链上事件，同步数据到 MongoDB"

### 2. 智能合约亮点

> "合约实现了完整的权限模型：
> - Owner 可管理房源（添加/下架/调价）
> - 普通用户只能操作自己的预订
> - 使用 ReentrancyGuard 防止重入攻击
> - 使用 BitMap 优化日期存储 Gas"

### 3. 链上链下数据同步

> "链上只存核心数据（预订、支付、NFT），链下存详情。
> Indexer 监听 BookingCreated/BookingCancelled 事件，
> 同步到 MongoDB，支持断点续传。"

### 4. Web2 + Web3 混合认证

> "支持两种登录方式：
> - Auth0：传统邮箱登录
> - 钱包连接：Web3 身份
> 用户可以只用钱包，也可以两者都用"

### 5. 遇到的问题和解决

| 问题 | 解决方案 |
|------|---------|
| 预订 ID 重复 | 从链上获取 booking count |
| 日期重叠 | 用 BitMap 优化查询 |
| 网络不稳定 | 添加指数退避重试机制 |
| MongoDB 单节点 | 事务降级为普通操作 |

---

## 三、可能被问到的问题

### Q: 为什么不用 OpenSea API？

> "当前 MVP 先聚焦核心预订功能。OpenSea API 可以后续集成。"

### Q: 如何防止重复预订？

> "合约的 overlapBooking 函数遍历 BitMap 检查日期是否已被预订。"

### Q: 如果节点断了怎么办？

> "Indexer 有断点续传功能，从 lastProcessedBlock 继续监听。"

### Q: Gas 怎么优化？

> "日期存储用 BitMap（1 bit/天），避免大数组遍历。
> 链下存详情，链上只存核心数据。"

### Q: 为什么不把房源存在链上？

> "房源图片、描述等信息存链上 Gas 太高。
> 链上存 propertyId 即可，详情存 MongoDB。"

---

## 四、技术栈清单

| 层 | 技术 |
|---|------|
| 前端 | React, Vite, Mantine, wagmi, ethers.js |
| 后端 | Node.js, Express, MongoDB, mongoose |
| 合约 | Solidity, Hardhat, OpenZeppelin |
| 认证 | Auth0 |
| 钱包 | MetaMask, wagmi |

---

## 五、项目亮点总结

1. **完整的状态机**：Pending → Confirmed → Completed/Cancelled
2. **权限控制**：Owner vs 普通用户
3. **事件驱动**：Indexer 同步链上链下
4. **重试机制**：指数退避处理网络波动
5. **UX 优化**：禁用已预订日期、Etherscan 链接

---

(End of file - total 145 lines)
