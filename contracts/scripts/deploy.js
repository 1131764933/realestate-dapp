const hre = require("hardhat");

async function main() {
    console.log("Deploying BookingContract...");
    
    const BookingContract = await hre.ethers.getContractFactory("BookingContract");
    const contract = await BookingContract.deploy();
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(`BookingContract deployed to: ${address}`);
    console.log("");
    
    // 添加测试房源
    console.log("Adding test properties...");
    
    // propertyId 1: 0.001 ETH
    const price1 = hre.ethers.parseEther("0.001");
    await contract.addProperty(1, price1);
    console.log("Property 1 added: 0.001 ETH");
    
    // propertyId 2: 0.002 ETH
    const price2 = hre.ethers.parseEther("0.002");
    await contract.addProperty(2, price2);
    console.log("Property 2 added: 0.002 ETH");
    
    // propertyId 3: 0.003 ETH
    const price3 = hre.ethers.parseEther("0.003");
    await contract.addProperty(3, price3);
    console.log("Property 3 added: 0.003 ETH");
    
    console.log("");
    console.log("Deployment completed!");
    console.log(`Contract Address: ${address}`);
    
    // 保存部署地址到文件
    const fs = require('fs');
    const deploymentInfo = {
        address: address,
        network: hre.network.name,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(
        './deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment info saved to deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
