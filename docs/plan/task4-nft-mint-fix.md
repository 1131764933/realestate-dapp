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

## 🔥 突发问题（支线5-11）

### 支线5：ABI 导入格式错误
- **现象**：`abi.filter is not a function`
- **原因**：导入的 ABI 是完整对象 `{abi: [...]}`，而 wagmi 需要纯数组
- **解决**：
```javascript
// 错误
import abi from './abi.json';
// 正确
import abiData from './abi.json';
const abi = abiData.abi || abiData;
```

### 支线6：合约地址未更新
- **现象**：同步 bookings 返回 0 条
- **原因**：后端 bookings.js 用了旧合约地址
- **解决**：更新 `CONTRACT_ADDRESS` 为新部署地址 `0x70e0bA845a1A0F2DA3359C97E0285013525FFC49`

### 支线7：App.jsx 重复 MyBookings 定义
- **现象**：`The symbol "MyBookings" has already been declared`
- **原因**：既有 `import MyBookings`，又在 App.jsx 本地定义了 `const MyBookings = () => {}`
- **发现**：每次恢复代码都会触发
- **解决**：删除本地的 MyBookings 定义，只保留 import

### 支线8：blockchainService 未定义
- **现象**：mint-nft API 报错 `blockchainService is not defined`
- **原因**：getBlockchainService() 返回 null（ PRIVATE_KEY 未配置）
- **解决**：
1. 添加 nextTokenId 到 ABI
2. 路由中调用 getBlockchainService()

### 支线9：MetaMask 输入密码
- **现象**：每次交易都要求输入密码
- **原因**：MetaMask 安全设置，不是代码 bug
- **解决**：在 MetaMask 设置中关闭 "Require password to unlock wallet"

### 支线10：OpenSea 测试网废弃
- **现象**：OpenSea 不再支持测试网
- **解决**：改用 Etherscan 链接

### 支线11：前端错误提示太长
- **现象**：显示原始错误信息如 "User rejected the request..."
- **需求**：用户取消时不显示错误
- **解决**：检测 "User rejected" 关键字，用户取消时不设置错误

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
| 5 | ABI 导入格式错误 | 报错 `abi.filter is not a function` | 提取 abi 数组 |
| 6 | 合约地址未更新 | 同步返回 0 条 | 更新后端地址 |
| 7 | 重复 MyBookings 定义 | 编译报错 | 删除本地定义 |
| 8 | blockchainService 未定义 | mint-nft API 报错 | 添加 nextTokenId 到 ABI |
| 9 | MetaMask 输入密码 | 每次交易都要密码 | MetaMask 设置关闭 |
| 10 | OpenSea 测试网废弃 | 无法查看 NFT | 改用 Etherscan 链接 |
| 11 | 错误提示太长 | 显示原始错误信息 | 用户取消不显示错误 |

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
| `contracts/contracts/BookingContract.sol` | 完善 tokenURI 元数据，添加 nextTokenId() |
| `frontend/src/config/contracts.js` | 更新合约地址，修复 ABI 导入 |
| `frontend/src/pages/MyBookings.jsx` | 添加 NFT 展示和状态 |
| `frontend/src/App.jsx` | 添加 MyBookings import，修复错误处理 |
| `backend/src/routes/bookings.js` | 更新合约地址，添加 nextTokenId |
| `backend/src/routes/properties.js` | 更新合约地址 |
| `backend/src/services/index.js` | 添加 nextTokenId 到 ABI |

---

## 📋 当前状态

### 合约地址
```
0x70e0bA845a1A0F2DA3359C97E0285013525FFC49
```

### 数据统计
- 预订数量：6 个
- 已铸造 NFT：2 个 (Token ID: 2, 3)

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
