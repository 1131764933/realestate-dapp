const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const blockchainService = require('../services/blockchainService');

// 获取用户的所有预订
router.get('/user/:address', async (req, res) => {
    try {
        const walletAddress = req.params.address.toLowerCase();
        const bookings = await Booking.find({ walletAddress }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单个预订详情
router.get('/:id', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingId });
        
        if (!booking) {
            // 尝试从链上获取
            try {
                const chainBooking = await blockchainService.getBooking(bookingId);
                res.json({
                    bookingId,
                    propertyId: chainBooking.propertyId,
                    startDate: chainBooking.startDate,
                    endDate: chainBooking.endDate,
                    amount: chainBooking.amount.toString(),
                    status: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'][chainBooking.status],
                    user: chainBooking.user
                });
            } catch {
                return res.status(404).json({ error: 'Booking not found' });
            }
        } else {
            res.json(booking);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建预订（链上 + 链下）
router.post('/', async (req, res) => {
    try {
        const { propertyId, startDate, endDate, amount, walletAddress, txHash } = req.body;
        
        // 链上预订由前端直接调用，这里只记录到数据库
        // 前端会在链上交易成功后调用此 API
        
        const booking = await Booking.create({
            propertyId,
            startDate: Math.floor(new Date(startDate).getTime() / 1000),
            endDate: Math.floor(new Date(endDate).getTime() / 1000),
            amount: BigInt(amount),
            walletAddress: walletAddress.toLowerCase(),
            txHash,
            status: 'PENDING'
        });
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 铸造 NFT
router.post('/:id/mint-nft', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { walletAddress } = req.body;
        
        // 调用合约铸造 NFT
        const tx = await blockchainService.mintNFT(bookingId, walletAddress);
        
        // 更新数据库
        const booking = await Booking.findOneAndUpdate(
            { bookingId },
            { 
                nftTokenId: bookingId, // 简化处理
                updatedAt: new Date() 
            },
            { new: true }
        );
        
        res.json({ 
            success: true, 
            txHash: tx.hash,
            booking 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 取消预订
router.post('/:id/cancel', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { walletAddress } = req.body;
        
        // 调用合约取消
        const tx = await blockchainService.cancelBooking(bookingId, walletAddress);
        
        // 更新数据库
        await Booking.findOneAndUpdate(
            { bookingId },
            { 
                status: 'CANCELLED',
                updatedAt: new Date() 
            }
        );
        
        res.json({ 
            success: true, 
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 完成预订
router.post('/:id/complete', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { walletAddress } = req.body;
        
        // 调用合约完成
        const tx = await blockchainService.completeBooking(bookingId, walletAddress);
        
        // 更新数据库
        await Booking.findOneAndUpdate(
            { bookingId },
            { 
                status: 'COMPLETED',
                updatedAt: new Date() 
            }
        );
        
        res.json({ 
            success: true, 
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
