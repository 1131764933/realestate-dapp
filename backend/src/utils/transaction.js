/**
 * MongoDB 事务工具
 * 注意：MongoDB 事务需要副本集（replica set）才能正常工作
 * 开发环境如果是单节点，可能需要配置为副本集或跳过事务
 */

const mongoose = require('mongoose');

/**
 * 执行带事务的操作
 * @param {Function} operations - 异步函数， 参数
接收 session * @param {Object} options - 选项
 * @param {number} options.maxTimeMS - 超时时间（毫秒）
 * @returns {Promise<any>} - 操作结果
 */
async function withTransaction(operations, options = {}) {
    const { maxTimeMS = 30000 } = options;
    
    const session = await mongoose.startSession();
    
    try {
        let result;
        
        await session.withTransaction(async () => {
            result = await operations(session);
        }, {
            maxTimeMS
        });
        
        return result;
    } catch (error) {
        // 事务已自动回滚
        console.error('Transaction failed:', error.message);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * 检查是否支持事务
 * @returns {boolean}
 */
function isTransactionSupported() {
    // 检查 MongoDB 连接是否为副本集
    const readyState = mongoose.connection.readyState;
    const isConnected = readyState === 1;
    const isReplicaSet = mongoose.connection.client?.topology?.s?.name?.includes('replica') 
        || mongoose.connection.replicaSet 
        || process.env.MONGODB_REPLICA_SET === 'true';
    
    return isConnected && (isReplicaSet || process.env.MONGODB_TRANSACTIONS_ENABLED === 'true');
}

/**
 * 可选的事务执行函数
 * 如果不支持事务，直接执行操作
 * @param {Function} operations - 异步函数
 * @param {Function} fallback - 无事务时的回退函数
 * @returns {Promise<any>}
 */
async function optionalTransaction(operations, fallback) {
    if (isTransactionSupported()) {
        console.log('Using MongoDB transaction...');
        return withTransaction(operations);
    } else {
        console.log('Transactions not supported, using fallback...');
        return fallback();
    }
}

module.exports = {
    withTransaction,
    isTransactionSupported,
    optionalTransaction
};
