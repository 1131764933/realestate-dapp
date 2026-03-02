const { ethers } = require("hardhat");

async function main() {
    const contract = await ethers.getContractAt("BookingContract", "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07");
    
    // Booking 7 的日期
    const b7 = await contract.getBooking(7);
    console.log("Booking 7 dates:", new Date(Number(b7.startDate) * 1000).toDateString(), "to", new Date(Number(b7.endDate) * 1000).toDateString());
    
    // 尝试预订相同日期
    console.log("\nTrying to book same dates (should fail)...");
    try {
        const tx = await contract.book(2, b7.startDate, b7.endDate, "2000000000000000", {
            value: "2000000000000000"
        });
        await tx.wait();
        console.log("ERROR: Should have failed but succeeded!");
    } catch (e) {
        console.log("Correctly rejected:", e.message.slice(0, 150));
    }
    
    // 尝试预订重叠日期
    console.log("\nTrying to book overlapping dates (should fail)...");
    const overlappingStart = b7.startDate + 86400n; // 第二天
    try {
        const tx = await contract.book(2, overlappingStart, b7.endDate, "2000000000000000", {
            value: "2000000000000000"
        });
        await tx.wait();
        console.log("ERROR: Should have failed but succeeded!");
    } catch (e) {
        console.log("Correctly rejected:", e.message.slice(0, 150));
    }
}

main();
