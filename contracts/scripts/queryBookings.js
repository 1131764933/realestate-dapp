const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49";
    const BookingABI = [
        "function bookingCount() view returns (uint256)",
        "function getBooking(uint256 bookingId) view returns (address user, uint256 propertyId, uint256 startDate, uint256 endDate, uint256 amount, uint8 status)"
    ];
    
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const contract = new ethers.Contract(contractAddress, BookingABI, provider);
    
    const count = await contract.bookingCount();
    console.log("Booking count:", count);
    
    for (let i = 1; i <= count; i++) {
        const booking = await contract.getBooking(i);
        console.log(`Booking ${i}:`, booking);
    }
}

main().catch(console.error);
