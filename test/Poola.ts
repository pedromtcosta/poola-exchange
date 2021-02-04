
import { ethers, waffle } from "hardhat";
import { ContractFactory, BigNumber } from "ethers";
import { expect } from "chai";
import Poola from "../artifacts/contracts/Poola.sol/Poola.json";
import IERC20Factory from "../artifacts/contracts/utils/ERC20Factory.sol/IERC20Factory.json";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Pool } from "../models/Pool";
import { PoolaFacade } from "./utils/PoolaFacade";
const deployMockContract = waffle.deployMockContract;

describe("Poola", function () {
  let accounts: SignerWithAddress[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
  });

  describe("createPool()", function() {
    it("should create pool", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      const pool = await facade.addPool(tokenPoolName, token.address, 100);
  
      expect(pool.erc20Address).to.be.equal(token.address);
      expect(pool.owner).to.be.equal(accounts[0].address);
      expect(pool.size.toNumber()).to.be.equal(0);
      expect(pool.pricePerWei.toNumber()).to.be.equal(100);
    });
  
    it("should not allow to create pool with same name", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(tokenPoolName, token.address, 100);
  
      await expect(facade.getPoola().functions.createPool(tokenPoolName, token.address, 100))
              .to.be.revertedWith("A pool with the same name has already been created");
    });
  
    it("should not allow to create pool with 0 pricePerWei", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
  
      await expect(facade.getPoola().functions.createPool(tokenPoolName, token.address, 0))
              .to.be.revertedWith("_pricePerWei should be greater than 0");
    });
  });

  describe("deposit()", function() {
    describe("- constraints", function() {
      it("should not allow deposit to inexistent pool", async function() {
        const facade = await PoolaFacade.init();
        await expect(facade.getPoola().functions.deposit("any", 1000)).to.be.revertedWith("Cannot deposit to inexistent pool");
      });

      it("should not allow deposit to pool you don't own", async function() {
        const tokenPoolName = "tokenPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, 100);

        await expect(facade.execAs(1, x => x.functions.deposit(tokenPoolName, 1000)))
          .to.be.revertedWith("Cannot someone else's pool");
      });

      it("should not allow to deposit bellow pricePerWei", async function() {
        const tokenPoolName = "tokenPool";
        const pricePerWei = 100;

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, pricePerWei);

        await expect(facade.getPoola().functions.deposit(tokenPoolName, 10))
          .to.be.revertedWith("Cannot deposit less than the pool's pricePerWei");
      });

      it("should not allow to deposit value not divisible by pricePerWei", async function() {
        const tokenPoolName = "tokenPool";
        const pricePerWei = 100;

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, pricePerWei);

        await expect(facade.getPoola().functions.deposit(tokenPoolName, 102))
          .to.be.revertedWith("Deposit amount should be divisible by pool's pricePerWei");
      });

      it("should not alllow deposit if paid amount is not equal amount / pricePerWei", async function() {
        const tokenPoolName = "tokenPool";
        const pricePerWei = 100;

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, pricePerWei);

        await expect(facade.getPoola().functions.deposit(tokenPoolName, 10000, {value: 10000}))
          .to.be.revertedWith("The paid amount should be equal to amount / pricePerWei");
      });
    })
  });

  // it("should add the correct allowances", async function () {
  //   const aTokenAmount = 10000;
  //   const bTokenAmount = 5000;
  //   const aTokenPool = "aTokenPool";
  //   const bTokenPool = "bTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const bToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const poola2 = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await bToken.mock.transferFrom.withArgs(accounts[1].address, poola.address, bTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
  //   await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
  //     value: 1000
  //   });
    
  //   compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(1000));
  //   compareBigNumbers(await poola2.functions.myEthAllowance(), BigNumber.from(1000));
  // });

  // it("should increase pool size when depositing to the same pool", async function() {
  //   const aTokenPool = "aTokenPool";

  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, 10000).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, 10000, {
  //     value: 1000
  //   });

  //   compareBigNumbers(await poola.functions.getPoolSize(aTokenPool), BigNumber.from(10000))

  //   await poola.functions.deposit(aTokenPool, aToken.address, 10000, {
  //     value: 1000
  //   });

  //   compareBigNumbers(await poola.functions.getPoolSize(aTokenPool), BigNumber.from(20000))
  // });

  // it("should create pool with correct price for token", async function() {
  //   const aTokenAmount = 10000;
  //   const bTokenAmount = 5000;
  //   const aTokenPool = "aTokenPool";
  //   const bTokenPool = "bTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const bToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const poola2 = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await bToken.mock.transferFrom.withArgs(accounts[1].address, poola.address, bTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
  //   await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
  //     value: 1000
  //   });

  //   compareBigNumbers(await poola.functions.getWeiWorth(aTokenPool), BigNumber.from(1000));
  //   compareBigNumbers(await poola.functions.getWeiWorth(bTokenPool), BigNumber.from(1000));
  // });

  // it("should allow to trade ETH allowance for token", async function() {
  //   const aTokenAmount = 10000;
  //   const bTokenAmount = 5000;
  //   const aTokenPool = "aTokenPool";
  //   const bTokenPool = "bTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const bToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const poola2 = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await bToken.mock.transferFrom.withArgs(accounts[1].address, poola.address, bTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);
  //   await erc20Factory.mock.getErc20.withArgs(bToken.address).returns(bToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await poola2.functions.deposit(bTokenPool, bToken.address, bTokenAmount, {
  //     value: 1000
  //   });

  //   await aToken.mock.transfer.withArgs(accounts[1].address, 5000).returns(true);
  //   await bToken.mock.transfer.withArgs(accounts[0].address, 2500).returns(true);

  //   await poola.functions.tradeWithEth(bTokenPool, 500);
  //   await poola2.functions.tradeWithEth(aTokenPool, 500);
    
  //   compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(500));
  //   compareBigNumbers(await poola2.functions.myEthAllowance(), BigNumber.from(500));
  // });

  // it("should only allow owner to deposit to the pool", async function() {
  //   const aTokenAmount = 10000;
  //   const aTokenPool = "aTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const poola2 = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await aToken.mock.transferFrom.withArgs(accounts[1].address, poola.address, aTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await expect(poola2.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   })).to.be.revertedWith("Only the owner is allowed to deposit to the pool");
  // });

  // it("should increase pool owner allowance when buying from it with ETH", async function() {
  //   const aTokenAmount = 10000;
  //   const aTokenPool = "aTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const trader = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await aToken.mock.transfer.withArgs(accounts[1].address, 2000).returns(true);

  //   await trader.functions.buyFromPool(aTokenPool, {
  //     value: 200
  //   });

  //   compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(1200));
  // });

  // it("should not allow to buy if ", async function() {
  //   const aTokenAmount = 10000;
  //   const aTokenPool = "aTokenPool";
    
  //   const aToken = await deployMockContract(accounts[0], IERC20.abi);
  //   const erc20Factory = await deployMockContract(accounts[0], IERC20Factory.abi);
  //   const contractFactory = new ContractFactory(Poola.abi, Poola.bytecode, accounts[0]);
  //   const poola = await contractFactory.deploy(erc20Factory.address);
  //   const trader = poola.connect(accounts[1]);

  //   await aToken.mock.transferFrom.withArgs(accounts[0].address, poola.address, aTokenAmount).returns(true);
  //   await erc20Factory.mock.getErc20.withArgs(aToken.address).returns(aToken.address);

  //   await poola.functions.deposit(aTokenPool, aToken.address, aTokenAmount, {
  //     value: 1000
  //   });

  //   await aToken.mock.transfer.withArgs(accounts[1].address, 2000).returns(true);

  //   await trader.functions.buyFromPool(aTokenPool, {
  //     value: 200
  //   });

  //   compareBigNumbers(await poola.functions.myEthAllowance(), BigNumber.from(1200));
  // });
});

function compareBigNumbers(a: BigNumber, b: BigNumber) {
  expect(a.toString()).to.equal(b.toString());
}