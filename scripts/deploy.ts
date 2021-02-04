import { run, ethers } from "hardhat";

async function main() {
  await run("compile");
  
  const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
  const erc20Factory = await ERC20Factory.deploy(["0x67C483918F8221BADa4B12B8c01b427338F6b779"]);

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
