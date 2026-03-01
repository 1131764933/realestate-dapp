# Task 3: 修复 Booking/Cancel 功能问题

## 问题背景

用户在测试预订和取消功能时遇到 `Not booking owner` 错误，导致 Cancel 操作一直失败。

---

## 📌 主线：Cancel 功能失败问题

### 阶段一：初次排查（支线1-4）

#### 支线1：MongoDB 数据不一致
- **现象**：报错 `Not booking owner`
- **猜测**：MongoDB 数据与链上不同步
- **方法**：修改 sync API，增加清理链上不存在的 bookings 功能
- **结果**：暂时有效，新建 booking 后又失败

#### 支线2：Indexer 问题
- **猜测**：EventListener 没有正确同步
- **方法**：检查 eventListener.js 代码
- **结果**：不是 Indexer 的问题

#### 支线3：MetaMask 网络问题
- **猜测**：用户切换了钱包账户
- **方法**：添加网络检查，显示当前连接的钱包
- **结果**：网络正确，不是这个问题

#### 支线4：合约地址配置
- **问题**：前后端合约地址不一致
- **方法**：grep 搜索所有合约地址配置
- **结果**：更新了多处地址配置

---

### 阶段二：突破点 - Hardhat 控制台测试（主线）

#### 关键发现
用 Hardhat 控制台直接调用合约：
```javascript
await contract.cancelBooking(bookingId)
```
**结果：成功！**

#### 分析
- 合约逻辑正确 ✅
- 问题在前端调用过程 ✅

---

### 阶段三：找到第一个 Bug（支线5-6）

#### 支线5：Fallback Success 逻辑错误
- **发现方法**：仔细阅读前端 App.jsx 代码
- **问题**：
  ```javascript
  // 错误代码
  if (!isPending && hash && !isConfirming && !writeError) {
    saveToDatabase(); // 这是错的！
  }
  ```
- **原因**：`isPending = false` 不等于交易成功
- **解决**：改用 `isSuccess` 判断

#### 支线6：wagmi API 版本变化
- **发现方法**：build 失败查看错误信息
- **问题**：`useNetwork` 导出失败
- **原因**：新版 wagmi 使用 `useChainId`
- **解决**：
  ```bash
  cat node_modules/wagmi/dist/esm/exports/index.js | grep use
  ```

---

### 阶段四：Booking ID 错乱（支线7-8）

#### 支线7：MongoDB vs 链上 ID 不一致
- **发现方法**：
  1. 链上查询：`npx hardhat run scripts/checkChain.js`
  2. MongoDB 查询：`curl http://localhost:3000/api/bookings/user/...`
  3. 对比发现不一致
- **问题**：MongoDB 显示 bookingId=20，链上只有2个
- **原因**：后端用了 MongoDB 最大 ID 而不是链上 count

#### 支线8：后端 ID 计算逻辑
- **发现方法**：阅读后端 bookings.js 代码
- **问题代码**：
  ```javascript
  const chainCount = await getBookingCount(); // 2
  const maxBookingInDb = await Booking.findOne().sort({ bookingId: -1 }); // 19
  const newBookingId = Math.max(2, 19) + 1; // 20 ❌
  ```
- **解决**：
  ```javascript
  const chainCount = await getBookingCount();
  const newBookingId = Number(chainCount) + 1;
  ```

---

### 阶段五：架构问题顿悟（主线）

**核心顿悟**：我们把 MongoDB 当成了"真相源"

```
Blockchain = 真相 (Source of Truth)
MongoDB = 镜像/缓存 (Cache/Index)
```

#### 方法：推倒重来
1. 停止 Hardhat
2. 清空 MongoDB（注意：最初用错数据库名 - 支线9）
3. 重新部署合约
4. 修改代码

---

### 阶段六：UI 状态卡住（支线10-12）

#### 支线9：MongoDB 数据库名错误
- **问题**：`use booking` 实际是 `use realestate`
- **发现方法**：API 返回数据发现还有残留
- **解决**：确认正确的数据库名

#### 支线10：UI 一直转圈
- **现象**：用户点击取消后按钮一直 loading
- **发现方法**：看日志 `Cancel tx status` 一直 pending
- **原因**：`cancellingId` 状态没有正确重置

#### 支线11：useEffect 依赖问题
- **问题**：fetchBookings 没有在状态更新后执行
- **发现方法**：添加 console.log 发现 useEffect 没触发
- **解决**：添加 `refreshKey` 到依赖数组

#### 支线12：缓存问题
- **问题**：API 返回缓存的旧数据
- **发现方法**：取消成功后数据没变
- **解决**：URL 添加时间戳
  ```javascript
  const url = `...?_t=${Date.now()}`;
  ```

---

### 阶段七：日期验证（支线13）

#### 支线13：日期验证缺失
- **现象**：`Start date must be after current block time`
- **发现方法**：用户反馈报错
- **原因**：选择2026年日期，但可能太接近当前时间
- **解决**：前端添加日期验证，提示选择更远的日期
  ```javascript
  const now = Math.floor(Date.now() / 1000);
  if (startDate <= now + 3600) {
    setTxError('Check-in date must be at least 1 hour in the future');
    return;
  }
  ```

---

### 阶段八：合约相关（支线14-17）

#### 支线14：合约日期验证
- **现象**：选择2027年日期仍然失败
- **分析**：Hardhat 节点时间问题
- **解决**：使用更远的未来日期

#### 支线15：链上 booking 查询失败
- **错误**：`could not decode result data (value="0x")`
- **原因**：booking 不存在或索引超出
- **发现方法**：`npx hardhat run scripts/queryBookings.js`
- **解决**：检查 bookingCount，只查询存在的

#### 支线16：取消 revert - 状态不对
- **错误**：`Cannot cancel this booking`
- **原因**：booking 已经是 Cancelled 状态
- **发现方法**：链上查询 `status: 2`
- **解决**：UI 只显示 PENDING/CONFIRMED 的取消按钮

#### 支线17：ABI 不匹配
- **错误**：`could not decode result data`
- **原因**：ABI 文件过时
- **解决**：确保使用最新 ABI

---

### 阶段九：前端体验优化（支线18-20）

#### 支线18：端口占用
- **错误**：`EADDRINUSE: address already in use :::3000`
- **解决**：
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

#### 支线19：build SES 错误
- **错误**：`Removing unpermitted intrinsics`
- **原因**：导入不存在的模块
- **解决**：清理未使用的导入

#### 支线20：Cancel 按钮重复显示
- **现象**：用户看到 PENDING 但实际已 CANCELLED
- **原因**：UI 没正确刷新
- **解决**：添加 refreshKey + 延迟刷新

---

## 🔍 问题排查方法总结

### 1. 排除法
先证明哪个部分没问题，逐步缩小范围

- 用 Hardhat 控制台直接调用合约 → 证明合约没问题
- 用 curl 测试 API → 证明后端没问题
- 对比链上数据和 MongoDB → 发现不一致

### 2. 对比法
对比不同来源的数据

- 链上 booking 数量 vs MongoDB 数量
- 前端 wallet vs 链上 owner
- 前端 bookingId vs 链上 ID

### 3. 日志法
仔细阅读控制台输出

- `console.log` 输出状态
- 后端日志
- MetaMask 错误信息

### 4. 工具法
使用各种工具验证

- Hardhat 控制台
- curl 测试 API
- 浏览器开发者工具

### 5. 推倒重来法
当问题复杂时

- 清空 MongoDB
- 重启 Hardhat
- 重新部署
- 从零测试

---

## ✅ 最终解决方案

### 1. 交易状态判断
```javascript
// 错误
if (!isPending && hash) { save(); }

// 正确
if (isSuccess && hash) { save(); }
```

### 2. Booking ID 计算
```javascript
const newBookingId = Number(chainCount) + 1;
```

### 3. 数据读取
```javascript
// API 直接从链上遍历读取
for (let i = 1; i <= 100; i++) {
  const booking = await contract.getBooking(i);
}
```

### 4. UI 刷新
```javascript
const [refreshKey, setRefreshKey] = React.useState(0);
useEffect(() => { fetchBookings(); }, [refreshKey]);
setRefreshKey(k => k + 1);
```

---

## 📊 经验教训

| 问题 | 方法 | 教训 |
|------|------|------|
| Cancel 失败 | Hardhat 控制台测试 | 排除法定位问题 |
| Fallback Success | 阅读代码 | Web2 思维不适用 Web3 |
| ID 错乱 | 对比链上/DB | MongoDB 不是真相源 |
| UI 卡住 | 看日志 + 推论 | 注意状态时序 |
| 日期失败 | 用户反馈 | 前端要友好提示 |

---

## 📁 涉及文件

| 文件 | 修改内容 |
|------|---------|
| `backend/src/routes/bookings.js` | ID 计算、合约地址 |
| `backend/src/routes/properties.js` | 合约地址 |
| `backend/src/services/index.js` | 合约地址 |
| `frontend/src/App.jsx` | 交易状态、刷新、验证 |
| `frontend/src/config/contracts.js` | 合约地址 |
| `contracts/deployment.json` | 部署记录 |

---

## 🛠 调试脚本

```bash
# 查询链上 bookings
npx hardhat run scripts/checkChain.js --network localhost

# 查询单个交易
npx hardhat run scripts/checkTx.js --network localhost

# 直接测试 cancel
npx hardhat run scripts/testCancelDirect.js --network localhost
```
