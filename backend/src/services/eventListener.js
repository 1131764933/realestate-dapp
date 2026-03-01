const IndexerState = require('../models/IndexerState');
const Booking = require('../models/Booking');
const { ethers } = require('ethers');

/**
 * EventListener - 区块链事件监听器
 * 只监听新事件，自动同步到 MongoDB
 */
class EventListener {
    constructor(contractAddress, rpcUrl, abi) {
        this.contractAddress = contractAddress;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contract = new ethers.Contract(contractAddress, abi, this.provider);
        this.isRunning = false;
        console.log('EventListener created with address:', contractAddress);
    }

    async start() {
        if (this.isRunning) {
            console.log('EventListener already running');
            return;
        }
        
        this.isRunning = true;
        console.log('EventListener started - listening for new events only');
        
        // 监听 BookingCreated - 新预订
        this.contract.on('BookingCreated', async (...args) => {
            const event = args[args.length - 2];
            const log = args[args.length - 1];
            await this.handleBookingCreated(event, log);
        });
        
        // 监听 BookingCancelled - 取消预订
        this.contract.on('BookingCancelled', async (...args) => {
            const event = args[args.length - 2];
            const log = args[args.length - 1];
            await this.handleBookingCancelled(event, log);
        });
        
        // 监听 BookingCompleted - 完成预订
        this.contract.on('BookingCompleted', async (...args) => {
            const event = args[args.length - 2];
            const log = args[args.length - 1];
            await this.handleBookingCompleted(event, log);
        });
        
        console.log('Event listeners registered');
    }

    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.contract.removeAllListeners('BookingCreated');
        this.contract.removeAllListeners('BookingCancelled');
        this.contract.removeAllListeners('BookingCompleted');
        console.log('EventListener stopped');
    }

    // 处理新预订事件
    async handleBookingCreated(event, log) {
        try {
            // ethers v6 事件参数在 args 中
            const args = event.args || log.args;
            if (!args) return;
            
            const { bookingId, user, propertyId, startDate, endDate, amount, status } = args;
            
            const statusMap = {
                0: 'PENDING',
                1: 'CONFIRMED',
                2: 'CANCELLED',
                3: 'COMPLETED',
                4: 'FAILED'
            };
            
            console.log(`[Event] BookingCreated: ID=${bookingId}, User=${user}`);
            
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                {
                    bookingId: Number(bookingId),
                    walletAddress: user.toLowerCase(),
                    propertyId: Number(propertyId),
                    startDate: Number(startDate),
                    endDate: Number(endDate),
                    amount: amount.toString(),
                    status: statusMap[Number(status)] || 'PENDING',
                    txHash: log.transactionHash,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
            
            console.log(`[Synced] Booking ${bookingId} created in DB`);
        } catch (error) {
            console.error('[Error] BookingCreated:', error.message);
        }
    }

    // 处理取消预订事件
    async handleBookingCancelled(event, log) {
        try {
            const args = event.args || log.args;
            if (!args) return;
            
            const { bookingId } = args;
            
            console.log(`[Event] BookingCancelled: ID=${bookingId}`);
            
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                { 
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            );
            
            console.log(`[Synced] Booking ${bookingId} cancelled in DB`);
        } catch (error) {
            console.error('[Error] BookingCancelled:', error.message);
        }
    }

    // 处理完成预订事件
    async handleBookingCompleted(event, log) {
        try {
            const args = event.args || log.args;
            if (!args) return;
            
            const { bookingId } = args;
            
            console.log(`[Event] BookingCompleted: ID=${bookingId}`);
            
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                { 
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            );
            
            console.log(`[Synced] Booking ${bookingId} completed in DB`);
        } catch (error) {
            console.error('[Error] BookingCompleted:', error.message);
        }
    }
}

module.exports = EventListener;
