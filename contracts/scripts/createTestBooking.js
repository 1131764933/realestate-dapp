const { ethers } = require("hardhat");

const CONTRACT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

async function main() {
  const [user] = await ethers.getSigners();
  const contract = await ethers.getContractAt("BookingContract", CONTRACT_ADDRESS);
  
  console.log("=== 创建新 Booking 测试 ===");
  console.log("User:", user.address);
  
  // 使用未来日期 (2027年)
  const startDate = Math.floor(new Date("2027-06-01").getTime() / 1000);
  const endDate = Math.floor(new Date("2027-06-05").getTime() / 1000);
  const amount = ethers.parseEther("0.001"); // 0.001 ETH
  
  console.log("Start date:", new Date(startDate * 1000).toISOString());
  console.log("End date:", new Date(endDate * 1000).toISOString());
  console.log("Amount:", ethers.formatEther(amount), "ETH");
  
  try {
    const tx = await contract.book(1, startDate, endDate, amount, {
      value: amount,
      gasLimit: 300000
    });
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // 查询新的 booking
    const count = await contract.bookingCount();
    console.log("\n新的 Booking 总数:", count);
    
    const newBooking = await contract.getBooking(count);
    console.log("\n最新 Booking #" + count + ":");
    console.log("  user:", newBooking.user);
    console.log("  propertyId:", newBooking.propertyId);
    console.log("  status:", newBooking.status);
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main().catch(console.error);
