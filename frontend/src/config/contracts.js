// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

import abiData from './abi.json';

// 提取 abi 数组
const abi = abiData.abi || abiData;

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址 (2026-03-02 Gas 优化 - BitMap)
    address: '0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07',
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
