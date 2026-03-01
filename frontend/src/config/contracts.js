// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

import abi from './abi.json';

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址 (2026-03-01 更新)
    address: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
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
