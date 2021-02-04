import { ethers, waffle } from "hardhat";
import { ContractFactory, BigNumber, Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployContract, MockContract } from "ethereum-waffle";

import Poola from "../../artifacts/contracts/Poola.sol/Poola.json";
import IERC20Factory from "../../artifacts/contracts/utils/ERC20Factory.sol/IERC20Factory.json";
import IERC20 from "../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { Pool } from "../../models/Pool";

const deployMockContract = waffle.deployMockContract;

export class PoolaFacade {
  poola: Contract;
  erc20Factory: MockContract;
  accounts: SignerWithAddress[];
  contexts: { [address: string]: Contract } = {};

  getPoola(): Contract {
    return this.poola;
  }

  getFactory(): MockContract {
    return this.erc20Factory;
  }

  constructor(poola: Contract, erc20Factory: MockContract, accounts: SignerWithAddress[]) {
    this.poola = poola;
    this.erc20Factory = erc20Factory;
    this.accounts = accounts;
    this.contexts[accounts[0].address] = poola;
  }

  static async init(): Promise<PoolaFacade> {
    const accounts = await ethers.getSigners();

    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
    const poola = await contractFactory.deploy(erc20Factory.address);

    return new PoolaFacade(poola, erc20Factory, accounts);
  }

  async addToken(deployerIndex: number = 0): Promise<MockContract> {
    const token = await deployMockContract(this.accounts[deployerIndex], IERC20.abi);
    this.erc20Factory.mock.getErc20.withArgs(token.address).returns(token.address);
    return token;
  }

  async addPool(poolName: string, tokenAddress: string, withdrawMultiplier: number): Promise<Pool> {
    await this.poola.functions.createPool(poolName, tokenAddress, withdrawMultiplier);
    const pool: Pool = await this.poola.functions.pools(poolName);
    return pool;
  }

  async execAs<T>(accountIndex: number, f: (x: Contract) => Promise<T>): Promise<T> {
    if (!this.contexts[this.accounts[accountIndex].address]) {
      this.contexts[this.accounts[accountIndex].address] = this.poola.connect(this.accounts[accountIndex]);
    }
    return await f(this.contexts[this.accounts[accountIndex].address]);
  }

  execAllAs(accountIndex: number) {
    if (!this.contexts[this.accounts[accountIndex].address]) {
      this.contexts[this.accounts[accountIndex].address] = this.poola.connect(this.accounts[accountIndex]);
    }
    this.poola = this.contexts[this.accounts[accountIndex].address];
  }
}