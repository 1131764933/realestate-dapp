# Task 4.6: 前端 UX 优化

> **Goal:** 提升用户体验，包括日期选择、NFT 链接、交易状态反馈
> **Status:** ✅ Completed

---

## 优化内容

### 1. 日历控件禁用已预订日期 ✅

**问题**：用户可以选择已被预订的日期

**方案**：获取该房源的已预订日期，在日历中禁用

**实现**：
- 新增 `fetchBookedDates` 函数获取当前用户在该房源的预订
- 在 `DatePickerInput` 使用 `disabledDates` prop 禁用已预订日期
- 显示提示信息 "⚠️ X dates already booked"

**涉及文件**：`frontend/src/pages/PropertyDetail.jsx`

---

### 2. NFT 展示 eth 测试网链接 ✅

**问题**：NFT 铸造后无法查看

**方案**：添加 Etherscan Sepolia 测试网链接

**实现**：
- 添加 `ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io'`
- 交易哈希改为链接：`View Transaction on Etherscan`
- NFT 添加链接：`View NFT on Etherscan`

**涉及文件**：`frontend/src/pages/MyBookings.jsx`

---

### 3. 交易状态反馈优化 ✅

**问题**：交易状态不够清晰

**方案**：添加 pending 状态提示

**实现**：
- pending 时显示蓝色 Alert："⏳ Transaction pending. Please confirm in MetaMask..."
- success 时显示绿色 Alert
- failed 时显示红色 Alert

**涉及文件**：`frontend/src/pages/PropertyDetail.jsx`

---

## 验收标准

1. ✅ 日历控件显示已预订日期为禁用状态
2. ✅ NFT 卡片显示 Etherscan 链接
3. ✅ 交易显示明确的 pending/success/failed 状态

---

(End of file - total 47 lines)
