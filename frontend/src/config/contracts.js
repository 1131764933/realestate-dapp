// 前端合约配置
// 部署后从 contracts/deployment.json 获取地址

export const CONTRACT_CONFIG = {
    // 本地测试网部署地址
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    network: 'localhost'
};

export const CONTRACT_ABI = [
    // BookingStatus 枚举
    "function propertyPrice(uint256) view returns (uint256)",
    "function propertyActive(uint256) view returns (bool)",
    "function propertyDateBooked(uint256, uint256) view returns (bool)",
    "function bookings(uint256) view returns (address user, uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount, uint8 status)",
    "function bookingPayments(uint256) view returns (uint256)",
    "function bookingToNFT(uint256) view returns (uint256)",
    "function nftToBooking(uint256) view returns (uint256)",
    
    // Owner 函数
    "function addProperty(uint256 propertyId, uint256 price)",
    "function setPropertyPrice(uint256 propertyId, uint256 price)",
    "function activateProperty(uint256 propertyId)",
    "function deactivateProperty(uint256 propertyId)",
    "function withdraw()",
    
    // 用户函数
    "function book(uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount) payable",
    "function cancelBooking(uint256 bookingId)",
    "function completeBooking(uint256 bookingId)",
    "function mintBookingNFT(address to, uint256 bookingId)",
    
    // 查询函数
    "function propertyExists(uint256 propertyId) view returns (bool)",
    "function overlapBooking(uint256 propertyId, uint256 startDate, uint256 endDate) view returns (bool)",
    "function getBooking(uint256 bookingId) view returns (tuple(address user, uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount, uint8 status))",
    "function tokenURI(uint256 tokenId) view returns (string)",
    
    // 事件
    "event BookingCreated(uint256 indexed bookingId, address indexed user, uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount, uint8 status)",
    "event BookingCancelled(uint256 indexed bookingId, address indexed user, uint8 status)",
    "event BookingCompleted(uint256 indexed bookingId, address indexed user, uint8 status)",
    "event NFTMinted(uint256 indexed bookingId, uint256 indexed tokenId, address indexed to)",
    "event PropertyAdded(uint256 indexed propertyId, uint256 price)"
];

// Booking 状态枚举
export const BOOKING_STATUS = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Cancelled',
    3: 'Completed',
    4: 'Failed'
};
