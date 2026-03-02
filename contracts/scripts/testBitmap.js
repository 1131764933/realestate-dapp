const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07";
    const ABI = [
        "function overlapBooking(uint256, uint256, uint256) view returns (bool)",
        "function START_DATE() view returns (uint256)",
        "function DAYS_PER_SLOT() view returns (uint256)"
    ];
    
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    
    console.log("START_DATE:", (await contract.START_DATE()).toString());
    console.log("DAYS_PER_SLOT:", (await contract.DAYS_PER_SLOT()).toString());
    
    // 测试预订日期
    const testDate = 1773273600n; // 2025-12-31
    const startDate = 1735689600n;
    const daysSinceStart = (testDate - startDate) / 86400n;
    console.log("Test date:", testDate.toString());
    console.log("Days since start:", daysSinceStart.toString());
    
    // 测试冲突检查 - 尝试预订一个已有日期
    const overlap = await contract.overlapBooking(1, 1772496000n, 1772582400n);
    console.log("Overlap check (property 1, dates already booked):", overlap);
}

main().catch(console.error);
