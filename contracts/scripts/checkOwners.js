const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07";
    const ABI = [
        "function getBooking(uint256) view returns (address, uint256, uint256, uint256, uint256, uint8)"
    ];
    
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    
    console.log("=== All Bookings Owner ===");
    for (let i = 1; i <= 7; i++) {
        const b = await contract.getBooking(i);
        console.log(`Booking ${i}: owner=${b[0]}`);
    }
}

main().catch(console.error);
