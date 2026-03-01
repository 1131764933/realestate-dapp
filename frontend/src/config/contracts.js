// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

import abi from './abi.json';

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址 (2026-03-02 NFT tokenURI 更新)
    address: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
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
