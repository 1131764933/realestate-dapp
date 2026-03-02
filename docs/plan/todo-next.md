# 待完成任务列表

> 记录需要继续完善的功能，按优先级排序

---

## P0 - 重要（必须完成）

### 1. 合约添加 withdraw 函数
**问题**：Owner 无法提取合约中的 ETH

**方案**：
```solidity
function withdraw() external onlyOwner nonReentrant {
    payable(owner()).transfer(address(this).balance);
}
```

**涉及文件**：`contracts/contracts/BookingContract.sol`

---

### 2. EventListener 断点续传
**问题**：节点重启后可能丢失未处理的事件

**方案**：
1. 启动时读取 lastProcessedBlock
2. 先处理 lastProcessedBlock ~ latest 的历史事件
3. 再监听新事件

**涉及文件**：`backend/src/services/eventListener.js`

---

## P1 - 次要（建议完成）

### 3. 前端 tokenURI 实现
**问题**：NFT 铸造后没有元数据

**方案**：实现 tokenURI 函数，返回 IPFS 或基础元数据

**涉及文件**：`contracts/contracts/BookingContract.sol`

---

### 4. User 模型完善
**问题**：User 表功能不完整

**方案**：完善 User 模型的创建和更新逻辑

**涉及文件**：`backend/src/models/User.js`, `backend/src/routes/users.js`

---

## P2 - 可选（文档更新）

### 5. 设计文档更新
**问题**：文档与实际实现不一致

**方案**：更新设计文档中的技术栈描述（wagmi vs ethers.js）

**涉及文件**：`docs/plans/2026-03-01-realestate-dapp-mvp-design.md`

---

## 完成标准

- [ ] withdraw 函数部署到测试网
- [ ] EventListener 支持断点续传并测试
- [ ] tokenURI 返回有效元数据链接
- [ ] User 模型功能完整
- [ ] 设计文档与技术栈一致

---

## 备注

- 项目演示已可用，部分功能可在面试后继续完善
- 面试重点：架构设计、合约安全、链上链下同步

---

*创建时间：2026-03-02*
