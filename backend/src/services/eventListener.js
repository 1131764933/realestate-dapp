const IndexerState = require('../models/IndexerState');
const Booking = require('../models/Booking');

/**
 * EventListener - 区块链事件监听器 (Indexer)
 * 监听合约事件并同步到 MongoDB
 */
class EventListener {
    constructor(blockchainService) {
        this.provider = blockchainService.provider;
        this.contract = blockchainService.contract;
        this.isRunning = false;
    }

    /**
     * 启动事件监听
     */
    async start() {
        if (this.isRunning) {
            console.log('EventListener already running');
            return;
        }
        
        this.isRunning = true;
        console.log('Indexer started...');
        
        try {
            // 处理历史事件
            await this.processPastEvents();
            
            // 监听新事件
            this.contract.on('BookingCreated', this.handleBookingCreated.bind(this));
            this.contract.on('BookingCancelled', this.handleBookingCancelled.bind(this));
            this.contract.on('BookingCompleted', this.handleBookingCompleted.bind(this));
            this.contract.on('PropertyAdded', this.handlePropertyAdded.bind(this));
            
            console.log('Event listeners registered');
        } catch (error) {
            console.error('Failed to start EventListener:', error);
            this.isRunning = false;
        }
    }

    /**
     * 停止事件监听
     */
    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.contract.removeAllListeners('BookingCreated');
        this.contract.removeAllListeners('BookingCancelled');
        this.contract.removeAllListeners('BookingCompleted');
        this.contract.removeAllListeners('PropertyAdded');
        console.log('Indexer stopped');
    }

    /**
     * 处理历史事件（断点续传）
     */
    async processPastEvents() {
        const lastBlock = await this.getLastProcessedBlock();
        const latestBlock = await this.provider.getBlockNumber();
        
        console.log(`Processing events from block ${lastBlock} to ${latestBlock}`);
        
        // 从上次区块+1开始处理
        const fromBlock = lastBlock + 1;
        
        if (fromBlock > latestBlock) {
            console.log('No new blocks to process');
            return;
        }
        
        // 查询历史事件
        try {
            const createdEvents = await this.contract.queryFilter(
                'BookingCreated', fromBlock, latestBlock
            );
            
            for (const event of createdEvents) {
                await this.handleBookingCreated(event);
            }

            const cancelledEvents = await this.contract.queryFilter(
                'BookingCancelled', fromBlock, latestBlock
            );
            
            for (const event of cancelledEvents) {
                await this.handleBookingCancelled(event);
            }

            const completedEvents = await this.contract.queryFilter(
                'BookingCompleted', fromBlock, latestBlock
            );
            
            for (const event of completedEvents) {
                await this.handleBookingCompleted(event);
            }
            
            // 更新处理的区块号
            await this.updateLastProcessedBlock(latestBlock);
            console.log(`Processed ${createdEvents.length} BookingCreated events`);
        } catch (error) {
            console.error('Error processing past events:', error);
        }
    }

    /**
     * 获取上次处理的区块号
     */
    async getLastProcessedBlock() {
        let state = await IndexerState.findOne({ name: 'default' });
        if (!state) {
            state = await IndexerState.create({ 
                name: 'default', 
                lastProcessedBlock: 0 
            });
        }
        return state.lastProcessedBlock;
    }

    /**
     * 更新处理的区块号
     */
    async updateLastProcessedBlock(blockNumber) {
        await IndexerState.findOneAndUpdate(
            { name: 'default' },
            { 
                lastProcessedBlock: blockNumber,
                updatedAt: new Date()
            }
        );
    }

    /**
     * 处理 BookingCreated 事件
     */
    async handleBookingCreated(event) {
        const { bookingId, user, propertyId, startDate, endDate, amount, status } = event.args;
        
        console.log(`BookingCreated: bookingId=${bookingId}, user=${user}, propertyId=${propertyId}`);
        
        const statusMap = {
            0: 'PENDING',
            1: 'SUCCESS',
            2: 'CANCELLED',
            3: 'COMPLETED',
            4: 'FAILED'
        };
        
        try {
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                {
                    bookingId: Number(bookingId),
                    walletAddress: user.toLowerCase(),
                    propertyId: Number(propertyId),
                    startDate: Number(startDate),
                    endDate: Number(endDate),
                    amount: BigInt(amount),
                    status: statusMap[Number(status)],
                    txHash: event.log.transactionHash,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );

            // 更新索引器状态
            await this.updateLastProcessedBlock(event.blockNumber);
        } catch (error) {
            console.error('Error handling BookingCreated:', error);
        }
    }

    /**
     * 处理 BookingCancelled 事件
     */
    async handleBookingCancelled(event) {
        const { bookingId, status } = event.args;
        console.log(`BookingCancelled: bookingId=${bookingId}`);
        
        try {
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                { 
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            );
            
            await this.updateLastProcessedBlock(event.blockNumber);
        } catch (error) {
            console.error('Error handling BookingCancelled:', error);
        }
    }

    /**
     * 处理 BookingCompleted 事件
     */
    async handleBookingCompleted(event) {
        const { bookingId, status } = event.args;
        console.log(`BookingCompleted: bookingId=${bookingId}`);
        
        try {
            await Booking.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                { 
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            );
            
            await this.updateLastProcessedBlock(event.blockNumber);
        } catch (error) {
            console.error('Error handling BookingCompleted:', error);
        }
    }

    /**
     * 处理 PropertyAdded 事件
     */
    async handlePropertyAdded(event) {
        const { propertyId, price } = event.args;
        console.log(`PropertyAdded: propertyId=${propertyId}, price=${price}`);
        
        // 可以在这里同步房源数据到 MongoDB
        // 目前房源数据存储在链上，通过前端查询
    }
}

module.exports = EventListener;
