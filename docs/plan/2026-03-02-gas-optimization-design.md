# Task 2.4: 合约 Gas 优化 - BitMap 方案设计

> **日期**: 2026-03-02
> **目标**: 优化 BookingContract 的 storage 成本和 Gas 消耗

---

## 1. 优化背景

当前 `propertyDateBooked` 使用嵌套 mapping：
```solidity
mapping(uint256 => mapping(uint256 => bool)) public propertyDateBooked;
```

**问题**：
- 每天占用 1 个 storage slot
- 预订冲突检查需要 O(n) 循环
- 大日期范围预订 Gas 成本高

---

## 2. BitMap 优化方案

### 2.1 存储结构

```solidity
// 优化后：每个 uint256 存储 256 天的预订状态
mapping(uint256 => mapping(uint256 => uint256)) public propertyDateBookedBitmap;
```

### 2.2 位运算公式

```solidity
// 计算 slot 索引和位位置
uint256 dayIndex = (date - START_DATE) / 256;  // 第几个 uint256
uint256 bitPos   = (date - START_DATE) % 256;  // 在 slot 中的位置

// 设置某天已预订
propertyDateBookedBitmap[propertyId][dayIndex] |= (1 << bitPos);

// 检查某天是否已预订
bool isBooked = (propertyDateBookedBitmap[propertyId][dayIndex] >> bitPos) & 1 == 1;

// 清除某天预订
propertyDateBookedBitmap[propertyId][dayIndex] &= ~(1 << bitPos);
```

### 2.3 常量定义

```solidity
// 项目上线日期（简化计算）
uint256 public constant START_DATE = 1735689600; // 2025-01-01 00:00:00 UTC
```

---

## 3. 需修改的函数

| 函数 | 修改内容 |
|------|---------|
| `book()` | 设置预订时改用 BitMap |
| `cancelBooking()` | 清除预订时改用 BitMap |
| `overlapBooking()` | 检查冲突改用 BitMap |

---

## 4. 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| Storage 占用 | 1 slot/天 | 1 slot/256天 |
| 冲突检查 | O(n) 循环 | O(1) 位运算 |
| Gas 成本 | 较高 | 降低 30-50% |

---

## 5. 实现注意事项

1. **START_DATE 常量**：使用固定日期避免每次计算
2. **精度保持**：仍按"天"精度，适合房产预订场景
3. **兼容性**：取消预订逻辑完全兼容

---

## 6. 其他可选优化

- 批量 NFT 铸造函数
- 多余 ETH 退还机制
- 事件参数增强（便于 Indexer 断点恢复）

---

## 7. 测试计划

1. 部署新合约
2. 添加测试房源
3. 测试预订流程
4. 测试取消预订
5. 测试冲突检测
6. 对比 Gas 消耗
