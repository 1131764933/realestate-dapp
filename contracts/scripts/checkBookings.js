const { ethers } = require("hardhat");

async function main() {
    const contract = await ethers.getContractAt("BookingContract", "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07");
    const count = await contract.bookingCount();
    console.log("Total bookings on chain:", count);
    console.log("\nAll bookings:");
    for (let i = 1; i <= Number(count); i++) {
        const b = await contract.getBooking(i);
        if (b.user !== '0x0000000000000000000000000000000000000000') {
            const start = new Date(Number(b.startDate) * 1000).toLocaleDateString();
            const end = new Date(Number(b.endDate) * 1000).toLocaleDateString();
            console.log(`Booking ${i}: Property ${b.propertyId}, ${start} - ${end}, Status: ${b.status}`);
        }
    }
}

main();
