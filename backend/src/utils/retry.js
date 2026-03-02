/**
 * 重试机制工具
 * 使用指数退避策略进行重试
 */

/**
 * 带指数退避的重试函数
 * @param {Function} fn - 要执行的异步函数
 * @param {number} maxRetries - 最大重试次数（默认3次）
 * @param {number} initialDelay - 初始延迟（毫秒，默认1000ms）
 * @param {Function} shouldRetry - 可选：判断是否应该重试的函数
 * @returns {Promise<any>} - 函数执行结果
 */
async function callWithRetry(fn, maxRetries = 3, initialDelay = 1000, shouldRetry = null) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // 如果有自定义重试判断函数，执行它
            if (shouldRetry && !shouldRetry(error)) {
                console.log(`Non-retryable error: ${error.message}`);
                throw error;
            }
            
            // 如果是最后一次尝试，不再重试
            if (i === maxRetries - 1) {
                break;
            }
            
            // 计算延迟时间（指数退避）：1s, 2s, 4s...
            const delay = initialDelay * Math.pow(2, i);
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms - Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // 所有重试都失败，抛出最后一个错误
    throw lastError;
}

/**
 * 判断区块链错误是否应该重试
 * @param {Error} error - 错误对象
 * @returns {boolean} - 是否应该重试
 */
function shouldRetryOnBlockchainError(error) {
    const message = error.message?.toLowerCase() || '';
    
    // 网络相关错误应该重试
    const networkErrors = [
        'network',
        'connection',
        'timeout',
        'request',
        'socket',
        'econnreset',
        'etimedout',
        'nonce',
        'replacement'
    ];
    
    // 如果包含网络相关关键词，重试
    if (networkErrors.some(e => message.includes(e))) {
        return true;
    }
    
    // 如果是区块链特有的临时错误（如 gas 不足以外的错误）
    // 不重试：gas 不足、权限问题、参数错误等明确性错误
    const nonRetryableErrors = [
        'insufficient gas',
        'gas required',
        'underpriced',
        'nonce too low',
        'nonce too high',
        'invalid signature',
        'unauthorized',
        'access denied',
        'invalid parameter',
        'revert',
        'execution reverted'
    ];
    
    if (nonRetryableErrors.some(e => message.includes(e))) {
        return false;
    }
    
    // 其他未知错误，默认重试
    return true;
}

/**
 * 带区块链重试逻辑的调用
 * @param {Function} fn - 要执行的异步函数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<any>}
 */
async function callWithBlockchainRetry(fn, maxRetries = 3) {
    return callWithRetry(fn, maxRetries, 1000, shouldRetryOnBlockchainError);
}

module.exports = {
    callWithRetry,
    shouldRetryOnBlockchainError,
    callWithBlockchainRetry
};
