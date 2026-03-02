const { ethers } = require("ethers");

async function main() {
    const contractAddress = "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07";
    const ABI = [
        "function cancelBooking(uint256) returns()",
        "function getBooking(uint256) view returns (address, uint256, uint256, uint256, uint256, uint8)"
    ];
    
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    
    console.log("Before cancel - Booking 5:");
    const b5before = await contract.getBooking(5);
    console.log("  Status:", b5before[5].toString());
    
    console.log("Cancelling booking 5...");
    try {
        const tx = await contract.cancelBooking(5);
        const receipt = await tx.wait();
        console.log("Tx confirmed:", tx.hash);
    } catch (e) {
        console.log("Error:", e.message);
    }
    
    console.log("After cancel - Booking 5:");
    const b5after = await contract.getBooking(5);
    console.log("  Status:", b5after[5].toString());
}

main().catch(console.error);
