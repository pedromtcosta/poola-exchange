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

  mapping(address => uint256) public allowances;
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
    allowances[msg.sender] = allowances[msg.sender].add(msg.value);

    IERC20 token = factory.getErc20(pool.erc20Address);
    require(token.transferFrom(msg.sender, address(this), _amount));
  }
}