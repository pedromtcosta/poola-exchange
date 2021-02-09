import { run, ethers } from "hardhat";

async function main() {
  await run("compile");
  
  const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
  const erc20Factory = await ERC20Factory.deploy([
    "0xbB34a7E2A070eC193cDdA2df52c2a912f54Ee087",
    "0x5782033F831C661D49cc288e9DFFf02452c93c6F",
    "0x281b1FE6C3f29c729bA7D7a6fcee7a9A043Fe118"]);

  await erc20Factory.deployed();

  const Poola = await ethers.getContractFactory("Poola");
  const poola = await Poola.deploy(erc20Factory.address);

  await poola.deployed();

  console.log("ERC20Factory deployed to:", erc20Factory.address);
  console.log("Poola deployed to:", poola.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
