const hre = require("hardhat");

async function main() {
    const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
    const contract = await hre.ethers.getContractAt("BookingContract", contractAddress);
    
    console.log("=== 查询区块链上的预订记录 ===\n");
    
    try {
        const totalBookings = await contract.bookingCount();
        console.log("Total bookings on chain:", totalBookings.toString());
    } catch (e) {
        console.log("Cannot get booking count");
    }
    
    // Query booking for ID 1
    try {
        const booking1 = await contract.getBooking(1);
        console.log("Booking ID 1:", booking1);
    } catch (e) {
        console.log("Booking 1 not found or error:", e.message);
    }
    
    // Query booking for ID 2
    try {
        const booking2 = await contract.getBooking(2);
        console.log("Booking ID 2:", booking2);
    } catch (e) {
        console.log("Booking 2 not found or error:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
