import { ethers, waffle } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { MockContract } from "ethereum-waffle";
import { Pool } from "../../models/Pool";

import Poola from "../../artifacts/contracts/Poola.sol/Poola.json";
import IERC20Factory from "../../artifacts/contracts/utils/ERC20Factory.sol/IERC20Factory.json";
import IERC20 from "../../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import DummyToken from "../../artifacts/contracts/utils/DummyToken.sol/DummyToken.json";

const deployMockContract = waffle.deployMockContract;
const deployContract = waffle.deployContract;

export class PoolaFacade {
  private _obj: Contract;
  private _erc20Factory: MockContract;
  private _accounts: SignerWithAddress[];
  private _contexts: { [address: string]: Contract } = {};

  get obj(): Contract {
    return this._obj;
  }

  get accounts(): SignerWithAddress[] {
    return this._accounts;
  }

  constructor(obj: Contract, erc20Factory: MockContract, accounts: SignerWithAddress[]) {
    this._obj = obj;
    this._erc20Factory = erc20Factory;
    this._accounts = accounts;
    this._contexts[accounts[0].address] = this._obj;
  }

  static async init(): Promise<PoolaFacade> {
    const accounts = await ethers.getSigners();

    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const poola = await deployContract(accounts[0], Poola, [erc20Factory.address]);

    return new PoolaFacade(poola, erc20Factory, accounts);
  }

  async addToken(deployerIndex: number = 0): Promise<MockContract> {
    const token = await deployMockContract(this.accounts[deployerIndex], IERC20.abi);
    this._erc20Factory.mock.getErc20.withArgs(token.address).returns(token.address);
    return token;
  }

  async addActualToken(deployerIndex: number = 0, initialBalance: string = "1000000000000000000000"): Promise<Contract> {
    const token = await deployContract(this.accounts[deployerIndex], DummyToken, [this.accounts[deployerIndex].address, initialBalance]);
    this._erc20Factory.mock.getErc20.withArgs(token.address).returns(token.address);
    return token;
  }

  async addPool(poolName: string, tokenAddress: string, pricePerWei: number): Promise<Pool> {
    await this._obj.functions.createPool(poolName, tokenAddress, pricePerWei);
    return await this.getPool(poolName);
  }

  async getPool(poolName: string): Promise<Pool> {
    const pool: Pool = await this._obj.functions.pools(poolName);
    return pool;
  }

  async execAs<T>(accountIndex: number, f: (x: Contract) => Promise<T>): Promise<T> {
    if (!this._contexts[this.accounts[accountIndex].address]) {
      this._contexts[this.accounts[accountIndex].address] = this._obj.connect(this.accounts[accountIndex]);
    }
    return await f(this._contexts[this.accounts[accountIndex].address]);
  }

  execAllAs(accountIndex: number) {
    if (!this._contexts[this.accounts[accountIndex].address]) {
      this._contexts[this.accounts[accountIndex].address] = this._obj.connect(this.accounts[accountIndex]);
    }
    this._obj = this._contexts[this.accounts[accountIndex].address];
  }
}