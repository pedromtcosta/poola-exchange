import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import poola from "./artifacts/contracts/Poola.sol/Poola.json";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

task("deposit", "Deposits an amount of ERC20 to a pool")
  .addParam("poola", "The address of the Poola contract")
  .addParam("pool", "The pool name")
  .addParam("token", "The address of the token to deposit")
  .addParam("amount", "The amount to deposit")
  .addParam("wei", "How much Wei the deposited amount is worth")
  .setAction(async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
    const poolaContract = new hre.ethers.Contract(args.poola, cast(poola.abi), accounts[0]);

    await poolaContract.deposit(args.pool, args.token, args.amount, {
      value: args.wei
    });
    const size = await poolaContract.getPoolSize(args.pool);
    console.log("Current pool size: ", size)
  });

function cast<T>(arr: any[]): T[] {
  return arr.map(x => x as T);
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.3",
};

