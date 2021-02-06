//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "contracts/utils/ERC20Factory.sol";

struct Pool {
  address erc20Address;
  address owner;
  uint256 pricePerWei;
  uint256 size;
}

contract Poola {
  using SafeMath for uint256;

  mapping(address => uint256) public ethAllowances;
  mapping(string => Pool) public pools;

  IERC20Factory factory;
  constructor(IERC20Factory _factory) {
    factory = _factory;
  }

  function createPool(string memory _pool, address _erc20Address, uint256 _pricePerWei) public {
    Pool storage pool = pools[_pool];
    require(pool.owner == address(0), "A pool with the same name has already been created");
    require(_pricePerWei > 0, "_pricePerWei should be greater than 0");

    pool.erc20Address = _erc20Address;
    pool.owner = msg.sender;
    pool.pricePerWei = _pricePerWei;
  }

  function deposit(string memory _pool, uint256 _amount) public payable {
    Pool storage pool = pools[_pool];
    require(pool.owner != address(0), "Cannot deposit to inexistent pool");
    require(pool.owner == msg.sender, "Cannot someone else's pool");
    require(_amount >= pool.pricePerWei, "Cannot deposit less than the pool's pricePerWei");
    require(_amount % pool.pricePerWei == 0, "Deposit amount should be divisible by pool's pricePerWei");
    require(_amount.div(pool.pricePerWei) == msg.value, "The paid amount should be equal to amount / pricePerWei");

    pool.size = pool.size.add(_amount);

    IERC20 token = factory.getErc20(pool.erc20Address);
    require(token.transferFrom(msg.sender, address(this), _amount));
  }

  // function deposit(string memory _pool, address _erc20Address, uint256 _amount) public payable {    
  //   Pool storage pool = pools[_pool];

  //   if (pool.owner != address(0)) {
  //     require(pool.owner == msg.sender, "Only the owner is allowed to deposit to the pool");
  //   }

  //   pool.owner = msg.sender;

  //   // add the token allowance to the Pool
  //   pool.size = pool.size.add(_amount);

  //   // add the ETH allowances
  //   ethAllowances[msg.sender] = ethAllowances[msg.sender].add(msg.value);

  //   // sets how much 1 Wei can buy of this token
  //   pool.weiWorth = pool.weiWorth.add(msg.value);

  //   // deposit the amount of the token
  //   pool.erc20Address = _erc20Address;
  //   IERC20 token = factory.getErc20(_erc20Address);
  //   require(token.transferFrom(msg.sender, address(this), _amount), "The token transfer wasn't successfull");
  // }

  // function buyFromPool(string memory _pool) public payable {
  //   Pool storage pool = pools[_pool];
  //   require(pool.owner != address(0), "The pool is in a invalid state. Cannot buy from it");

  //   ethAllowances[pool.owner] = ethAllowances[pool.owner].add(msg.value);

  //   uint256 weiWorth = pools[_pool].weiWorth;
  //   uint256 size = pools[_pool].size;
  //   IERC20 token = factory.getErc20(pools[_pool].erc20Address);
  //   uint256 amountToTransfer = size.div(weiWorth).mul(msg.value);
  //   require(token.transfer(msg.sender, amountToTransfer));
  // }

  // function tradeWithEth(string memory _pool, uint256 _amount) public {
  //   // substracts the allowance
  //   ethAllowances[msg.sender] = ethAllowances[msg.sender].sub(_amount);

  //   // transfers the token to the sender's address
  //   uint256 weiWorth = pools[_pool].weiWorth;
  //   uint256 size = pools[_pool].size;
  //   IERC20 token = factory.getErc20(pools[_pool].erc20Address);
  //   uint256 amountToTransfer = size.div(weiWorth).mul(_amount);
  //   require(token.transfer(msg.sender, amountToTransfer));
  // }

  // function getPoolSize(string memory _pool) public view returns(uint256 _size) {
  //   return pools[_pool].size;
  // }

  // function getWeiWorth(string memory _pool) public view returns(uint256 _price) {
  //   return pools[_pool].weiWorth;
  // }

  // function myEthAllowance() public view returns (uint256 _allowance) {
  //   return ethAllowances[msg.sender];
  // }
}