// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

import abi from './abi.json';

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址 (2026-03-01 重置后重新部署)
    address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
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
