const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// 简单的硬编码配置（用于测试）
const CONTRACT_ADDRESS = '0x851356ae760d987E095750cCeb3bC6014560891C';
const RPC_URL = 'http://localhost:8545';

const ABI = [
    "function propertyPrice(uint256) view returns (uint256)",
    "function propertyActive(uint256) view returns (bool)"
];

// 获取所有房源
router.get('/', async (req, res) => {
    try {
        const { ethers } = require('ethers');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        
        const properties = [];
        
        for (let i = 1; i <= 3; i++) {
            try {
                const price = await contract.propertyPrice(i);
                const isActive = await contract.propertyActive(i);
                
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
                console.log(`Property ${i} error:`, e.message);
            }
        }
        
        console.log('Returning properties:', properties.length);
        res.json(properties);
    } catch (error) {
        console.error('Error getting properties:', error);
        res.status(500).json({ error: error.message });
    }
});

// 获取单个房源
router.get('/:id', async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const { ethers } = require('ethers');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        
        const price = await contract.propertyPrice(propertyId);
        const isActive = await contract.propertyActive(propertyId);
        
        res.json({
            propertyId,
            price: price.toString(),
            isActive,
            name: `Property #${propertyId}`,
            description: `Luxury property #${propertyId} in downtown. This is a beautiful real estate property with modern amenities.`,
            location: 'New York, USA',
            imageUrl: `https://picsum.photos/seed/${propertyId}/600/400`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
