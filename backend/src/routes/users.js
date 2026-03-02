const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkJwt, optionalJwt, handleAuthError } = require('../middleware/auth');

// 提取 Auth0 ID 的 helper 函数
const getAuth0Id = (req) => {
    // 从 JWT payload 中提取 sub (Auth0 用户 ID)
    return req.auth?.payload?.sub;
};

// GET /me 获取当前用户信息
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        res.json({ 
            success: true, 
            message: 'User authenticated',
            authProvider: 'auth0'
        });
    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /me 用于创建/获取用户
router.post('/me', async (req, res) => {
    try {
        // 从 header 获取 token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        // 简单处理：直接返回成功，不需要解析 token
        // 后续可以扩展为从 Auth0 /userinfo 获取真实用户信息
        res.json({ 
            success: true, 
            message: 'User authenticated',
            authProvider: 'auth0'
        });
    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({ error: error.message });
    }
});

// 关联钱包地址（需要登录）
router.post('/link-wallet', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req);
        const { walletAddress } = req.body;
        
        if (!auth0Id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        
        // 验证钱包地址格式
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }
        
        // 查找用户
        let user = await User.findOne({ auth0Id });
        
        if (!user) {
            // 如果用户不存在，先创建
            user = await User.create({
                auth0Id,
                walletAddress: walletAddress.toLowerCase(),
                email: req.auth?.payload?.email || ''
            });
        } else {
            // 检查钱包地址是否已被其他用户使用
            const existingUser = await User.findOne({ 
                walletAddress: walletAddress.toLowerCase(),
                auth0Id: { $ne: auth0Id }
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    error: 'This wallet address is already linked to another account' 
                });
            }
            
            // 更新用户的钱包地址
            user.walletAddress = walletAddress.toLowerCase();
            if (!user.email && req.auth?.payload?.email) {
                user.email = req.auth.payload.email;
            }
            await user.save();
        }
        
        res.json({ 
            success: true, 
            message: 'Wallet linked successfully',
            user: {
                auth0Id: user.auth0Id,
                email: user.email,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error('Error linking wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

// 解绑钱包地址（需要登录）
router.post('/unlink-wallet', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req);
        
        if (!auth0Id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const user = await User.findOne({ auth0Id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.walletAddress = null;
        await user.save();
        
        res.json({ success: true, message: 'Wallet unlinked successfully' });
    } catch (error) {
        console.error('Error unlinking wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

// 根据钱包地址获取用户信息（公开接口，用于验证）
router.get('/by-wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        const user = await User.findOne({ walletAddress: address.toLowerCase() })
            .select('email favorites points createdAt');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user by wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
