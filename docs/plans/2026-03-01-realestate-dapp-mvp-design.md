# 房地产 DApp MVP 完整设计方案

**版本**: v1.1  
**创建日期**: 2026-03-01  
**更新日期**: 2026-03-01  
**状态**: 待审批

---

## 一、项目概述

### 1.1 项目背景

本项目是一个基于区块链技术的房地产预订平台，采用 Web2 + Web3 混合架构。用户可以通过平台浏览房源、连接钱包、预订房产，预订记录将存储在区块链上，确保数据的透明性和不可篡改性。

### 1.2 项目目标

构建一个完整可演示的房地产 DApp，展示全栈开发能力和区块链技术深度，适配面试需求。

### 1.3 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | React + Vite |
| UI 组件库 | Mantine |
| 钱包集成 | ethers.js + MetaMask |
| 身份验证 | Auth0 |
| 后端框架 | Node.js + Express |
| 数据库 | MongoDB + Mongoose |
| ORM | Prisma (可选) |
| 智能合约 | Solidity + Hardhat |
| 合约标准 | OpenZeppelin (ERC721, Ownable, ReentrancyGuard) |
| 存储 | IPFS (静态资源) |

---

## 二、系统架构

### 2.1 整体架构图

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
│  ┌──────────┐  ┌──────────┐                                     │
│  │PropertyNFT│ │Booking  │                                     │
│  │ 房源NFT  │  │ 预订合约 │                                     │
│  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 链上链下职责划分

#### 链上负责（核心逻辑，确保安全性、不可篡改性）

1. **Booking 合法性校验**
   - 日期有效性（startDate > block.timestamp、endDate > startDate）
   - 房源有效性（存在且激活）
   - 无重叠预订
   - 金额一致性

2. **Payment 验证**
   - 校验用户支付的 ETH 金额（msg.value >= amount）
   - 记录预订支付金额（bookingPayments）
   - 管理合约资金存储与 Owner 提现

3. **bookingId 生成**：链上生成唯一预订 ID

4. **NFT Ownership**：NFT 铸造、权限校验

5. **预订状态管理**：状态机更新（Pending/Confirmed/Cancelled/Completed/Failed）

6. **权限控制**：Owner 与普通用户的权限划分

#### 链下负责（非核心逻辑，提升灵活性、降低成本）

1. **MongoDB 存储**
   - Property 详情（名称、描述、图片、位置、价格、激活状态）
   - 用户资料（昵称、头像、联系方式）
   - 预订详情同步（补充 txHash、交易时间）
   - Indexer 状态（断点续传）

2. **其他链下职责**
   - 图片存储（IPFS 或云存储）
   - 搜索功能
   - 排序功能
   - 日志记录、数据统计

---

## 三、数据库设计

### 3.1 User 表

```javascript
{
    _id: ObjectId,
    auth0Id: String,          // Auth0 用户 ID，唯一索引
    walletAddress: String,   // 钱包地址，唯一索引
    email: String,
    favorites: [propertyId],  // 收藏的房源 ID 数组
    points: Number,           // 积分
    createdAt: Date,
    updatedAt: Date
}
```

### 3.2 Property 表

```javascript
{
    _id: ObjectId,
    propertyId: Number,      // 与链上 propertyId 一致
    name: String,
    description: String,
    imageUrl: String,        // IPFS 或云存储 URL
    location: String,
    price: Number,            // 价格（wei）
    owner: String,            // 所有者钱包地址
    isActive: Boolean,        // 激活状态
    createdAt: Date,
    updatedAt: Date
}
```

### 3.3 Booking 表

```javascript
{
    _id: ObjectId,
    bookingId: Number,       // 链上 booking ID
    userId: ObjectId,         // 关联 User
    auth0Id: String,
    walletAddress: String,
    propertyId: Number,
    startDate: Number,        // 时间戳
    endDate: Number,         // 时间戳
    amount: Number,           // 预订金额（wei）
    txHash: String,           // 交易哈希，唯一索引
    status: String,          // PENDING/SUCCESS/FAILED/CANCELLED/COMPLETED
    nftTokenId: Number,      // NFT ID（铸造后填充）
    createdAt: Date,
    updatedAt: Date
}
```

### 3.4 IndexerState 表

```javascript
{
    _id: ObjectId,
    lastProcessedBlock: Number,  // 上一次处理的区块号
    updatedAt: Date
}
```

---

## 四、智能合约设计

### 4.1 BookingContract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BookingContract is ERC721URIStorage, Ownable, ReentrancyGuard {

    // ============ 状态枚举 ============
    enum BookingStatus {
        Pending,    // 待确认
        Confirmed,  // 已确认
        Cancelled,  // 已取消
        Completed,  // 已完成
        Failed      // 失败
    }

    // ============ 数据结构 ============
    struct Booking {
        address user;          // 预订用户地址
        uint propertyId;       // 房源 ID
        uint startDate;        // 预订开始时间戳
        uint endDate;          // 预订结束时间戳
        uint amount;           // 预订金额（wei）
        BookingStatus status;  // 预订状态
    }

    // ============ 状态变量 ============
    uint256 private _nextBookingId;
    uint256 private _nextTokenId;

    // propertyId => 价格
    mapping(uint256 => uint256) public propertyPrice;
    // propertyId => 激活状态
    mapping(uint256 => bool) public propertyActive;
    // propertyId => (date => 是否已预订)
    mapping(uint256 => mapping(uint256 => bool)) public propertyDateBooked;
    // bookingId => Booking 详情
    mapping(uint256 => Booking) public bookings;
    // bookingId => 实际支付金额
    mapping(uint256 => uint256) public bookingPayments;
    // bookingId => NFT TokenId
    mapping(uint256 => uint256) public bookingToNFT;
    // TokenId => bookingId
    mapping(uint256 => uint256) public nftToBooking;

    // ============ 事件 ============
    event BookingCreated(
        uint256 indexed bookingId,
        address indexed user,
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount,
        BookingStatus status
    );

    event BookingCancelled(
        uint256 indexed bookingId,
        address indexed user,
        BookingStatus status
    );

    event BookingCompleted(
        uint256 indexed bookingId,
        address indexed user,
        BookingStatus status
    );

    event NFTMinted(
        uint256 indexed bookingId,
        uint256 indexed tokenId,
        address indexed to
    );

    // ============ 构造函数 ============
    constructor() ERC721("RealEstateBooking", "REB") Ownable(msg.sender) {
        _nextBookingId = 1;
        _nextTokenId = 1;
    }

    // ============ Owner 函数 ============

    /// @notice 添加房源
    function addProperty(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] == 0, "Property already exists");
        propertyPrice[propertyId] = price;
        propertyActive[propertyId] = true;
    }

    /// @notice 修改房源价格
    function setPropertyPrice(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        propertyPrice[propertyId] = price;
    }

    /// @notice 激活房源
    function activateProperty(uint256 propertyId) external onlyOwner {
        propertyActive[propertyId] = true;
    }

    /// @notice 下架房源
    function deactivateProperty(uint256 propertyId) external onlyOwner {
        propertyActive[propertyId] = false;
    }

    /// @notice 提现合约中的 ETH
    function withdraw() external onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ 用户函数 ============

    /// @notice 预订房源
    function book(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount
    ) external payable nonReentrant {
        // 1. 预订开始时间有效性约束
        require(startDate > block.timestamp, "Start date must be after current block time");

        // 2. 日期区间有效性约束
        require(endDate > startDate, "End date must be after start date");

        // 3. 房源有效性约束
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        require(propertyActive[propertyId], "Property is not active");

        // 4. 无重叠预订约束
        require(!overlapBooking(propertyId, startDate, endDate), "Booking time overlaps with existing one");

        // 5. 金额一致性约束
        require(amount == propertyPrice[propertyId], "Booking amount does not match property price");

        // 6. 支付金额有效性约束
        require(msg.value >= amount, "Sent value is less than booking amount");

        // 7. 创建预订记录
        uint256 bookingId = _nextBookingId++;
        bookingPayments[bookingId] = msg.value;

        // 标记日期已预订
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            propertyDateBooked[propertyId][d] = true;
        }

        bookings[bookingId] = Booking({
            user: msg.sender,
            propertyId: propertyId,
            startDate: startDate,
            endDate: endDate,
            amount: amount,
            status: BookingStatus.Pending
        });

        // 8. 触发事件
        emit BookingCreated(
            bookingId,
            msg.sender,
            propertyId,
            startDate,
            endDate,
            amount,
            BookingStatus.Pending
        );
    }

    /// @notice 取消预订
    function cancelBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];

        // 权限校验
        require(booking.user == msg.sender, "Not booking owner");

        // 状态校验
        require(
            booking.status == BookingStatus.Pending || 
            booking.status == BookingStatus.Confirmed,
            "Cannot cancel this booking"
        );

        // 更新状态
        booking.status = BookingStatus.Cancelled;

        // 释放预订日期
        releaseBookingDates(booking.propertyId, booking.startDate, booking.endDate);

        emit BookingCancelled(bookingId, msg.sender, BookingStatus.Cancelled);
    }

    /// @notice 完成预订
    function completeBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];

        // 权限校验
        require(booking.user == msg.sender, "Not booking owner");

        // 状态校验
        require(booking.status == BookingStatus.Confirmed, "Cannot complete this booking");

        // 时间校验
        require(block.timestamp > booking.endDate, "Booking has not ended yet");

        // 更新状态
        booking.status = BookingStatus.Completed;

        emit BookingCompleted(bookingId, msg.sender, BookingStatus.Completed);
    }

    /// @notice 铸造预订 NFT
    function mintBookingNFT(address to, uint256 bookingId) external nonReentrant {
        // 权限校验：仅预订所有者可铸造
        require(bookings[bookingId].user == msg.sender, "Not booking owner");

        // 生成唯一 NFT ID
        uint256 tokenId = _nextTokenId++;

        // 铸造 NFT
        _safeMint(to, tokenId);

        // 关联预订 ID 与 NFT ID
        bookingToNFT[bookingId] = tokenId;
        nftToBooking[tokenId] = bookingId;

        // 设置 tokenURI
        _setTokenURI(tokenId, tokenURI(tokenId));

        emit NFTMinted(bookingId, tokenId, to);
    }

    // ============ 查询函数 ============

    /// @notice 查询房源是否存在
    function propertyExists(uint256 propertyId) public view returns (bool) {
        return propertyPrice[propertyId] > 0;
    }

    /// @notice 检查预订是否重叠
    function overlapBooking(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate
    ) public view returns (bool) {
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            if (propertyDateBooked[propertyId][d]) {
                return true;
            }
        }
        return false;
    }

    /// @notice 查询指定房源的所有预订 ID
    function getPropertyBookingIds(uint256 /* propertyId */) public pure returns (uint256[] memory) {
        // 简化实现，实际可通过映射获取
        return new uint256[](0);
    }

    /// @notice 查询单个预订详情
    function getBooking(uint256 bookingId) public view returns (Booking memory) {
        return bookings[bookingId];
    }

    /// @notice 查询用户的所有预订 ID
    function getUserBookings(address user) public pure returns (uint256[] memory) {
        // 简化实现，实际可通过映射获取
        return new uint256[](0);
    }

    /// @notice 获取 NFT 元数据
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "NFT does not exist");

        uint256 bookingId = nftToBooking[tokenId];
        Booking memory booking = bookings[bookingId];

        // 返回 IPFS 元数据地址
        return string(abi.encodePacked("ipfs://QmXYZ/metadata_", tokenId, ".json"));
    }

    // ============ 辅助函数 ============

    /// @notice 释放预订日期
    function releaseBookingDates(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate
    ) internal {
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            propertyDateBooked[propertyId][d] = false;
        }
    }

    /// @notice 辅助：将 uint 转为 string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}
```

### 4.2 合约安全约束

| 约束类型 | 实现方式 |
|---------|---------|
| 时间约束 | require(startDate > block.timestamp) |
| 日期约束 | require(endDate > startDate) |
| 房源约束 | require(propertyExists + isPropertyActive) |
| 重叠约束 | require(!overlapBooking) |
| 金额约束 | require(amount == propertyPrice) |
| 支付约束 | require(msg.value >= amount) |
| 权限约束 | onlyOwner + only booking owner |
| 状态约束 | 状态机校验 |
| 重入防护 | nonReentrant 修饰符 |

### 4.3 Gas 优化设计

1. **避免返回 struct 数组**：使用 getPropertyBookingIds + getBooking 组合
2. **使用 mapping 替代数组**：user 与预订 ID 的关联
3. **链上仅存 propertyId**：房源详情存链下
4. **view 函数避免复杂计算**
5. **BitMap 位图存储**（进阶）：使用 OpenZeppelin BitMaps 库，将每天状态存为单个 bit，Gas 从 O(n) 降至 O(1)
6. **NFT 批量铸造**（进阶）：新增 batchMintBookingNFT 支持批量铸造

### 4.4 安全性增强（进阶）

1. **多余 ETH 退还**：book 函数自动退还多付的 ETH
2. **事件参数完整性**：事件增加 blockNumber 和 timestamp 便于 Indexer 断点恢复
3. **合约升级支持**：预留 UUPS/Transparent Proxy 接口支持未来升级

---

## 五、后端设计

### 5.1 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── index.js           # 配置（MongoDB, Auth0, 合约地址）
│   ├── models/
│   │   ├── User.js
│   │   ├── Property.js
│   │   ├── Booking.js
│   │   └── IndexerState.js
│   ├── routes/
│   │   ├── auth.js           # Auth0 认证
│   │   ├── properties.js     # 房源 API
│   │   └── bookings.js       # 预订 API
│   ├── services/
│   │   ├── blockchainService.js  # 区块链交互
│   │   ├── bookingService.js    # 预订业务逻辑
│   │   └── eventListener.js      # Indexer 事件监听
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT 验证
│   ├── utils/
│   │   └── index.js
│   └── index.js
├── package.json
└── .env.example
```

### 5.2 blockchainService.js

```javascript
// 核心功能：
// 1. 合约实例化
// 2. 签名验证
// 3. 交易上链
// 4. 合约事件监听
// 5. 查询函数封装

const { ethers } = require('ethers');

class BlockchainService {
    constructor(contractAddress, abi, privateKey, rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
    }

    // 调用合约写方法
    async callContractMethod(methodName, args, options = {}) {
        const contract = this.contract.connect(this.wallet);
        const tx = await contract[methodName](...args, options);
        return await tx.wait();
    }

    // 调用合约读方法
    async callContractView(methodName, args) {
        return await this.contract[methodName](...args);
    }

    // 获取用户预订
    async getUserBookings(userAddress) {
        return await this.contract.getUserBookings(userAddress);
    }

    // 获取预订详情
    async getBooking(bookingId) {
        return await this.contract.getBooking(bookingId);
    }
}

module.exports = BlockchainService;
```

### 5.3 bookingService.js

```javascript
// 核心功能：
// 1. 链上预订 (bookOnChain)
// 2. 链上取消 (cancelBookingOnChain)
// 3. 链上完成 (completeBookingOnChain)
// 4. 失败恢复机制
// 5. MongoDB 事务机制
// 6. 交易失败自动重试

// MongoDB 事务机制
async function bookWithTransaction(propertyId, startDate, endDate, amount, userWallet) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        
        // 1. 链上操作
        const tx = await callWithRetry(() => blockchainService.book(...));
        
        // 2. MongoDB 写入（在事务中）
        await Booking.create([booking], { session });
        
        await session.commitTransaction();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// 自动重试机制（指数退避）
async function callWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(Math.pow(2, i) * 1000);
        }
    }
}

async function bookOnChain(propertyId, startDate, endDate, amount, userWallet) {
    try {
        // 调用合约 book 函数
        const tx = await blockchainService.callContractMethod("book", 
            [propertyId, startDate, endDate, amount],
            { from: userWallet, value: amount }
        );

        // 等待交易确认
        const receipt = await tx.wait();

        // 同步状态到 MongoDB
        await syncBookingStatus(bookingId, "Pending");

        return { success: true, txHash: receipt.transactionHash, bookingId };

    } catch (error) {
        console.error("Booking on chain failed:", error);
        
        // 标记失败状态
        await syncBookingStatus(bookingId, "Failed");
        
        return { success: false, error: error.message, bookingId };
    }
}
```

### 5.4 eventListener.js (Indexer)

```javascript
// 核心功能：
// 1. 监听 BookingCreated、BookingCancelled、BookingCompleted 事件
// 2. 断点续传功能
// 3. 数据同步到 MongoDB

class EventListener {
    constructor(blockchainService, mongoUri) {
        this.provider = blockchainService.provider;
        this.contract = blockchainService.contract;
        this.db = null; // MongoDB 连接
    }

    async start() {
        // 1. 获取上次处理的区块号
        const lastBlock = await this.getLastProcessedBlock();

        // 2. 查询事件
        const events = await this.contract.queryFilter(
            "BookingCreated",
            lastBlock,
            "latest"
        );

        // 3. 处理事件
        for (const event of events) {
            await this.handleBookingCreated(event);
        }

        // 4. 更新区块号
        await this.updateLastProcessedBlock();
    }

    async getLastProcessedBlock() {
        const state = await IndexerState.findOne();
        return state ? state.lastProcessedBlock : 0;
    }
}
```

### 5.5 Indexer 断点续传设计

1. **IndexerState 表**：存储 lastProcessedBlock
2. **启动时**：读取 lastProcessedBlock
3. **查询事件**：queryFilter(fromBlock, toBlock)
4. **处理完成**：更新 lastProcessedBlock
5. **异常处理**：重启后从上次区块继续

---

## 六、前端设计

### 6.1 项目结构

```
frontend/
├── src/
│   ├── assets/              # 静态资源
│   ├── components/          # UI 组件
│   │   ├── Layout/          # 布局组件
│   │   ├── Property/        # 房源相关
│   │   ├── Booking/         # 预订相关
│   │   └── Wallet/          # 钱包相关
│   ├── config/              # 配置文件
│   │   └── index.js         # 合约地址、API 地址
│   ├── context/
│   │   ├── AuthContext.jsx  # Auth0 上下文
│   │   └── WalletContext.jsx # 钱包上下文
│   ├── hooks/               # 自定义 hooks
│   │   ├── useWallet.js
│   │   └── useContract.js
│   ├── pages/               # 页面
│   │   ├── Home.jsx         # 首页
│   │   ├── PropertyList.jsx # 房源列表
│   │   ├── PropertyDetail.jsx # 房源详情
│   │   ├── MyBookings.jsx   # 我的预订
│   │   └── Profile.jsx      # 个人中心
│   ├── services/            # API 服务
│   │   └── api.js
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

### 6.2 核心组件

| 组件 | 功能 |
|------|------|
| WalletConnect | 连接/断开 MetaMask，显示地址 |
| PropertyCard | 房源卡片，展示基本信息 |
| PropertyList | 房源列表，搜索/筛选 |
| BookingForm | 预订表单，选择日期 |
| BookingCard | 预订卡片，展示状态 |
| NFTCard | NFT 展示（可选 OpenSea 嵌入）|

### 6.4 前端 UX 优化（进阶）

1. **日历控件禁用已预订日期**：日期选择器禁用已预订的日期
2. **NFT 展示优化**：显示 OpenSea 测试网链接和 MetaMask NFT 查看入口
3. **交易状态反馈**：清晰的加载状态、交易哈希显示、失败原因提示

### 6.5 用户操作流程

```
1. 用户浏览房源列表
2. 用户点击房源查看详情
3. 用户连接钱包（MetaMask）
4. 用户选择预订日期
5. 用户点击"Book"按钮
6. 前端调用后端 API 验证业务逻辑
7. 前端调用 ethers.js 发起交易
8. MetaMask 弹出确认，用户签名
9. 交易上链，合约 emit BookingCreated
10. Indexer 监听事件，同步到 MongoDB
11. 前端查询 API，展示预订成功
12. 用户可铸造预订 NFT
```

---

## 七、功能优先级

| 优先级 | 功能 | 说明 |
|-------|------|------|
| P0 | 合约部署/交互封装 | 核心基础设施 |
| P0 | 权限模型设计 | Owner vs 用户 |
| P0 | Booking 状态机 | 完整生命周期 |
| P0 | Payment 模型 | ETH 存储+提现 |
| P0 | Reentrancy 防御 | 安全防护 |
| P1 | Indexer 断点续传 | 数据同步 |
| P1 | 链上链下职责划分 | 架构设计 |
| P1 | 用户操作流程 | 面试展示 |
| P2 | NFT 设计 | tokenURI |
| P2 | Gas 优化 | 性能优化 |
| P3 | 失败恢复机制 | 鲁棒性 |
| P4 | 收藏功能 | 联合唯一索引 |

---

## 八、部署配置

### 8.1 环境变量 (.env.example)

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/realestate
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.realestate.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Blockchain
RPC_URL=https://sepolia.infura.io/v3/your-project-id
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# Frontend
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0x...
```

### 8.2 Docker Compose (可选)

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/realestate
  
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
```

---

## 九、面试话术汇总

### 9.1 系统架构介绍

> This is a Web2 + Web3 hybrid architecture. The frontend uses React with Vite, Mantine for UI components, and integrates with MetaMask through ethers.js. The backend is built with Node.js and Express, using MongoDB for data persistence and Auth0 for authentication. The smart contracts handle core logic like booking validation, payment processing, and NFT minting. We use an event-driven design where the Indexer listens to contract events to keep the off-chain database in sync.

### 9.2 权限模型

> We use OpenZeppelin's Ownable contract. Only the owner can manage properties (add, update price, activate/deactivate) and withdraw funds. Regular users can book properties and mint NFTs for their own bookings. We also add ownership checks in critical functions to prevent unauthorized access.

### 9.3 状态机

> We implemented a complete booking lifecycle with 5 states: Pending (created), Confirmed (paid), Cancelled (user cancelled), Completed (booking ended), and Failed (transaction reverted). Each state transition is validated to ensure business logic integrity.

### 9.4 链上链下划分

> We only store essential data on-chain: booking validation, payment records, NFT ownership, and status management. Property details, user profiles, and search functionality are stored off-chain in MongoDB. This hybrid approach balances security with flexibility and cost efficiency.

### 9.5 Indexer 断点续传

> We store the last processed block number in MongoDB. When the Indexer restarts, it reads this value and continues listening from that block. This ensures no events are missed even if the service is interrupted.

---

## 十、验收标准

- [ ] 智能合约可部署到 Sepolia 测试网
- [ ] 后端 API 可正常响应
- [ ] 前端可连接 MetaMask
- [ ] 用户可完成预订上链流程
- [ ] Indexer 可同步链上事件
- [ ] 用户可铸造预订 NFT
- [ ] 预订状态可正常流转
- [ ] 面试可完整展示系统架构

---

*文档版本: 1.0*
*创建时间: 2026-03-01*
