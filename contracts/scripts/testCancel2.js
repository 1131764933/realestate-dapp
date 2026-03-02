const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07";
    const ABI = [
        "function cancelBooking(uint256)",
        "function getBooking(uint256) view returns (address, uint256, uint256, uint256, uint256, uint8)"
    ];
    
    // 使用用户钱包地址对应的私钥
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    
    // 测试取消 Booking 1
    console.log("Before cancel - Booking 1:");
    const b1 = await contract.getBooking(1);
    console.log("  Owner:", b1[0]);
    console.log("  Status:", b1[5].toString());
    
    console.log("\nCancelling booking 1...");
    try {
        const tx = await contract.cancelBooking(1);
        console.log("Tx sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Tx confirmed!");
    } catch (e) {
        console.log("Error:", e.message);
    }
    
    console.log("\nAfter cancel - Booking 1:");
    const b1after = await contract.getBooking(1);
    console.log("  Status:", b1after[5].toString());
}

main().catch(console.error);
