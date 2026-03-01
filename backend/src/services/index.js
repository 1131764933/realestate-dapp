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
    
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    
    if (!contractAddress || !privateKey) {
        console.log('BlockchainService not initialized (missing CONTRACT_ADDRESS or PRIVATE_KEY)');
        return null;
    }
    
    // 完整的 ABI
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
        "event BookingCreated(uint256, address, uint256, uint256, uint256, uint256, uint8)",
        "event BookingCancelled(uint256, address, uint8)",
        "event BookingCompleted(uint256, address, uint8)",
        "event PropertyAdded(uint256, uint256)"
    ];
    
    const BlockchainService = require('./blockchainService');
    blockchainService = new BlockchainService(contractAddress, abi, privateKey, rpcUrl);
    console.log('BlockchainService initialized');
    
    // 启动 EventListener
    const EventListener = require('./eventListener');
    eventListener = new EventListener(blockchainService);
    eventListener.start().catch(err => {
        console.error('EventListener failed to start:', err.message);
    });
    
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
