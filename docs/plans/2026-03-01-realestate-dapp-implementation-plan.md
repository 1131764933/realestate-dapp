# 房地产 DApp MVP 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**版本**: v1.1  
**更新日期**: 2026-03-01

**Goal:** 构建一个完整的房地产预订 DApp，包含智能合约、后端 API、前端页面，实现 Web2 + Web3 混合架构

**Architecture:** 前后端分离架构，后端负责业务逻辑和区块链交互，前端负责 UI 和钱包连接。Indexer 监听链上事件同步数据到 MongoDB

**Tech Stack:** React + Vite, Node.js + Express, MongoDB, Hardhat, Solidity, ethers.js, Mantine, Auth0

---

## 阶段一：项目初始化与环境搭建

### Task 1.1: 初始化项目结构

**Files:**
- Create: `realestate-dapp/`
- Create: `realestate-dapp/contracts/`
- Create: `realestate-dapp/backend/`
- Create: `realestate-dapp/frontend/`

**Step 1: 创建项目根目录**
```bash
mkdir -p realestate-dapp/{contracts,backend,frontend}
cd realestate-dapp
```

**Step 2: 初始化 Git**
```bash
git init
git checkout -b develop
```

**Step 3: Commit**
```bash
git add .
git commit -m "chore: initialize project structure"
```

---

### Task 1.2: 搭建智能合约开发环境

**Files:**
- Create: `realestate-dapp/contracts/package.json`
- Create: `realestate-dapp/contracts/hardhat.config.js`
- Create: `realestate-dapp/contracts/.env.example`
- Create: `realestate-dapp/contracts/.gitignore`

**Step 1: 初始化合约项目**
```bash
cd realestate-dapp/contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts ethers
npx hardhat init
# 选择 Create a JavaScript project
```

**Step 2: 配置 hardhat.config.js**
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

**Step 3: 创建 .env.example**
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0x_your_private_key
```

**Step 4: Commit**
```bash
git add contracts/
git commit -m "feat: setup Hardhat environment"
```

---

### Task 1.3: 搭建后端开发环境

**Files:**
- Create: `realestate-dapp/backend/package.json`
- Create: `realestate-dapp/backend/.env.example`
- Create: `realestate-dapp/backend/.gitignore`

**Step 1: 初始化后端项目**
```bash
cd realestate-dapp/backend
npm init -y
npm install express mongoose dotenv cors ethers
npm install --save-dev nodemon
```

**Step 2: 创建基本目录结构**
```bash
mkdir -p backend/src/{config,models,routes,services,middleware,utils}
```

**Step 3: 创建 package.json scripts**
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

**Step 4: Commit**
```bash
git add backend/
git commit -feat: setup backend environment
```

---

### Task 1.4: 搭建前端开发环境

**Files:**
- Create: `realestate-dapp/frontend/package.json`

**Step 1: 初始化前端项目**
```bash
cd realestate-dapp/frontend
npm create vite@latest . -- --template react
npm install @mantine/core @mantine/hooks @emotion/react @emotion/styled
npm install react-router-dom axios ethers @auth0/auth0-react
```

**Step 2: 创建目录结构**
```bash
mkdir -p frontend/src/{components,pages,hooks,context,services,config,utils,assets}
```

**Step 3: Commit**
```bash
git add frontend/
git commit -m "feat: setup frontend with Vite and Mantine"
```

---

## 阶段二：智能合约开发

### Task 2.1: 编写 BookingContract 智能合约

**Files:**
- Create: `realestate-dapp/contracts/contracts/BookingContract.sol`

**Step 1: 编写合约代码**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BookingContract is ERC721URIStorage, Ownable, ReentrancyGuard {

    // ============ 状态枚举 ============
    enum BookingStatus {
        Pending,
        Confirmed,
        Cancelled,
        Completed,
        Failed
    }

    // ============ 数据结构 ============
    struct Booking {
        address user;
        uint256 propertyId;
        uint256 startDate;
        uint256 endDate;
        uint256 amount;
        BookingStatus status;
    }

    // ============ 状态变量 ============
    uint256 private _nextBookingId;
    uint256 private _nextTokenId;

    mapping(uint256 => uint256) public propertyPrice;
    mapping(uint256 => bool) public propertyActive;
    mapping(uint256 => mapping(uint256 => bool)) public propertyDateBooked;
    mapping(uint256 => Booking) public bookings;
    mapping(uint256 => uint256) public bookingPayments;
    mapping(uint256 => uint256) public bookingToNFT;
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

    function addProperty(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] == 0, "Property already exists");
        propertyPrice[propertyId] = price;
        propertyActive[propertyId] = true;
    }

    function setPropertyPrice(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        propertyPrice[propertyId] = price;
    }

    function activateProperty(uint256 propertyId) external onlyOwner {
        propertyActive[propertyId] = true;
    }

    function deactivateProperty(uint256 propertyId) external onlyOwner {
        propertyActive[propertyId] = false;
    }

    function withdraw() external onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ 用户函数 ============

    function book(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount
    ) external payable nonReentrant {
        require(startDate > block.timestamp, "Start date must be after current block time");
        require(endDate > startDate, "End date must be after start date");
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        require(propertyActive[propertyId], "Property is not active");
        require(!overlapBooking(propertyId, startDate, endDate), "Booking time overlaps");
        require(amount == propertyPrice[propertyId], "Amount does not match price");
        require(msg.value >= amount, "Insufficient payment");

        uint256 bookingId = _nextBookingId++;
        bookingPayments[bookingId] = msg.value;

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

    function cancelBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];
        require(booking.user == msg.sender, "Not booking owner");
        require(
            booking.status == BookingStatus.Pending || 
            booking.status == BookingStatus.Confirmed,
            "Cannot cancel this booking"
        );

        booking.status = BookingStatus.Cancelled;
        releaseBookingDates(booking.propertyId, booking.startDate, booking.endDate);

        emit BookingCancelled(bookingId, msg.sender, BookingStatus.Cancelled);
    }

    function completeBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];
        require(booking.user == msg.sender, "Not booking owner");
        require(booking.status == BookingStatus.Confirmed, "Cannot complete this booking");
        require(block.timestamp > booking.endDate, "Booking has not ended yet");

        booking.status = BookingStatus.Completed;

        emit BookingCompleted(bookingId, msg.sender, BookingStatus.Completed);
    }

    function mintBookingNFT(address to, uint256 bookingId) external nonReentrant {
        require(bookings[bookingId].user == msg.sender, "Not booking owner");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        bookingToNFT[bookingId] = tokenId;
        nftToBooking[tokenId] = bookingId;
        _setTokenURI(tokenId, tokenURI(tokenId));

        emit NFTMinted(bookingId, tokenId, to);
    }

    // ============ 查询函数 ============

    function propertyExists(uint256 propertyId) public view returns (bool) {
        return propertyPrice[propertyId] > 0;
    }

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

    function getBooking(uint256 bookingId) public view returns (Booking memory) {
        return bookings[bookingId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "NFT does not exist");
        uint256 bookingId = nftToBooking[tokenId];
        return string(abi.encodePacked("ipfs://QmXYZ/metadata_", uint2str(tokenId), ".json"));
    }

    // ============ 辅助函数 ============

    function releaseBookingDates(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate
    ) internal {
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            propertyDateBooked[propertyId][d] = false;
        }
    }

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

**Step 2: 编译合约**
```bash
cd realestate-dapp/contracts
npx hardhat compile
```

**Step 3: 验证编译成功**
Expected: 编译无错误，生成 artifacts

**Step 4: Commit**
```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: add BookingContract with full functionality"
```

---

### Task 2.2: 部署合约到本地测试网

**Files:**
- Create: `realestate-dapp/contracts/scripts/deploy.js`

**Step 1: 编写部署脚本**

```javascript
const hre = require("hardhat");

async function main() {
    console.log("Deploying BookingContract...");
    
    const BookingContract = await hre.ethers.getContractFactory("BookingContract");
    const contract = await BookingContract.deploy();
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(`BookingContract deployed to: ${address}`);
    
    // 添加测试房源
    console.log("Adding test properties...");
    
    // propertyId 1: 1000 wei
    await contract.addProperty(1, ethers.parseEther("0.001"));
    
    // propertyId 2: 2000 wei
    await contract.addProperty(2, ethers.parseEther("0.002"));
    
    // propertyId 3: 3000 wei
    await contract.addProperty(3, ethers.parseEther("0.003"));
    
    console.log("Test properties added!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

**Step 2: 启动本地网络并部署**
```bash
# 终端1: 启动本地节点
npx hardhat node

# 终端2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

**Step 3: 保存部署地址**
将合约地址保存到 `contracts/deployed-address.json`

**Step 4: Commit**
```bash
git add contracts/scripts/deploy.js
git commit -m "feat: add deployment script"
```

---

### Task 2.3: 导出合约 ABI

**Files:**
- Modify: `realestate-dapp/frontend/src/config/contracts.js`

**Step 1: 复制 ABI 文件**
```bash
cp contracts/artifacts/contracts/BookingContract.sol/BookingContract.json frontend/src/config/
```

**Step 2: 创建前端配置文件**

```javascript
// frontend/src/config/contracts.js
import BookingContractABI from './BookingContract.json';

export const CONTRACT_CONFIG = {
    address: 'CONTRACT_ADDRESS_FROM_DEPLOYMENT',
    abi: BookingContractABI.abi
};

export const CONTRACT_ABI = BookingContractABI.abi;
```

**Step 3: Commit**
```bash
git add frontend/src/config/
git commit -m "feat: add contract ABI to frontend"
```

### Task 2.4: 进阶 - 合约 Gas 优化与安全性增强（可选）

**Files:**
- Modify: `realestate-dapp/contracts/contracts/BookingContract.sol`

**Step 1: 添加 BitMap 位图存储（减少 Gas）**
```solidity
import "@openzeppelin/contracts/utils/BitMaps.sol";

using BitMaps for BitMaps.BitMap;
mapping(uint256 => BitMaps.BitMap) public propertyDateBookedBitmap;
```

**Step 2: 添加批量 NFT 铸造函数**
```solidity
function batchMintBookingNFT(address to, uint256[] calldata bookingIds) external nonReentrant {
    for (uint i = 0; i < bookingIds.length; i++) {
        require(bookings[bookingIds[i]].user == msg.sender, "Not booking owner");
        // mint logic...
    }
}
```

**Step 3: 添加多余 ETH 退还**
```solidity
if (msg.value > amount) {
    payable(msg.sender).transfer(msg.value - amount);
}
```

**Step 4: 完善事件参数（便于 Indexer 断点恢复）**
```solidity
event BookingCreated(
    uint256 indexed bookingId,
    address indexed user,
    uint256 propertyId,
    uint256 startDate,
    uint256 endDate,
    uint256 amount,
    BookingStatus status,
    uint256 blockNumber,
    uint256 timestamp
);
```

**Step 5: Commit**
```bash
git add contracts/contracts/BookingContract.sol
git commit -m "feat: add Gas optimization and security enhancements"
```

---

## 阶段三：后端开发

### Task 3.1: 创建 MongoDB 数据模型

**Files:**
- Create: `realestate-dapp/backend/src/models/User.js`
- Create: `realestate-dapp/backend/src/models/Property.js`
- Create: `realestate-dapp/backend/src/models/Booking.js`
- Create: `realestate-dapp/backend/src/models/IndexerState.js`

**Step 1: 创建 User 模型**

```javascript
// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    auth0Id: { type: String, unique: true, sparse: true },
    walletAddress: { type: String, unique: true, sparse: true, lowercase: true },
    email: String,
    favorites: [{ type: Number }],
    points: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
```

**Step 2: 创建 Property 模型**

```javascript
// backend/src/models/Property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    propertyId: { type: Number, unique: true, index: true },
    name: String,
    description: String,
    imageUrl: String,
    location: String,
    price: Number,
    owner: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
```

**Step 3: 创建 Booking 模型**

```javascript
// backend/src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: { type: Number, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    auth0Id: String,
    walletAddress: { type: String, lowercase: true },
    propertyId: Number,
    startDate: Number,
    endDate: Number,
    amount: Number,
    txHash: { type: String, unique: true },
    status: { 
        type: String, 
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    nftTokenId: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
```

**Step 4: 创建 IndexerState 模型**

```javascript
// backend/src/models/IndexerState.js
const mongoose = require('mongoose');

const indexerStateSchema = new mongoose.Schema({
    lastProcessedBlock: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IndexerState', indexerStateSchema);
```

**Step 5: Commit**
```bash
git add backend/src/models/
git commit -m "feat: add MongoDB models"
```

---

### Task 3.2: 创建 BlockchainService

**Files:**
- Create: `realestate-dapp/backend/src/services/blockchainService.js`

**Step 1: 编写 blockchainService.js**

```javascript
// backend/src/services/blockchainService.js
const { ethers } = require('ethers');

class BlockchainService {
    constructor(contractAddress, abi, privateKey, rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
    }

    // 获取合约实例（只读）
    getContract() {
        return this.contract;
    }

    // 获取带签名器实例
    getSignedContract() {
        return this.contract.connect(this.wallet);
    }

    // 调用合约写方法
    async callContractMethod(methodName, args, options = {}) {
        const contract = this.getSignedContract();
        const tx = await contract[methodName](...args, options);
        return await tx.wait();
    }

    // 调用合约读方法
    async callContractView(methodName, args) {
        return await this.contract[methodName](...args);
    }

    // 预订房源
    async book(propertyId, startDate, endDate, amount, fromAddress) {
        const contract = this.getSignedContract();
        const tx = await contract.book(propertyId, startDate, endDate, amount, {
            from: fromAddress,
            value: amount
        });
        return await tx.wait();
    }

    // 取消预订
    async cancelBooking(bookingId, fromAddress) {
        const contract = this.getSignedContract();
        const tx = await contract.cancelBooking(bookingId, { from: fromAddress });
        return await tx.wait();
    }

    // 完成预订
    async completeBooking(bookingId, fromAddress) {
        const contract = this.getSignedContract();
        const tx = await contract.completeBooking(bookingId, { from: fromAddress });
        return await tx.wait();
    }

    // 铸造 NFT
    async mintNFT(bookingId, fromAddress) {
        const contract = this.getSignedContract();
        const tx = await contract.mintBookingNFT(fromAddress, bookingId, { from: fromAddress });
        return await tx.wait();
    }

    // 获取预订详情
    async getBooking(bookingId) {
        return await this.contract.getBooking(bookingId);
    }

    // 获取房源价格
    async getPropertyPrice(propertyId) {
        return await this.contract.propertyPrice(propertyId);
    }

    // 获取房源激活状态
    async isPropertyActive(propertyId) {
        return await this.contract.propertyActive(propertyId);
    }
}

module.exports = BlockchainService;
```

**Step 2: Commit**
```bash
git add backend/src/services/blockchainService.js
git commit -m "feat: add blockchain service"
```

---

### Task 3.3: 创建 EventListener (Indexer)

**Files:**
- Create: `realestate-dapp/backend/src/services/eventListener.js`

**Step 1: 编写 eventListener.js**

```javascript
// backend/src/services/eventListener.js
const { ethers } = require('ethers');
const IndexerState = require('../models/IndexerState');
const Booking = require('../models/Booking');

class EventListener {
    constructor(blockchainService) {
        this.provider = blockchainService.provider;
        this.contract = blockchainService.contract;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Indexer started...');
        
        await this.processPastEvents();
        
        // 监听新事件
        this.contract.on('BookingCreated', this.handleBookingCreated.bind(this));
        this.contract.on('BookingCancelled', this.handleBookingCancelled.bind(this));
        this.contract.on('BookingCompleted', this.handleBookingCompleted.bind(this));
    }

    async stop() {
        this.isRunning = false;
        this.contract.removeAllListeners('BookingCreated');
        this.contract.removeAllListeners('BookingCancelled');
        this.contract.removeAllListeners('BookingCompleted');
        console.log('Indexer stopped');
    }

    async processPastEvents() {
        const lastBlock = await this.getLastProcessedBlock();
        const latestBlock = await this.provider.getBlockNumber();
        
        console.log(`Processing events from block ${lastBlock} to ${latestBlock}`);
        
        // 查询历史事件
        const createdEvents = await this.contract.queryFilter(
            'BookingCreated', lastBlock, latestBlock
        );
        
        for (const event of createdEvents) {
            await this.handleBookingCreated(event);
        }

        await this.updateLastProcessedBlock(latestBlock);
    }

    async getLastProcessedBlock() {
        let state = await IndexerState.findOne();
        if (!state) {
            state = await IndexerState.create({ lastProcessedBlock: 0 });
        }
        return state.lastProcessedBlock;
    }

    async updateLastProcessedBlock(blockNumber) {
        await IndexerState.findOneAndUpdate(
            {},
            { lastProcessedBlock: blockNumber, updatedAt: new Date() }
        );
    }

    async handleBookingCreated(event) {
        const { bookingId, user, propertyId, startDate, endDate, amount, status } = event.args;
        
        console.log(`BookingCreated: ${bookingId}`);
        
        const statusMap = {
            0: 'PENDING',
            1: 'SUCCESS',
            2: 'CANCELLED',
            3: 'COMPLETED',
            4: 'FAILED'
        };
        
        await Booking.findOneAndUpdate(
            { bookingId: Number(bookingId) },
            {
                bookingId: Number(bookingId),
                walletAddress: user.toLowerCase(),
                propertyId: Number(propertyId),
                startDate: Number(startDate),
                endDate: Number(endDate),
                amount: Number(amount),
                status: statusMap[Number(status)],
                updatedAt: new Date()
            },
            { upsert: true }
        );

        await this.updateLastProcessedBlock(event.blockNumber);
    }

    async handleBookingCancelled(event) {
        const { bookingId, status } = event.args;
        console.log(`BookingCancelled: ${bookingId}`);
        
        await Booking.findOneAndUpdate(
            { bookingId: Number(bookingId) },
            { status: 'CANCELLED', updatedAt: new Date() }
        );
        
        await this.updateLastProcessedBlock(event.blockNumber);
    }

    async handleBookingCompleted(event) {
        const { bookingId, status } = event.args;
        console.log(`BookingCompleted: ${bookingId}`);
        
        await Booking.findOneAndUpdate(
            { bookingId: Number(bookingId) },
            { status: 'COMPLETED', updatedAt: new Date() }
        );
        
        await this.updateLastProcessedBlock(event.blockNumber);
    }
}

module.exports = EventListener;
```

**Step 2: Commit**
```bash
git add backend/src/services/eventListener.js
git commit -m "feat: add event listener (Indexer)"
```

---

### Task 3.4: 创建 API 路由

**Files:**
- Create: `realestate-dapp/backend/src/routes/properties.js`
- Create: `realestate-dapp/backend/src/routes/bookings.js`
- Create: `realestate-dapp/backend/src/index.js`

**Step 1: 创建 properties.js**

```javascript
// backend/src/routes/properties.js
const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const blockchainService = require('../services/blockchainService');

// 获取所有房源
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find({ isActive: true });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单个房源
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findOne({ propertyId: req.params.id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建房源（仅 Owner）
router.post('/', async (req, res) => {
    try {
        const { propertyId, name, description, imageUrl, location, price } = req.body;
        
        // 链上添加房源
        // await blockchainService.addProperty(propertyId, price);
        
        // 链下存储详情
        const property = await Property.create({
            propertyId,
            name,
            description,
            imageUrl,
            location,
            price,
            owner: process.env.OWNER_ADDRESS
        });
        
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 收藏房源
router.post('/:id/favorite', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const propertyId = parseInt(req.params.id);
        
        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            { $addToSet: { favorites: propertyId } },
            { new: true }
        );
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

**Step 2: 创建 bookings.js**

```javascript
// backend/src/routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const blockchainService = require('../services/blockchainService');

// 获取用户预订
router.get('/user/:address', async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            walletAddress: req.params.address.toLowerCase() 
        }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建预订
router.post('/', async (req, res) => {
    try {
        const { propertyId, startDate, endDate, amount, walletAddress, txHash } = req.body;
        
        const booking = await Booking.create({
            propertyId,
            startDate: Math.floor(new Date(startDate).getTime() / 1000),
            endDate: Math.floor(new Date(endDate).getTime() / 1000),
            amount,
            walletAddress: walletAddress.toLowerCase(),
            txHash,
            status: 'PENDING'
        });
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 铸造 NFT
router.post('/:id/mint-nft', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { walletAddress } = req.body;
        
        const tx = await blockchainService.mintNFT(bookingId, walletAddress);
        
        await Booking.findOneAndUpdate(
            { bookingId },
            { nftTokenId: bookingId, updatedAt: new Date() }
        );
        
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 取消预订
router.post('/:id/cancel', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { walletAddress } = req.body;
        
        const tx = await blockchainService.cancelBooking(bookingId, walletAddress);
        
        await Booking.findOneAndUpdate(
            { bookingId },
            { status: 'CANCELLED', updatedAt: new Date() }
        );
        
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

**Step 3: 创建主入口 index.js**

```javascript
// backend/src/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const propertiesRouter = require('./routes/properties');
const bookingsRouter = require('./routes/bookings');
const blockchainService = require('./services/blockchainService');
const EventListener = require('./services/eventListener');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/properties', propertiesRouter);
app.use('/api/bookings', bookingsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start Indexer
        const eventListener = new EventListener(blockchainService);
        eventListener.start();
    })
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

**Step 4: Commit**
```bash
git add backend/src/routes/ backend/src/index.js
git commit -m "feat: add API routes and server"
```

### Task 3.5: 进阶 - 后端健壮性增强（可选）

**Files:**
- Modify: `realestate-dapp/backend/src/services/blockchainService.js`
- Modify: `realestate-dapp/backend/src/services/bookingService.js`

**Step 1: 添加自动重试机制（指数退避）**
```javascript
// 自动重试机制
async function callWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000;
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

**Step 2: 添加 MongoDB 事务支持**
```javascript
async function bookWithTransaction(propertyId, startDate, endDate, amount, userWallet) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const tx = await callWithRetry(() => blockchainService.book(...));
        const booking = await Booking.create([{...}], { session });
        await session.commitTransaction();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

**Step 3: Commit**
```bash
git add backend/src/services/
git commit -m "feat: add retry mechanism and transaction support"
```

---

## 阶段四：前端开发

### Task 4.1: 创建钱包上下文

**Files:**
- Create: `frontend/src/context/WalletContext.jsx`

**Step 1: 编写 WalletContext**

```jsx
// frontend/src/context/WalletContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            setIsConnecting(true);
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const network = await newProvider.getNetwork();
            
            setAccount(accounts[0]);
            setProvider(newProvider);
            setChainId(Number(network.chainId));
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setChainId(null);
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0] || null);
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, []);

    return (
        <WalletContext.Provider value={{ 
            account, 
            provider, 
            chainId, 
            isConnecting, 
            connectWallet, 
            disconnectWallet 
        }}>
            {children}
        </WalletContext.Provider>
    );
};
```

**Step 2: Commit**
```bash
git add frontend/src/context/WalletContext.jsx
git commit -m "feat: add wallet context"
```

---

### Task 4.2: 创建 PropertyList 页面

**Files:**
- Create: `frontend/src/pages/PropertyList.jsx`

**Step 1: 编写 PropertyList**

```jsx
// frontend/src/pages/PropertyList.jsx
import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, Text, Image, Button, Title, Loader, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/properties');
            setProperties(response.data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">Browse Properties</Title>
            
            <Grid>
                {properties.map((property) => (
                    <Grid.Col key={property.propertyId} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                    src={property.imageUrl || 'https://placehold.co/400x300'}
                                    height={200}
                                    alt={property.name}
                                />
                            </Card.Section>

                            <Text fw={500} size="lg" mt="md">
                                {property.name}
                            </Text>
                            
                            <Text size="sm" c="dimmed" mt="xs">
                                {property.location}
                            </Text>
                            
                            <Text size="sm" mt="xs">
                                {property.description?.substring(0, 100)}...
                            </Text>
                            
                            <Text fw={700} size="xl" mt="md" c="blue">
                                {ethers.formatEther(property.price)} ETH
                            </Text>

                            <Button 
                                fullWidth 
                                mt="md" 
                                onClick={() => navigate(`/property/${property.propertyId}`)}
                            >
                                View Details
                            </Button>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
        </Container>
    );
};

export default PropertyList;
```

**Step 2: Commit**
```bash
git add frontend/src/pages/PropertyList.jsx
git commit -m "feat: add property list page"
```

---

### Task 4.3: 创建 PropertyDetail 页面

**Files:**
- Create: `frontend/src/pages/PropertyDetail.jsx`

**Step 1: 编写 PropertyDetail**

```jsx
// frontend/src/pages/PropertyDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Card, Image, Text, Button, Title, Loader, Center, Badge, Group, TextInput, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { ethers } from 'ethers';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { CONTRACT_CONFIG } from '../config/contracts';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { account, provider, connectWallet } = useWallet();
    
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(null);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/properties/${id}`);
            setProperty(response.data);
        } catch (error) {
            console.error('Failed to fetch property:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!account) {
            await connectWallet();
            return;
        }

        if (!dateRange || dateRange.length < 2) {
            alert('Please select date range');
            return;
        }

        try {
            setBooking(true);
            
            const contract = new ethers.Contract(
                CONTRACT_CONFIG.address,
                CONTRACT_CONFIG.abi,
                provider.getSigner()
            );

            const startDate = Math.floor(dateRange[0].getTime() / 1000);
            const endDate = Math.floor(dateRange[1].getTime() / 1000);
            const amount = property.price;

            const tx = await contract.book(id, startDate, endDate, amount, {
                value: amount
            });

            await tx.wait();

            // 保存到后端
            await axios.post('http://localhost:3000/api/bookings', {
                propertyId: parseInt(id),
                startDate: dateRange[0].toISOString(),
                endDate: dateRange[1].toISOString(),
                amount: amount.toString(),
                walletAddress: account,
                txHash: tx.hash
            });

            alert('Booking successful!');
            navigate('/my-bookings');
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Booking failed: ' + error.message);
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    if (!property) {
        return <Container>Property not found</Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Image
                        src={property.imageUrl || 'https://placehold.co/600x400'}
                        radius="md"
                        alt={property.name}
                    />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                        <Group>
                            <Title order={1}>{property.name}</Title>
                            <Badge color={property.isActive ? 'green' : 'red'}>
                                {property.isActive ? 'Available' : 'Unavailable'}
                            </Badge>
                        </Group>

                        <Text size="lg" c="dimmed">{property.location}</Text>
                        
                        <Text>{property.description}</Text>
                        
                        <Text fw={700} size="xl" c="blue">
                            {ethers.formatEther(property.price)} ETH
                        </Text>

                        <DatePickerInput
                            type="range"
                            label="Select dates"
                            placeholder="Check-in to Check-out"
                            value={dateRange}
                            onChange={setDateRange}
                            minDate={new Date()}
                        />

                        <Button 
                            size="lg" 
                            fullWidth 
                            onClick={handleBook}
                            loading={booking}
                            disabled={!property.isActive}
                        >
                            {account ? 'Book Now' : 'Connect Wallet to Book'}
                        </Button>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default PropertyDetail;
```

**Step 2: Commit**
```bash
git add frontend/src/pages/PropertyDetail.jsx
git commit -m "feat: add property detail page with booking"
```

---

### Task 4.4: 创建 MyBookings 页面

**Files:**
- Create: `frontend/src/pages/MyBookings.jsx`

**Step 1: 编写 MyBookings**

```jsx
// frontend/src/pages/MyBookings.jsx
import React, { useState, useEffect } from 'react';
import { Container, Title, Card, Text, Badge, Button, Group, Stack, Loader, Center, Grid } from '@mantine/core';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';

const statusColors = {
    PENDING: 'yellow',
    SUCCESS: 'green',
    FAILED: 'red',
    CANCELLED: 'gray',
    COMPLETED: 'blue'
};

const MyBookings = () => {
    const { account } = useWallet();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account) {
            fetchBookings();
        }
    }, [account]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/bookings/user/${account}`);
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        try {
            await axios.post(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
                walletAddress: account
            });
            alert('Booking cancelled!');
            fetchBookings();
        } catch (error) {
            console.error('Cancel failed:', error);
            alert('Cancel failed: ' + error.message);
        }
    };

    const handleMintNFT = async (bookingId) => {
        try {
            await axios.post(`http://localhost:3000/api/bookings/${bookingId}/mint-nft`, {
                walletAddress: account
            });
            alert('NFT minted!');
            fetchBookings();
        } catch (error) {
            console.error('Mint failed:', error);
            alert('Mint failed: ' + error.message);
        }
    };

    if (!account) {
        return (
            <Container py="xl">
                <Title order={1}>My Bookings</Title>
                <Text c="dimmed" mt="md">Please connect your wallet to view bookings</Text>
            </Container>
        );
    }

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">My Bookings</Title>
            
            {bookings.length === 0 ? (
                <Text c="dimmed">No bookings yet</Text>
            ) : (
                <Grid>
                    {bookings.map((booking) => (
                        <Grid.Col key={booking.bookingId} span={{ base: 12, md: 6 }}>
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text fw={500}>Property #{booking.propertyId}</Text>
                                        <Badge color={statusColors[booking.status]}>
                                            {booking.status}
                                        </Badge>
                                    </Group>
                                    
                                    <Text size="sm">
                                        Check-in: {new Date(booking.startDate * 1000).toLocaleDateString()}
                                    </Text>
                                    <Text size="sm">
                                        Check-out: {new Date(booking.endDate * 1000).toLocaleDateString()}
                                    </Text>
                                    
                                    <Text size="sm" c="dimmed">
                                        TX: {booking.txHash?.substring(0, 10)}...
                                    </Text>

                                    <Group mt="md">
                                        {booking.status === 'SUCCESS' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleMintNFT(booking.bookingId)}
                                            >
                                                Mint NFT
                                            </Button>
                                        )}
                                        
                                        {(booking.status === 'PENDING' || booking.status === 'SUCCESS') && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                color="red"
                                                onClick={() => handleCancel(booking.bookingId)}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default MyBookings;
```

**Step 2: Commit**
```bash
git add frontend/src/pages/MyBookings.jsx
git commit -m "feat: add my bookings page"
```

---

### Task 4.5: 创建 App.jsx 主组件

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: 编写 App.jsx**

```jsx
// frontend/src/App.jsx
import React from 'react';
import { MantineProvider, AppShell, Burger, Group, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import MyBookings from './pages/MyBookings';

const Header = () => {
    const { account, connectWallet, disconnectWallet } = useWallet();
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
                <Group>
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    <Text fw={700} size="lg" component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        RealEstate DApp
                    </Text>
                </Group>

                <Group gap="sm">
                    <Button 
                        component={Link} 
                        to="/" 
                        variant="subtle"
                    >
                        Properties
                    </Button>
                    <Button 
                        component={Link} 
                        to="/my-bookings" 
                        variant="subtle"
                    >
                        My Bookings
                    </Button>
                    
                    {account ? (
                        <Button onClick={disconnectWallet} variant="outline">
                            {account.substring(0, 6)}...{account.substring(38)}
                        </Button>
                    ) : (
                        <Button onClick={connectWallet}>
                            Connect Wallet
                        </Button>
                    )}
                </Group>
            </Group>
        </AppShell.Header>
    );
};

function App() {
    return (
        <WalletProvider>
            <MantineProvider>
                <BrowserRouter>
                    <AppShell header={{ height: 60 }}>
                        <Header />
                        <AppShell.Main>
                            <Routes>
                                <Route path="/" element={<PropertyList />} />
                                <Route path="/property/:id" element={<PropertyDetail />} />
                                <Route path="/my-bookings" element={<MyBookings />} />
                            </Routes>
                        </AppShell.Main>
                    </AppShell>
                </BrowserRouter>
            </MantineProvider>
        </WalletProvider>
    );
}

export default App;
```

**Step 2: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: add main App component with routing"
```

### Task 4.6: 进阶 - 前端 UX 优化（可选）

**Files:**
- Modify: `frontend/src/pages/PropertyDetail.jsx`
- Modify: `frontend/src/pages/MyBookings.jsx`

**Step 1: 日历控件禁用已预订日期**
```jsx
// PropertyDetail.jsx - 获取已预订日期并禁用
const [disabledDates, setDisabledDates] = useState([]);

useEffect(() => {
    fetchBookedDates(propertyId).then(dates => {
        setDisabledDates(dates.map(d => new Date(d * 1000)));
    });
}, [propertyId]);

<DatePickerInput
    disabledDates={(date) => disabledDates.some(d => d.getTime() === date.getTime())}
    // ...
/>
```

**Step 2: NFT 展示 OpenSea 链接**
```jsx
// MyBookings.jsx - 添加 OpenSea 链接
const openSeaUrl = `https://testnets.opensea.io/assets/sepolia/${CONTRACT_ADDRESS}/${tokenId}`;

<Button 
    component="a" 
    href={openSeaUrl} 
    target="_blank"
    variant="link"
>
    View on OpenSea
</Button>
```

**Step 3: 交易状态反馈优化**
```jsx
// 添加清晰的状态提示
const [txStatus, setTxStatus] = useState('idle'); // idle, pending, success, failed

{txStatus === 'pending' && <Loader size="sm" />}
{txStatus === 'success' && <Text c="green">Transaction confirmed!</Text>}
{txStatus === 'failed' && <Text c="red">Transaction failed: {errorMessage}</Text>}
```

**Step 4: Commit**
```bash
git add frontend/src/pages/
git commit -m "feat: add UX optimizations"
```

---

## 阶段五：集成测试

### Task 5.1: 启动本地测试环境

**Step 1: 启动 MongoDB**
```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或本地安装 MongoDB
mongod
```

**Step 2: 启动 Hardhat 节点**
```bash
cd contracts
npx hardhat node
```

**Step 3: 部署合约**
```bash
# 新终端
npx hardhat run scripts/deploy.js --network localhost
```

**Step 4: 配置后端环境变量**
```bash
cp backend/.env.example backend/.env
# 编辑 .env 填入配置
```

**Step 5: 启动后端**
```bash
cd backend
npm run dev
```

**Step 6: 启动前端**
```bash
cd frontend
npm run dev
```

---

### Task 5.2: 测试完整流程

**测试用例：**
1. 连接钱包
2. 浏览房源列表
3. 查看房源详情
4. 选择日期并预订
5. 确认 MetaMask 交易
6. 查看我的预订
7. 铸造 NFT
8. 取消预订

---

## 阶段六：面试准备

### Task 6.1: 准备演示流程

1. 打开前端页面
2. 展示房源列表
3. 连接钱包
4. 完成一次预订
5. 展示链上交易
6. 展示 MongoDB 数据同步
7. 展示 NFT 铸造

### Task 6.2: 准备面试话术

参考设计文档中的面试话术汇总

---

## 总结

**Plan complete and saved to `docs/plans/2026-03-01-realestate-dapp-implementation-plan.md`.**

**两个执行选项：**

**1. Subagent-Driven (本会话)** - 我为每个任务调度子代理，任务间进行代码审查，快速迭代

**2. Parallel Session (新会话)** - 在新会话中打开，使用 executing-plans，分批执行并设置检查点

你选择哪种方式？