# Task 3.5: 后端健壮性增强

> **Goal:** 提高后端稳定性和可靠性，添加重试机制和事务支持
> **Status:** ✅ Completed

---

## 问题背景

当前后端直接调用区块链和数据库，如果遇到：
- 网络波动导致区块链调用失败
- 区块链拥堵导致交易pending后失败
- 链上成功但数据库记录失败

会导致数据不一致或用户体验差。

---

## 解决方案

### 1. 自动重试机制（指数退避）✅

**问题**：瞬时网络错误、区块链拥堵

**方法**：调用失败时，指数退避重试 3 次
- 第 1 次：失败后等 1s 重试
- 第 2 次：失败后等 2s 重试  
- 第 3 次：失败后等 4s 重试
- 第 3 次还失败：抛出异常

**新增文件**：`backend/src/utils/retry.js`
```javascript
// 核心函数
callWithBlockchainRetry(fn, maxRetries = 3)
// 自动判断错误类型，决定是否重试
// 不重试：gas不足、权限问题、参数错误等明确性错误
// 重试：网络错误、超时、区块链拥堵等临时性错误
```

### 2. MongoDB 事务支持 ✅

**问题**：链上交易和数据库操作不同步

**方法**：使用 MongoDB 事务
- 开启事务
- 执行链上交易 + 数据库操作
- 成功 → 提交事务
- 失败 → 自动回滚事务

**新增文件**：`backend/src/utils/transaction.js`
```javascript
// 核心函数
optionalTransaction(operations, fallback)
// 自动检测是否支持事务
// 支持：使用事务确保一致性
// 不支持（单节点MongoDB）：使用原有逻辑
```

---

## 涉及文件

| 文件 | 修改内容 |
|------|---------|
| `backend/src/utils/retry.js` | 新增：重试机制工具函数 |
| `backend/src/utils/transaction.js` | 新增：事务支持工具函数 |
| `backend/src/services/blockchainService.js` | 修改：book/cancel/complete/mintNFT 添加重试 |
| `backend/src/routes/bookings.js` | 修改：mint-nft/complete 添加事务支持 |

---

## 测试方法

### 1. 检查 MongoDB 状态

MongoDB 事务需要副本集才能工作。

```bash
# 检查 MongoDB 是否运行
pgrep -a mongo

# 或通过 mongoose 连接信息判断
# 代码会自动检测，不支持时会降级为原有逻辑
```

### 2. 重试机制测试

**方法**：临时修改代码模拟失败，观察日志

```javascript
// 临时修改 backend/src/services/blockchainService.js
// 在 book 函数中临时添加：
async book(...) {
    throw new Error("模拟网络错误");
}
```

**预期日志**：
```
Retry 1/3 after 1000ms - Error: 模拟网络错误
Retry 2/3 after 2000ms - Error: 模拟网络错误
Retry 3/3 after 4000ms - Error: 模拟网络错误
Transaction failed: 模拟网络错误
```

### 3. 事务回滚测试

**条件**：需要 MongoDB 副本集

**方法**：故意让数据库操作失败，观察是否回滚

```javascript
// 在 bookings.js 的 mint-nft 中临时添加错误
async (session) => {
    await blockchainService.mintNFT(...);  // 链上成功
    throw new Error("模拟数据库错误");      // 数据库失败
    // 预期：链上交易不会回滚（区块链特性），但会抛出错误
}
```

### 4. 正常功能测试

不需要修改代码，直接测试功能是否正常：

```bash
# 1. 启动后端
cd backend && npm run dev

# 2. 启动前端，测试完整流程：
# - 连接钱包
# - 预订房源
# - 取消预订
# - Mint NFT

# 3. 观察后端日志，确认没有报错
```

### 5. 快速验证

```bash
# 检查语法
cd backend && node --check src/utils/retry.js
cd backend && node --check src/utils/transaction.js
cd backend && node --check src/services/blockchainService.js

# 检查模块加载
cd backend && node -e "require('./src/utils/retry'); require('./src/utils/transaction'); console.log('OK')"
```

---

## 注意事项

1. **重试机制**：默认启用，在网络不稳定时会自动重试
2. **事务支持**：单节点 MongoDB 会自动降级，不影响功能
3. **生产环境**：建议使用 MongoDB 副本集以支持事务

---

(End of file - total 58 lines)
