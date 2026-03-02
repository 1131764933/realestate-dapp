const { ethers } = require('ethers');
const { callWithBlockchainRetry } = require('../utils/retry');

/**
 * BlockchainService - 区块链交互服务
 * 包含重试机制处理网络波动和区块链拥堵
 */
class BlockchainService {
    /**
     * @param {string} contractAddress - 合约地址
     * @param {Array} abi - 合约 ABI
     * @param {string} privateKey - 私钥
     * @param {string} rpcUrl - RPC URL
     */
    constructor(contractAddress, abi, privateKey, rpcUrl) {
        this.contractAddress = contractAddress;
        this.abi = abi;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, abi, this.provider);
    }

    /**
     * 获取带签名器的合约实例
     */
    getSignedContract() {
        return this.contract.connect(this.wallet);
    }

    /**
     * 调用合约写方法
     * @param {string} methodName - 方法名
     * @param {Array} args - 参数
     * @param {Object} options - 选项
     */
    async callContractMethod(methodName, args, options = {}) {
        const contract = this.getSignedContract();
        const tx = await contract[methodName](...args, options);
        return await tx.wait();
    }

    /**
     * 调用合约读方法
     * @param {string} methodName - 方法名
     * @param {Array} args - 参数
     */
    async callContractView(methodName, args) {
        return await this.contract[methodName](...args);
    }

    /**
     * 预订房源（带重试机制）
     */
    async book(propertyId, startDate, endDate, amount, fromAddress) {
        return callWithBlockchainRetry(async () => {
            const contract = this.getSignedContract();
            const tx = await contract.book(propertyId, startDate, endDate, amount, {
                from: fromAddress,
                value: amount
            });
            return await tx.wait();
        }, 3);
    }

    /**
     * 取消预订（带重试机制）
     */
    async cancelBooking(bookingId, fromAddress) {
        return callWithBlockchainRetry(async () => {
            const contract = this.getSignedContract();
            const tx = await contract.cancelBooking(bookingId, { from: fromAddress });
            return await tx.wait();
        }, 3);
    }

    /**
     * 完成预订（带重试机制）
     */
    async completeBooking(bookingId, fromAddress) {
        return callWithBlockchainRetry(async () => {
            const contract = this.getSignedContract();
            const tx = await contract.completeBooking(bookingId, { from: fromAddress });
            return await tx.wait();
        }, 3);
    }

    /**
     * 铸造 NFT（带重试机制）
     */
    async mintNFT(bookingId, fromAddress) {
        return callWithBlockchainRetry(async () => {
            const contract = this.getSignedContract();
            
            // 先查询当前 tokenId 数量
            const startTokenId = await contract.nextTokenId();
            
            const tx = await contract.mintBookingNFT(fromAddress, bookingId, { from: fromAddress });
            const receipt = await tx.wait();
            
            // 查询新的 tokenId
            const endTokenId = await contract.nextTokenId();
            const tokenId = endTokenId - 1n;
            
            return {
                receipt,
                tokenId: Number(tokenId)
            };
        }, 3);
    }

    /**
     * 获取预订详情
     */
    async getBooking(bookingId) {
        return await this.contract.getBooking(bookingId);
    }

    /**
     * 获取房源价格
     */
    async getPropertyPrice(propertyId) {
        return await this.contract.propertyPrice(propertyId);
    }

    /**
     * 获取房源激活状态
     */
    async isPropertyActive(propertyId) {
        return await this.contract.propertyActive(propertyId);
    }

    /**
     * 获取合约余额
     */
    async getBalance() {
        return await this.provider.getBalance(this.contractAddress);
    }

    /**
     * 获取当前区块号
     */
    async getBlockNumber() {
        return await this.provider.getBlockNumber();
    }
}

module.exports = BlockchainService;
