// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

import abiData from './abi.json';

// 提取 abi 数组
const abi = abiData.abi || abiData;

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址 (2026-03-02 新部署 - 添加 nextTokenId)
    address: '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49',
    network: 'localhost'
};

export const CONTRACT_ABI = abi;

// Booking 状态枚举
export const BOOKING_STATUS = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Cancelled',
    3: 'Completed',
    4: 'Failed'
};
