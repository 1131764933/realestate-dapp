// 服务实例导出
require('dotenv').config();
let blockchainService = null;
let eventListener = null;

function initBlockchainService() {
    const { ethers } = require('ethers');
    
    console.log('Initializing BlockchainService...');
    console.log('CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS);
    console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'set' : 'missing');
    console.log('RPC_URL:', process.env.RPC_URL);
    
    const contractAddress = process.env.CONTRACT_ADDRESS || '0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07';
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    
    // 完整的 ABI（包含事件和 nextTokenId）
    const abi = [
        "function propertyPrice(uint256) view returns (uint256)",
        "function propertyActive(uint256) view returns (bool)",
        "function getBooking(uint256) view returns (address, uint256, uint256, uint256, uint256, uint8)",
        "function propertyExists(uint256) view returns (bool)",
        "function addProperty(uint256, uint256)",
        "function book(uint256, uint256, uint256, uint256) payable",
        "function cancelBooking(uint256)",
        "function completeBooking(uint256)",
        "function mintBookingNFT(address, uint256)",
        "function bookingCount() view returns (uint256)",
        "function nextTokenId() view returns (uint256)",
        "event BookingCreated(uint256, address, uint256, uint256, uint256, uint256, uint8)",
        "event BookingCancelled(uint256, address, uint8)",
        "event BookingCompleted(uint256, address, uint8)",
        "event PropertyAdded(uint256, uint256)",
        "event NFTMinted(uint256, uint256, address)"
    ];
    
    // 创建 provider（只读）
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 如果有私钥，创建带签名的服务
    if (contractAddress && privateKey) {
        const BlockchainService = require('./blockchainService');
        blockchainService = new BlockchainService(contractAddress, abi, privateKey, rpcUrl);
        console.log('BlockchainService initialized with signer');
    } else {
        console.log('BlockchainService not initialized (missing PRIVATE_KEY)');
    }
    
    // 启动 EventListener - 只监听新事件
    try {
        const EventListener = require('./eventListener');
        eventListener = new EventListener(contractAddress, rpcUrl, abi);
        eventListener.start().catch(err => {
            console.error('EventListener failed to start:', err.message);
        });
    } catch (error) {
        console.error('Failed to start EventListener:', error);
    }
    
    return blockchainService;
}

function getBlockchainService() {
    return blockchainService;
}

function getEventListener() {
    return eventListener;
}

module.exports = {
    initBlockchainService,
    getBlockchainService,
    getEventListener
};
