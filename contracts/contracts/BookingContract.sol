// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BookingContract
 * @dev 房地产预订合约，支持预订、NFT铸造、状态管理
 */
contract BookingContract is ERC721URIStorage, Ownable, ReentrancyGuard {

    // ============ 状态枚举 ============
    enum BookingStatus {
        Pending,    // 待确认
        Confirmed,  // 已确认
        Cancelled,  // 已取消
        Completed,  // 已完成
        Failed      // 失败
    }

    // ============ 数据结构 ============
    struct Booking {
        address user;          // 预订用户地址
        uint256 propertyId;    // 房源 ID
        uint256 startDate;     // 预订开始时间戳
        uint256 endDate;       // 预订结束时间戳
        uint256 amount;        // 预订金额（wei）
        BookingStatus status;   // 预订状态
    }

    // ============ 状态变量 ============
    uint256 private _nextBookingId;
    uint256 private _nextTokenId;

    // propertyId => 价格
    mapping(uint256 => uint256) public propertyPrice;
    // propertyId => 激活状态
    mapping(uint256 => bool) public propertyActive;
    // propertyId => (date => 是否已预订)
    mapping(uint256 => mapping(uint256 => bool)) public propertyDateBooked;
    // bookingId => Booking 详情
    mapping(uint256 => Booking) public bookings;
    // bookingId => 实际支付金额
    mapping(uint256 => uint256) public bookingPayments;
    // bookingId => NFT TokenId
    mapping(uint256 => uint256) public bookingToNFT;
    // TokenId => bookingId
    mapping(uint256 => uint256) public nftToBooking;

    // ============ 事件 ============
    event BookingCreated(
        uint256 indexed bookingId,
        address indexed user,
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount,
        BookingStatus status
    );

    event BookingCancelled(
        uint256 indexed bookingId,
        address indexed user,
        BookingStatus status
    );

    event BookingCompleted(
        uint256 indexed bookingId,
        address indexed user,
        BookingStatus status
    );

    event NFTMinted(
        uint256 indexed bookingId,
        uint256 indexed tokenId,
        address indexed to
    );

    event PropertyAdded(
        uint256 indexed propertyId,
        uint256 price
    );

    // ============ 构造函数 ============
    constructor() ERC721("RealEstateBooking", "REB") Ownable() {
        _nextBookingId = 1;
        _nextTokenId = 1;
    }

    // ============ Owner 函数 ============

    /**
     * @notice 添加房源
     * @param propertyId 房源 ID
     * @param price 房源价格（wei）
     */
    function addProperty(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] == 0, "Property already exists");
        require(price > 0, "Price must be greater than 0");
        
        propertyPrice[propertyId] = price;
        propertyActive[propertyId] = true;
        
        emit PropertyAdded(propertyId, price);
    }

    /**
     * @notice 修改房源价格
     */
    function setPropertyPrice(uint256 propertyId, uint256 price) external onlyOwner {
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        propertyPrice[propertyId] = price;
    }

    /**
     * @notice 激活房源
     */
    function activateProperty(uint256 propertyId) external onlyOwner {
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        propertyActive[propertyId] = true;
    }

    /**
     * @notice 下架房源
     */
    function deactivateProperty(uint256 propertyId) external onlyOwner {
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        propertyActive[propertyId] = false;
    }

    /**
     * @notice 提现合约中的 ETH
     */
    function withdraw() external onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ 用户函数 ============

    /**
     * @notice 预订房源
     * @param propertyId 房源 ID
     * @param startDate 预订开始时间戳
     * @param endDate 预订结束时间戳
     * @param amount 预订金额
     */
    function book(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount
    ) external payable nonReentrant {
        // 1. 预订开始时间有效性约束
        require(startDate > block.timestamp, "Start date must be after current block time");

        // 2. 日期区间有效性约束
        require(endDate > startDate, "End date must be after start date");

        // 3. 房源有效性约束
        require(propertyPrice[propertyId] > 0, "Property does not exist");
        require(propertyActive[propertyId], "Property is not active");

        // 4. 无重叠预订约束
        require(!overlapBooking(propertyId, startDate, endDate), "Booking time overlaps with existing one");

        // 5. 金额一致性约束
        require(amount == propertyPrice[propertyId], "Booking amount does not match property price");

        // 6. 支付金额有效性约束
        require(msg.value >= amount, "Sent value is less than booking amount");

        // 7. 创建预订记录
        uint256 bookingId = _nextBookingId++;
        bookingPayments[bookingId] = msg.value;

        // 标记日期已预订
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            propertyDateBooked[propertyId][d] = true;
        }

        bookings[bookingId] = Booking({
            user: msg.sender,
            propertyId: propertyId,
            startDate: startDate,
            endDate: endDate,
            amount: amount,
            status: BookingStatus.Pending
        });

        // 8. 退还多余的 ETH
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }

        // 9. 触发事件
        emit BookingCreated(
            bookingId,
            msg.sender,
            propertyId,
            startDate,
            endDate,
            amount,
            BookingStatus.Pending
        );
    }

    /**
     * @notice 取消预订
     */
    function cancelBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];

        // 权限校验
        require(booking.user == msg.sender, "Not booking owner");

        // 状态校验
        require(
            booking.status == BookingStatus.Pending || 
            booking.status == BookingStatus.Confirmed,
            "Cannot cancel this booking"
        );

        // 更新状态
        booking.status = BookingStatus.Cancelled;

        // 释放预订日期
        releaseBookingDates(booking.propertyId, booking.startDate, booking.endDate);

        emit BookingCancelled(bookingId, msg.sender, BookingStatus.Cancelled);
    }

    /**
     * @notice 完成预订
     */
    function completeBooking(uint256 bookingId) external nonReentrant {
        Booking storage booking = bookings[bookingId];

        // 权限校验
        require(booking.user == msg.sender, "Not booking owner");

        // 状态校验
        require(booking.status == BookingStatus.Confirmed, "Cannot complete this booking");

        // 时间校验
        require(block.timestamp > booking.endDate, "Booking has not ended yet");

        // 更新状态
        booking.status = BookingStatus.Completed;

        emit BookingCompleted(bookingId, msg.sender, BookingStatus.Completed);
    }

    /**
     * @notice 铸造预订 NFT
     */
    function mintBookingNFT(address to, uint256 bookingId) external nonReentrant {
        // 权限校验：仅预订所有者可铸造
        require(bookings[bookingId].user == msg.sender, "Not booking owner");

        // 生成唯一 NFT ID
        uint256 tokenId = _nextTokenId++;

        // 铸造 NFT
        _safeMint(to, tokenId);

        // 关联预订 ID 与 NFT ID
        bookingToNFT[bookingId] = tokenId;
        nftToBooking[tokenId] = bookingId;

        // 设置 tokenURI
        _setTokenURI(tokenId, tokenURI(tokenId));

        emit NFTMinted(bookingId, tokenId, to);
    }

    // ============ 查询函数 ============

    /**
     * @notice 查询房源是否存在
     */
    function propertyExists(uint256 propertyId) public view returns (bool) {
        return propertyPrice[propertyId] > 0;
    }

    /**
     * @notice 检查预订是否重叠
     */
    function overlapBooking(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate
    ) public view returns (bool) {
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            if (propertyDateBooked[propertyId][d]) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice 查询单个预订详情
     */
    function getBooking(uint256 bookingId) public view returns (Booking memory) {
        return bookings[bookingId];
    }

    /**
     * @notice 获取当前预订数量
     */
    function bookingCount() public view returns (uint256) {
        return _nextBookingId - 1;
    }

    /**
     * @notice 获取下一个 NFT Token ID（用于获取刚铸造的 NFT ID）
     */
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice 获取 NFT 元数据
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "NFT does not exist");

        uint256 bookingId = nftToBooking[tokenId];
        Booking memory booking = bookings[bookingId];

        // 获取状态字符串
        string memory statusStr;
        if (booking.status == BookingStatus.Pending) {
            statusStr = "Pending";
        } else if (booking.status == BookingStatus.Confirmed) {
            statusStr = "Confirmed";
        } else if (booking.status == BookingStatus.Cancelled) {
            statusStr = "Cancelled";
        } else if (booking.status == BookingStatus.Completed) {
            statusStr = "Completed";
        } else {
            statusStr = "Unknown";
        }

        // 构建完整 JSON 元数据 (简化版)
        string memory json = string(abi.encodePacked(
            '{"name":"Booking NFT #', uint2str(bookingId), '",',
            '"description":"Real Estate Booking NFT - Property #', uint2str(booking.propertyId), '",',
            '"image":"https://picsum.photos/seed/', uint2str(bookingId), '/400/300",',
            '"attributes":['
        ));

        // Property ID
        json = string(abi.encodePacked(json,
            '{"trait_type":"Property ID","display_type":"number","value":', uint2str(booking.propertyId), '},'
        ));

        // Amount in wei (显示原始值)
        json = string(abi.encodePacked(json,
            '{"trait_type":"Amount Wei","display_type":"number","value":', uint2str(booking.amount), '},'
        ));

        // Status
        json = string(abi.encodePacked(json,
            '{"trait_type":"Status","value":"', statusStr, '"}'
        ));

        json = string(abi.encodePacked(json, ']}'));

        // 返回 data URI
        return string(abi.encodePacked("data:application/json,", json));
    }

    // ============ 辅助函数 ============

    /**
     * @notice 释放预订日期
     */
    function releaseBookingDates(
        uint256 propertyId,
        uint256 startDate,
        uint256 endDate
    ) internal {
        for (uint256 d = startDate; d < endDate; d += 1 days) {
            propertyDateBooked[propertyId][d] = false;
        }
    }

    /**
     * @notice 辅助：将 uint 转为 string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}
