# Task 4: NFT 铸造及展示功能

## 问题背景

完善 NFT 铸造功能和前端展示，包括 tokenURI 元数据、NFTCard 展示、取消预订时 NFT 处理。

---

## 📌 主线：NFT 功能完善

### 阶段一：测试现有功能，列出问题

#### 支线1：tokenURI 是占位符
- **现象**：`tokenURI` 返回 `ipfs://QmXYZ/metadata_1.json`
- **发现方法**：Hardhat 脚本测试 mintNFT
- **原因**：代码中是硬编码的占位符
- **需要**：完善元数据，包含真实预订信息

#### 支线2：前端展示缺失
- **现象**：MyBookings 页面有 "Mint NFT" 按钮，但没有 NFT 展示
- **发现方法**：查看前端代码
- **需要**：增加 NFTCard 和 OpenSea 链接

#### 支线3：取消预订时 NFT 处理
- **现象**：没有明确业务逻辑
- **分析**：用户取消预订后 NFT 如何处理需要定义
- **决定**：保留 NFT，更新状态为 Cancelled

#### 支线4：铸造状态限制
- **现象**：前端只允许 SUCCESS 状态铸造
- **发现方法**：阅读 MyBookings.jsx 代码
- **实际**：合约中 PENDING 状态就可以铸造

---

### 阶段二：修复 tokenURI

#### 问题
硬编码占位符：
```solidity
return string(abi.encodePacked("ipfs://QmXYZ/metadata_", tokenId, ".json"));
```

#### 解决
返回完整 JSON 元数据：
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    // 构建 JSON 元数据
    string memory json = string(abi.encodePacked(
        '{"name":"Booking NFT #', uint2str(bookingId), '",',
        '"description":"Real Estate Booking NFT - Property #', uint2str(booking.propertyId), '",',
        '"image":"https://picsum.photos/seed/', uint2str(bookingId), '/400/300",',
        '"attributes":['
    ));
    // 添加属性...
    return string(abi.encodePacked("data:application/json,", json));
}
```

#### 测试结果
- Mint 前：`{"trait_type":"Status","value":"Pending"}`
- Cancel 后：`{"trait_type":"Status","value":"Cancelled"}`

---

### 阶段三：前端展示

#### 修改 MyBookings.jsx
1. 允许 PENDING 和 SUCCESS 状态都可以 Mint NFT
2. 显示已铸造 NFT 的信息
3. 添加 OpenSea 链接

---

## 🔗 支线问题

| 支线 | 问题 | 发现方法 | 解决方式 |
|------|------|---------|---------|
| 1 | tokenURI 占位符 | Hardhat 测试 | 完善 JSON 元数据 |
| 2 | 缺少展示组件 | 代码审查 | 添加 NFT 信息 + OpenSea 链接 |
| 3 | 取消时 NFT 处理 | 业务分析 | 保留 NFT，更新状态 |
| 4 | 铸造状态限制 | 代码审查 | 改为 PENDING/CONFIRMED |

---

## ✅ 实施结果

### 1. tokenURI 元数据
```json
{
  "name": "Booking NFT #2",
  "description": "Real Estate Booking NFT - Property #1",
  "image": "https://picsum.photos/seed/2/400/300",
  "attributes": [
    {"trait_type": "Property ID", "value": 1},
    {"trait_type": "Amount ETH", "value": 0},
    {"trait_type": "Status", "value": "Pending/Cancelled"}
  ]
}
```

### 2. 取消预订时 NFT 处理
- 保留用户钱包中的 NFT
- tokenURI 中 status 变为 "Cancelled"
- 前端显示 "已铸造" 标签

### 3. 前端展示
- "Mint NFT" 按钮（PENDING/SUCCESS 状态可用）
- NFT 信息卡片（显示 Token ID）
- OpenSea 测试网链接

---

## 🔍 问题排查方法

### 1. 排除法
- 直接用 Hardhat 控制台测试合约，排除前端问题

### 2. 工具法
- `npx hardhat run scripts/testMintNFT.js` 测试铸造
- `npx hardhat run scripts/testTokenURI.js` 测试 tokenURI

---

## 涉及文件修改

| 文件 | 修改内容 |
|------|---------|
| `contracts/contracts/BookingContract.sol` | 完善 tokenURI 元数据 |
| `frontend/src/config/contracts.js` | 更新合约地址 |
| `frontend/src/pages/MyBookings.jsx` | 添加 NFT 展示 |
| `backend/src/routes/bookings.js` | 更新合约地址 |
| `backend/src/routes/properties.js` | 更新合约地址 |
| `backend/src/services/index.js` | 更新合约地址 |

---

## 调试脚本

```bash
# 测试 NFT 铸造
npx hardhat run scripts/testMintNFT.js --network localhost

# 测试 tokenURI
npx hardhat run scripts/testTokenURI.js --network localhost

# 部署合约
npx hardhat run scripts/deploy.js --network localhost
```
