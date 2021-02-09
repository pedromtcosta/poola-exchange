import { BigNumber, ethers } from "ethers";
import { expect } from "chai";
import { PoolaFacade } from "./utils/PoolaFacade";

describe("Poola", function () {
  describe("createPool()", function() {
    it("should create pool", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      const pool = await facade.addPool(tokenPoolName, token.address, 100);
  
      expect(pool.erc20Address).to.be.equal(token.address);
      expect(pool.owner).to.be.equal(facade.accounts[0].address);
      expect(pool.size.toNumber()).to.be.equal(0);
      expect(pool.pricePerWei.toNumber()).to.be.equal(100);
    });
  
    it("should not allow to create pool with same name", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(tokenPoolName, token.address, 100);
  
      await expect(facade.obj.functions.createPool(tokenPoolName, token.address, 100))
              .to.be.revertedWith("A pool with the same name has already been created");
    });
  
    it("should not allow to create pool with 0 pricePerWei", async function() {
      const tokenPoolName = "tokenPool";
  
      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
  
      await expect(facade.obj.functions.createPool(tokenPoolName, token.address, 0))
              .to.be.revertedWith("_pricePerWei should be greater than 0");
    });
  });

  describe("deposit()", function() {
    it("should transfer the tokens", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addActualToken();
      const pool = await facade.addPool(poolName, token.address, 100);

      await token.approve(facade.obj.address, 1000);
      await facade.obj.functions.deposit(poolName, 1000);

      expect(await token.balanceOf(facade.obj.address)).to.equal(1000);
    });

    it("should set pool size", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000);

      const pool = await facade.getPool(poolName);

      expect(pool.size).to.equal(1000);
    });

    it("should increase pool size", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000);
      await facade.obj.functions.deposit(poolName, 1000);

      const pool = await facade.getPool(poolName);

      expect(pool.size).to.equal(2000);
    });

    describe("constraints", function() {
      it("should not allow deposit to inexistent pool", async function() {
        const facade = await PoolaFacade.init();
        await expect(facade.obj.functions.deposit("any", 1000)).to.be.revertedWith("Cannot deposit to inexistent pool");
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

        await expect(facade.obj.functions.deposit(tokenPoolName, 10))
          .to.be.revertedWith("Cannot deposit less than the pool's pricePerWei");
      });

      it("should not allow to deposit value not divisible by pricePerWei", async function() {
        const tokenPoolName = "tokenPool";
        const pricePerWei = 100;

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, pricePerWei);

        await expect(facade.obj.functions.deposit(tokenPoolName, 102))
          .to.be.revertedWith("Deposit amount should be divisible by pool's pricePerWei");
      });
    });
  });

  describe("buyFromPool()", function() {
    describe("constraints", function() {
      it("should not allow to buy from innexistent pool", async function() {
        const facade = await PoolaFacade.init();
        await expect(facade.obj.functions.buyFromPool("any", 1000))
          .to.be.revertedWith("Cannot buy from inexistent pool");
      });

      it("should not allow to buy above pool size",async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.obj.functions.buyFromPool(poolName, 2000, {value: 20}))
          .to.be.revertedWith("The amount cannot be greater than the pool size");
      });

      it("should not allow to buy 0 amount", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(poolName, token.address, 100);

        await expect(facade.obj.functions.buyFromPool(poolName, 0))
          .to.be.revertedWith("The amount has to be greater than 0");
      });

      it("should not allow to buy bellow pricePerWei", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        const pool = await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.obj.functions.buyFromPool(poolName, 50))
          .to.be.revertedWith("The amount is not a multiplier of the pool's pricePerWei");
      });

      it("should not allow to buy non-multiplier of pricePerWei", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        const pool = await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.obj.functions.buyFromPool(poolName, 150))
          .to.be.revertedWith("The amount is not a multiplier of the pool's pricePerWei");
      });

      it("should not allow to buy when not paying and don't have allowance", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        const pool = await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.execAs(1, x => x.functions.buyFromPool(poolName, 1000)))
          .to.be.revertedWith("You need to have allowance to buy without transfering Wei");
      });

      it("should not allow to buy when paid value is bellow the ammount / pricePerWei", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        const pool = await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.obj.functions.buyFromPool(poolName, 1000, {value: 5}))
          .to.be.revertedWith("The paid value doesn't match the requested buying amount");
      });

      it("should not allow to buy when paid value is above the ammount / pricePerWei", async function() {
        const poolName = "TestPool";

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        await token.mock.transferFrom.returns(true);
        const pool = await facade.addPool(poolName, token.address, 100);

        await facade.obj.functions.deposit(poolName, 1000);

        await expect(facade.obj.functions.buyFromPool(poolName, 1000, {value: 100}))
          .to.be.revertedWith("The paid value doesn't match the requested buying amount");
      });
    });

    describe("buying with wei", function() {
      it("should transfer the tokens to buyer", async function() {
        const poolName = "TestPool";
  
        const facade = await PoolaFacade.init();
        const token = await facade.addActualToken();
        await facade.addPool(poolName, token.address, 100);
  
        await token.approve(facade.obj.address, 1000);
        await facade.obj.functions.deposit(poolName, 1000);
  
        await facade.execAs(1, x => x.functions.buyFromPool(poolName, 500, {
          value: 5
        }));
  
        expect(await token.balanceOf(facade.accounts[1].address)).to.equal(500);
      });
  
      it("should decrease pool size", async function() {
        const poolName = "TestPool";
  
        const facade = await PoolaFacade.init();
        const token = await facade.addActualToken();
        await facade.addPool(poolName, token.address, 100);
  
        await token.approve(facade.obj.address, 1000);
        await facade.obj.functions.deposit(poolName, 1000);
  
        await facade.execAs(1, x => x.functions.buyFromPool(poolName, 500, {
          value: 5
        }));
  
        const pool = await facade.getPool(poolName);
        expect(pool.size).to.equal(500);
      });
  
      it("should increase pool owner's allowance", async function() {
        const poolName = "TestPool";
  
        const facade = await PoolaFacade.init();
        const token = await facade.addActualToken();
        await facade.addPool(poolName, token.address, 100);
  
        await token.approve(facade.obj.address, 1000);
        await facade.obj.functions.deposit(poolName, 1000);
  
        await facade.execAs(1, x => x.functions.buyFromPool(poolName, 500, {
          value: 5
        }));
  
        const allowance = await facade.getAllowance(facade.accounts[0].address);
        expect(allowance).to.equal(5);
      });
    });

    describe("buying with allowance", function() {
      it("should transfer the tokens to buyer", async function() {
        const poolNameA = "TestPoolA";
        const poolNameB = "TestPoolB";
  
        const facade = await PoolaFacade.init();
        const tokenA = await facade.addActualToken(0);
        const tokenB = await facade.addActualToken(1);

        await facade.addPool(poolNameA, tokenA.address, 100, 0);
        await facade.addPool(poolNameB, tokenB.address, 100, 1);
  
        await tokenA.approve(facade.obj.address, 1000);
        await tokenB.approve(facade.obj.address, 1000);

        await facade.execAs(0, x => x.functions.deposit(poolNameA, 1000));
        await facade.execAs(1, x => x.functions.deposit(poolNameB, 1000));

        await facade.execAs(1, x => x.functions.buyFromPool(poolNameA, 500, {
          value: 5
        }));
        await facade.execAs(0, x => x.functions.buyFromPool(poolNameB, 500));

        expect(await tokenB.balanceOf(facade.accounts[0].address)).to.equal(500);
      });

      it("should decrease buyer's allowance", async function() {
        const poolNameA = "TestPoolA";
        const poolNameB = "TestPoolB";
  
        const facade = await PoolaFacade.init();
        const tokenA = await facade.addActualToken(0);
        const tokenB = await facade.addActualToken(1);

        await facade.addPool(poolNameA, tokenA.address, 100, 0);
        await facade.addPool(poolNameB, tokenB.address, 100, 1);
  
        await tokenA.approve(facade.obj.address, 1000);
        await tokenB.approve(facade.obj.address, 1000);

        await facade.execAs(0, x => x.functions.deposit(poolNameA, 1000));
        await facade.execAs(1, x => x.functions.deposit(poolNameB, 1000));

        await facade.execAs(1, x => x.functions.buyFromPool(poolNameA, 500, {
          value: 5
        }));
        await facade.execAs(0, x => x.functions.buyFromPool(poolNameB, 500));

        const allowance = await facade.getAllowance(facade.accounts[0].address);
        expect(allowance).to.equal(0);
      });
    });
  });

  describe("withdraw()", async function() {
    it("should not allow to withdraw more than allowance", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await token.mock.transferFrom.returns(true);
      await token.mock.transfer.returns(true);
      await facade.addPool(poolName, token.address, 100);

      await facade.obj.functions.deposit(poolName, 1000);
      await facade.execAs(1, x => x.functions.buyFromPool(poolName, 1000, {
        value: 10
      }));

      await expect(facade.obj.functions.withdraw(11))
        .to.be.revertedWith("Cannot withdraw more than allowance");
    });


    it("should transfer Wei from contract to sender", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await token.mock.transferFrom.returns(true);
      await token.mock.transfer.returns(true);
      await facade.addPool(poolName, token.address, 100);

      await facade.obj.functions.deposit(poolName, 1000);
      await facade.execAs(1, x => x.functions.buyFromPool(poolName, 1000, {
        value: 10
      }));
      
      const previousContractBalance = await facade.obj.provider.getBalance(facade.obj.address);
      const previousSenderBalance = await facade.obj.provider.getBalance(facade.accounts[0].address);
      
      const withdrawAmount = 10;
      await facade.obj.functions.withdraw(withdrawAmount);

      const currentContractBalance = await facade.obj.provider.getBalance(facade.obj.address);
      const currentSenderBalance = await facade.obj.provider.getBalance(facade.accounts[0].address);
      const lastTransactionCost = await facade.getLastTransactionCost();

      expect(currentContractBalance).to.equal(previousContractBalance.sub(withdrawAmount));
      expect(currentSenderBalance).to.equal(previousSenderBalance.sub(lastTransactionCost).add(withdrawAmount));
    });

    it("should decrease allowance", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await token.mock.transferFrom.returns(true);
      await token.mock.transfer.returns(true);
      await facade.addPool(poolName, token.address, 100);

      await facade.obj.functions.deposit(poolName, 1000);
      await facade.execAs(1, x => x.functions.buyFromPool(poolName, 1000, {
        value: 10
      }));
      
      const withdrawAmount = 5;
      await facade.obj.functions.withdraw(withdrawAmount);

      const allowance = await facade.getAllowance(facade.accounts[0].address);

      expect(allowance).to.equal(5);
    });
  });
});

function compareBigNumbers(a: BigNumber, b: BigNumber) {
  expect(a.toString()).to.equal(b.toString());
}