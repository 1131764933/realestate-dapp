const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { getBlockchainService } = require('../services/index');
const { ethers } = require('ethers');

// 区块链配置
const CONTRACT_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const RPC_URL = 'http://localhost:8545';

const BOOKING_ABI = [
    "function getBooking(uint256 bookingId) view returns (address user, uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount, uint8 status)",
    "function bookingCount() view returns (uint256)"
];

// 同步所有 bookings 从区块链到数据库
router.post('/sync-from-chain', async (req, res) => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, BOOKING_ABI, provider);
        
        const count = await contract.bookingCount();
        const statusMap = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'];
        
        let synced = 0;
        let errors = 0;
        let cleaned = 0;
        
        // 1. 先同步链上存在的 bookings (1 到 count)
        for (let i = 1; i <= Number(count); i++) {
            try {
                const booking = await contract.getBooking(i);
                const owner = booking.user;
                
                if (owner === '0x0000000000000000000000000000000000000000') {
                    await Booking.findOneAndUpdate(
                        { bookingId: i },
                        { status: 'DELETED', updatedAt: new Date() },
                        { upsert: false }
                    );
                    synced++;
                } else {
                    await Booking.findOneAndUpdate(
                        { bookingId: i },
                        {
                            walletAddress: owner.toLowerCase(),
                            propertyId: Number(booking.propertyId),
                            startDate: Number(booking.startDate),
                            endDate: Number(booking.endDate),
                            amount: booking.amount.toString(),
                            status: statusMap[Number(booking.status)],
                            updatedAt: new Date()
                        },
                        { upsert: true }
                    );
                    synced++;
                }
            } catch (e) {
                errors++;
            }
        }
        
        // 2. 清理链上不存在的 bookings (ID > count)
        // 这些是"幽灵" bookings - 前端保存了但链上交易失败
        const result = await Booking.deleteMany({
            bookingId: { $gt: Number(count) },
            status: { $ne: 'DELETED' }  // 只删除未标记为 DELETED 的
        });
        cleaned = result.deletedCount;
        
        console.log(`Sync complete: synced=${synced}, errors=${errors}, cleaned=${cleaned}`);
        
        res.json({ success: true, synced, errors, cleaned });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 从区块链获取当前预订数量
async function getBookingCount() {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BOOKING_ABI, provider);
    const count = await contract.bookingCount();
    return Number(count); // 转为 Number
}

// 从区块链获取用户的所有预订
async function getAllBookingsFromBlockchain(userAddress) {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BOOKING_ABI, provider);
    
    const bookings = [];
    const userAddr = userAddress.toLowerCase();
    
    // 尝试查询 booking ID 1-100
    for (let i = 1; i <= 100; i++) {
        try {
            const booking = await contract.getBooking(i);
            if (booking.user.toLowerCase() === userAddr && booking.propertyId > 0) {
                bookings.push({
                    bookingId: i,
                    propertyId: Number(booking.propertyId),
                    startDate: Number(booking.startDate),
                    endDate: Number(booking.endDate),
                    amount: booking.amount.toString(),
                    status: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'][Number(booking.status)],
                    walletAddress: booking.user,
                    txHash: ''
                });
            }
        } catch (e) {
            // Booking 不存在，跳过
            if (e.message.includes('execution reverted')) break;
        }
    }
    
    return bookings;
}

// 获取用户的所有预订
router.get('/user/:address', async (req, res) => {
    try {
        const walletAddress = req.params.address.toLowerCase();
        
        // 先从 MongoDB 获取
        let bookings = await Booking.find({ walletAddress }).sort({ createdAt: -1 });
        
        // 标记数据来源
        let source = 'mongodb';
        
        // 如果 MongoDB 为空，从区块链获取
        if (bookings.length === 0) {
            console.log('MongoDB empty, fetching from blockchain for:', walletAddress);
            bookings = await getAllBookingsFromBlockchain(walletAddress);
            source = 'blockchain';
        } else {
            // 转换 BigInt 为字符串
            bookings = bookings.map(b => ({
                ...b.toObject(),
                amount: b.amount?.toString()
            }));
        }
        
        res.json({
            source,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
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
                    propertyId: Number(chainBooking.propertyId),
                    startDate: Number(chainBooking.startDate),
                    endDate: Number(chainBooking.endDate),
                    amount: chainBooking.amount.toString(),
                    status: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED'][Number(chainBooking.status)],
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
        
        // 只使用链上的 booking count，不参考 MongoDB
        const chainCount = await getBookingCount();
        const newBookingId = Number(chainCount) + 1;
        
        console.log(`Creating booking: chainCount=${chainCount}, newId=${newBookingId}`);
        
        const booking = await Booking.create({
            bookingId: newBookingId,
            propertyId,
            startDate: Math.floor(new Date(startDate).getTime() / 1000),
            endDate: Math.floor(new Date(endDate).getTime() / 1000),
            amount: amount.toString(), // 转为字符串存储
            walletAddress: walletAddress.toLowerCase(),
            txHash,
            status: 'PENDING'
        });
        
        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
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
        
        // 注意：区块链交易已经从前端发送，这里只需要更新数据库
        // 已经在链上执行了 cancelBooking，所以直接更新数据库
        
        // 更新数据库
        await Booking.findOneAndUpdate(
            { bookingId },
            { 
                status: 'CANCELLED',
                updatedAt: new Date() 
            }
        );
        
        console.log(`Booking ${bookingId} marked as CANCELLED in database`);
        
        res.json({ 
            success: true, 
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
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
