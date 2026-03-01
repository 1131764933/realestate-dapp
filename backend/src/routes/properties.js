const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { getBlockchainService } = require('../services');

// 获取所有房源
router.get('/', async (req, res) => {
    try {
        const blockchainService = getBlockchainService();
        
        if (!blockchainService) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        // 从链上获取房源列表 (propertyId 1-3)
        const properties = [];
        for (let i = 1; i <= 3; i++) {
            try {
                const price = await blockchainService.callContractView('propertyPrice', [i]);
                const isActive = await blockchainService.callContractView('propertyActive', [i]);
                
                if (price > 0n) {
                    properties.push({
                        propertyId: i,
                        price: price.toString(),
                        isActive,
                        name: `Property #${i}`,
                        description: `Luxury property #${i} in downtown`,
                        location: 'New York, USA',
                        imageUrl: `https://picsum.photos/seed/${i}/400/300`
                    });
                }
            } catch (e) {
                console.log(`Property ${i} not found`);
            }
        }
        
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单个房源
router.get('/:id', async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const blockchainService = getBlockchainService();
        
        if (!blockchainService) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        // 从链上获取价格和激活状态
        const price = await blockchainService.callContractView('propertyPrice', [propertyId]);
        const isActive = await blockchainService.callContractView('propertyActive', [propertyId]);
        
        // 构建返回对象
        const property = {
            propertyId,
            price: price.toString(),
            isActive,
            name: `Property #${propertyId}`,
            description: `Luxury property #${propertyId} in downtown. This is a beautiful real estate property with modern amenities.`,
            location: 'New York, USA',
            imageUrl: `https://picsum.photos/seed/${propertyId}/600/400`
        };
        
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取房源的已预订日期
router.get('/:id/booked-dates', async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const Booking = require('../models/Booking');
        
        // 从 MongoDB 获取该房源的预订
        const bookings = await Booking.find({ 
            propertyId,
            status: { $in: ['PENDING', 'SUCCESS'] }
        });
        
        // 提取所有已预订的日期
        const bookedDates = [];
        bookings.forEach(booking => {
            const start = new Date(booking.startDate * 1000);
            const end = new Date(booking.endDate * 1000);
            
            for (let d = start; d < end; d.setDate(d.getDate() + 1)) {
                bookedDates.push(Math.floor(d.getTime() / 1000));
            }
        });
        
        res.json(bookedDates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建房源（仅 Owner）
router.post('/', async (req, res) => {
    try {
        const { propertyId, name, description, imageUrl, location, price } = req.body;
        const blockchainService = getBlockchainService();
        
        if (!blockchainService) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        // 链上添加房源
        const priceWei = BigInt(price);
        await blockchainService.callContractMethod('addProperty', [propertyId, priceWei]);
        
        // 链下存储详情
        const property = await Property.create({
            propertyId,
            name,
            description,
            imageUrl,
            location,
            price: priceWei,
            owner: process.env.OWNER_ADDRESS
        });
        
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 收藏房源
router.post('/:id/favorite', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const propertyId = parseInt(req.params.id);
        
        const User = require('../models/User');
        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            { $addToSet: { favorites: propertyId } },
            { new: true, upsert: true }
        );
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
