import { BigNumber } from "ethers";
import { expect } from "chai";
import { PoolaFacade } from "./utils/PoolaFacade";

async function yyz(): Promise<boolean> {
  return false;
}

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
      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });

      expect(await token.balanceOf(facade.obj.address)).to.equal(1000);
    });

    it("should set pool size", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });

      const pool = await facade.getPool(poolName);

      expect(pool.size).to.equal(1000);
    });

    it("should increase pool size", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });
      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });

      const pool = await facade.getPool(poolName);

      expect(pool.size).to.equal(2000);
    })

    it("should add pool owner's allowance", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });

      const allowance = await facade.getAllowance(facade.accounts[0].address);

      expect(allowance).to.equal(10);
    });

    it("should increase pool owner's allowance", async function() {
      const poolName = "TestPool";

      const facade = await PoolaFacade.init();
      const token = await facade.addToken();
      await facade.addPool(poolName, token.address, 100);

      await token.mock.transferFrom.returns(true);

      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });
      await facade.obj.functions.deposit(poolName, 1000, {
        value: 10
      });

      const allowance = await facade.getAllowance(facade.accounts[0].address);

      expect(allowance).to.equal(20);
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

      it("should not alllow deposit if paid amount is not equal amount / pricePerWei", async function() {
        const tokenPoolName = "tokenPool";
        const pricePerWei = 100;

        const facade = await PoolaFacade.init();
        const token = await facade.addToken();
        const pool = await facade.addPool(tokenPoolName, token.address, pricePerWei);

        await expect(facade.obj.functions.deposit(tokenPoolName, 10000, {value: 10000}))
          .to.be.revertedWith("The paid amount should be equal to amount / pricePerWei");
      });
    });
  });
});

function compareBigNumbers(a: BigNumber, b: BigNumber) {
  expect(a.toString()).to.equal(b.toString());
}