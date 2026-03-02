# Task 2.4: 合约 Gas 优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 BitMap 优化 propertyDateBooked 存储，减少 Gas 消耗

**Architecture:** 将 mapping(uint256 => mapping(uint256 => bool)) 改为 mapping(uint256 => mapping(uint256 => uint256))，使用位运算操作

**Tech Stack:** Solidity, Hardhat, OpenZeppelin

---

## Task 1: 修改合约 - 添加 BitMap 数据结构和常量

**Files:**
- Modify: `contracts/contracts/BookingContract.sol:1-60`

**Step 1: 添加常量和 BitMap mapping**

在合约顶部添加：
```solidity
// BitMap 优化常量
uint256 public constant START_DATE = 1735689600; // 2025-01-01 00:00:00 UTC
uint256 public constant DAYS_PER_SLOT = 256;
```

将原有的：
```solidity
mapping(uint256 => mapping(uint256 => bool)) public propertyDateBooked;
```

改为：
```solidity
mapping(uint256 => mapping(uint256 => uint256)) public propertyDateBookedBitmap;
```

**Step 2: 添加辅助函数**

在合约中添加以下辅助函数：
```solidity
// 计算日期对应的 slot 和位位置
function _getSlotAndPos(uint256 date) internal pure returns (uint256 slot, uint256 pos) {
    uint256 daysSinceStart = (date - START_DATE) / 1 days;
    slot = daysSinceStart / DAYS_PER_SLOT;
    pos = daysSinceStart % DAYS_PER_SLOT;
}

// 设置某天为已预订
function _setDateBooked(uint256 propertyId, uint256 date) internal {
    (uint256 slot, uint256 pos) = _getSlotAndPos(date);
    propertyDateBookedBitmap[propertyId][slot] |= (1 << pos);
}

// 清除某天预订
function _clearDateBooked(uint256 propertyId, uint256 date) internal {
    (uint256 slot, uint256 pos) = _getSlotAndPos(date);
    propertyDateBookedBitmap[propertyId][slot] &= ~(1 << pos);
}

// 检查某天是否已预订
function _isDateBooked(uint256 propertyId, uint256 date) internal view returns (bool) {
    (uint256 slot, uint256 pos) = _getSlotAndPos(date);
    return (propertyDateBookedBitmap[propertyId][slot] >> pos) & 1 == 1;
}
```

**Step 3: Commit**

```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: 添加 BitMap 优化数据结构和辅助函数"
```

---

## Task 2: 修改 book() 函数使用 BitMap

**Files:**
- Modify: `contracts/contracts/BookingContract.sol:180-200`

**Step 1: 修改预订逻辑**

将原来：
```solidity
for (uint256 d = startDate; d < endDate; d += 1 days) {
    propertyDateBooked[propertyId][d] = true;
}
```

改为：
```solidity
for (uint256 d = startDate; d < endDate; d += 1 days) {
    _setDateBooked(propertyId, d);
}
```

**Step 2: Commit**

```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: book() 使用 BitMap 设置预订"
```

---

## Task 3: 修改 cancelBooking() 函数使用 BitMap

**Files:**
- Modify: `contracts/contracts/BookingContract.sol:320-330`

**Step 1: 修改取消逻辑**

将原来：
```solidity
releaseBookingDates(booking.propertyId, booking.startDate, booking.endDate);
```

修改 `releaseBookingDates` 函数：
```solidity
function releaseBookingDates(uint256 propertyId, uint256 startDate, uint256 endDate) internal {
    for (uint256 d = startDate; d < endDate; d += 1 days) {
        _clearDateBooked(propertyId, d);
    }
}
```

**Step 2: Commit**

```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: cancelBooking() 使用 BitMap 清除预订"
```

---

## Task 4: 修改 overlapBooking() 函数使用 BitMap

**Files:**
- Modify: `contracts/contracts/BookingContract.sol:290-310`

**Step 1: 修改冲突检查逻辑**

将原来：
```solidity
for (uint256 d = startDate; d < endDate; d += 1 days) {
    if (propertyDateBooked[propertyId][d]) {
        return true;
    }
}
return false;
```

改为：
```solidity
for (uint256 d = startDate; d < endDate; d += 1 days) {
    if (_isDateBooked(propertyId, d)) {
        return true;
    }
}
return false;
```

**Step 2: Commit**

```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: overlapBooking() 使用 BitMap 检查冲突"
```

---

## Task 5: 编译并测试

**Step 1: 编译合约**

```bash
cd contracts
npx hardhat compile
```

预期：编译成功，无错误

**Step 2: 部署到本地测试网**

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Step 3: 测试预订流程**

```bash
npx hardhat run scripts/testBooking.js --network localhost
```

预期：预订成功

**Step 4: 测试冲突检测**

尝试预订冲突日期：
```bash
npx hardhat run scripts/testOverlap.js --network localhost
```

预期：返回 true（冲突）

**Step 5: 测试取消预订**

```bash
npx hardhat run scripts/testCancel.js --network localhost
```

预期：取消成功，日期释放

**Step 6: Commit**

```bash
git add contracts/
git commit -m "test: 添加 Gas 优化测试脚本"
```

---

## Task 6: 更新前端配置

**Step 1: 复制新 ABI**

```bash
cp contracts/artifacts/contracts/BookingContract.sol/BookingContract.json frontend/src/config/abi.json
```

**Step 2: 更新部署地址**

将新合约地址更新到：
- `frontend/src/config/contracts.js`
- `backend/.env`
- `contracts/deployment.json`

**Step 3: Commit**

```bash
git add frontend/src/config/ backend/.env contracts/deployment.json
git commit -m "chore: 更新新合约配置"
```

---

## 总结

| Task | 内容 |
|------|------|
| 1 | 添加 BitMap 数据结构和辅助函数 |
| 2 | 修改 book() 使用 BitMap |
| 3 | 修改 cancelBooking() 使用 BitMap |
| 4 | 修改 overlapBooking() 使用 BitMap |
| 5 | 编译测试 |
| 6 | 更新前端配置 |

**Plan complete and saved to `docs/plans/2026-03-02-gas-optimization-plan.md`.**

---

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
