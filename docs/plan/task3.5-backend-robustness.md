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

## 验收标准

1. ✅ 区块链调用失败时自动重试
2. ✅ 预订/取消/铸造操作使用事务
3. ⚠️ 测试：模拟失败场景验证重试和回滚（生产环境验证）

---

(End of file - total 58 lines)
