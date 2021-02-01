
import { ethers, waffle } from "hardhat";
import { ContractFactory, BigNumber } from "ethers";
import { expect } from "chai";
import Poola from "../artifacts/contracts/Poola.sol/Poola.json";
import IERC20Factory from "../artifacts/contracts/utils/ERC20Factory.sol/IERC20Factory.json";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
const deployMockContract = waffle.deployMockContract;

describe("Poola", function () {
  let accounts: SignerWithAddress[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
  });

  it("should increase pool size when depositing to the same pool", async function() {
    const aTokenPool = "aTokenPool";

    const aToken = await deployMockContract(accounts[0], IERC20.abi);
    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
    const poola = await contractFactory.deploy(erc20Factory.address);

    await aToken.mock.transfer.withArgs(poola.address, 10000).returns(true);
    await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);

    await poola.functions.deposit(aTokenPool, aToken.address, 10000, {
      value: 1000
    });

    compareBigNumbers(await poola.functions.getPoolSize(aTokenPool), BigNumber.from(10000))

    await poola.functions.deposit(aTokenPool, aToken.address, 10000, {
      value: 1000
    });

    compareBigNumbers(await poola.functions.getPoolSize(aTokenPool), BigNumber.from(20000))
  });

  it("should add the correct allowances", async function () {
    const aTokenAmount = 10000;
    const bTokenAmount = 5000;
    const aTokenPool = "aTokenPool";
    const bTokenPool = "bTokenPool";
    
    const aToken = await deployMockContract(accounts[0], IERC20.abi);
    const bToken = await deployMockContract(accounts[0], IERC20.abi);
    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
    const poola = await contractFactory.deploy(erc20Factory.address);
    const poola2 = poola.connect(accounts[1]);

    await aToken.mock.transfer.withArgs(poola.address, aTokenAmount).returns(true);
    await bToken.mock.transfer.withArgs(poola.address, bTokenAmount).returns(true);
    await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
    await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

    await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
      value: 1000
    });

    await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
      value: 1000
    });
    
    compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(1000));
    compareBigNumbers(await poola.functions.myTokenAllowance(aTokenPool), BigNumber.from(aTokenAmount));
    compareBigNumbers(await poola.functions.myTokenAllowance(bTokenPool), BigNumber.from(0));

    compareBigNumbers(await poola2.functions.myEthAllowance(), BigNumber.from(1000));
    compareBigNumbers(await poola2.functions.myTokenAllowance(bTokenPool), BigNumber.from(bTokenAmount));
    compareBigNumbers(await poola2.functions.myTokenAllowance(aTokenPool), BigNumber.from(0));
  });

  it("should create pool with correct price for token", async function() {
    const aTokenAmount = 10000;
    const bTokenAmount = 5000;
    const aTokenPool = "aTokenPool";
    const bTokenPool = "bTokenPool";
    
    const aToken = await deployMockContract(accounts[0], IERC20.abi);
    const bToken = await deployMockContract(accounts[0], IERC20.abi);
    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
    const poola = await contractFactory.deploy(erc20Factory.address);
    const poola2 = poola.connect(accounts[1]);

    await aToken.mock.transfer.withArgs(poola.address, aTokenAmount).returns(true);
    await bToken.mock.transfer.withArgs(poola.address, bTokenAmount).returns(true);
    await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
    await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

    await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
      value: 1000
    });

    await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
      value: 1000
    });

    compareBigNumbers(await poola.functions.getWeiWorth(aTokenPool), BigNumber.from(10));
    compareBigNumbers(await poola.functions.getWeiWorth(bTokenPool), BigNumber.from(5));
  });

  it("should allow to trade ETH allowance for token", async function() {
    const aTokenAmount = 10000;
    const bTokenAmount = 5000;
    const aTokenPool = "aTokenPool";
    const bTokenPool = "bTokenPool";
    
    const aToken = await deployMockContract(accounts[0], IERC20.abi);
    const bToken = await deployMockContract(accounts[0], IERC20.abi);
    const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
    const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
    const poola = await contractFactory.deploy(erc20Factory.address);
    const poola2 = poola.connect(accounts[1]);

    await aToken.mock.transfer.withArgs(poola.address, aTokenAmount).returns(true);
    await bToken.mock.transfer.withArgs(poola.address, bTokenAmount).returns(true);
    await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
    await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

    await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
      value: 1000
    });

    await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
      value: 1000
    });

    await aToken.mock.transfer.withArgs(accounts[1].address, 5000).returns(true);
    await bToken.mock.transfer.withArgs(accounts[0].address, 2500).returns(true);

    await poola.functions.tradeWithEth(bTokenPool, 500);
    await poola2.functions.tradeWithEth(aTokenPool, 500);
    
    compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(500));
    compareBigNumbers(await poola2.functions.myEthAllowance(), BigNumber.from(500));
  });
});

function compareBigNumbers(a: BigNumber, b: BigNumber) {
  expect(a.toString()).to.equal(b.toString());
}