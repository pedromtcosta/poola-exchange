//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "contracts/utils/ERC20Factory.sol";

struct Pool {
  string name;
  address erc20Address;
  address owner;
  uint256 pricePerWei;
  uint256 size;
}

contract Poola {
  using SafeMath for uint256;

  mapping(address => uint256) public allowances;
  mapping(string => Pool) public pools;
  string[] public poolNames;

  event NewPool(string poolName, uint64 poolsCount);
  event Deposit(string poolName, uint256 amount);
  event Buy(string poolName, uint256 amount);
  event Withdraw(address recipient, uint256 amount);

  IERC20Factory factory;
  constructor(IERC20Factory _factory) {
    factory = _factory;
  }

  function getPoolsCount() public view returns(uint64 count) {
    return uint64(poolNames.length);
  }

  function createPool(string memory _poolName, address _erc20Address, uint256 _pricePerWei) public {
    Pool storage pool = pools[_poolName];
    require(pool.owner == address(0), "A pool with the same name has already been created");
    require(_pricePerWei > 0, "_pricePerWei should be greater than 0");

    pool.name = _poolName;
    pool.erc20Address = _erc20Address;
    pool.owner = msg.sender;
    pool.pricePerWei = _pricePerWei;
    poolNames.push(_poolName);

    emit NewPool(_poolName, uint64(poolNames.length));
  }

  function deposit(string memory _pool, uint256 _amount) public {
    Pool storage pool = pools[_pool];
    require(pool.owner != address(0), "Cannot deposit to inexistent pool");
    require(pool.owner == msg.sender, "Cannot someone else's pool");
    require(_amount >= pool.pricePerWei, "Cannot deposit less than the pool's pricePerWei");
    require(_amount % pool.pricePerWei == 0, "Deposit amount should be divisible by pool's pricePerWei");

    pool.size = pool.size.add(_amount);

    IERC20 token = factory.getErc20(pool.erc20Address);
    require(token.transferFrom(msg.sender, address(this), _amount), "The token trasnfer failed");

    emit Deposit(_pool, _amount);
  }

  function buyFromPool(string memory _pool, uint256 _amount) public payable {
    Pool storage pool = pools[_pool];
    require(pool.owner != address(0), "Cannot buy from inexistent pool");
    require(_amount > 0, "The amount has to be greater than 0");
    require(_amount <= pool.size, "The amount cannot be greater than the pool size");
    require(_amount % pool.pricePerWei == 0, "The amount is not a multiplier of the pool's pricePerWei");

    uint256 value = msg.value;
    if (value == 0) {
      value = _amount.div(pool.pricePerWei);
      require(allowances[msg.sender] >= value, "You need to have allowance to buy without transfering Wei");

      allowances[msg.sender] = allowances[msg.sender].sub(value);
    } else {
      require(pool.pricePerWei.mul(value) == _amount, "The paid value doesn't match the requested buying amount");
    }

    pool.size = pool.size.sub(_amount);
    allowances[pool.owner] = allowances[pool.owner].add(value);

    IERC20 token = factory.getErc20(pool.erc20Address);
    require(token.transfer(msg.sender, _amount));

    emit Buy(_pool, _amount);
  }

  function withdraw(uint256 _amount) public {
    require(allowances[msg.sender] >= _amount, "Cannot withdraw more than allowance");
    allowances[msg.sender] = allowances[msg.sender].sub(_amount);
    (bool success, ) = msg.sender.call{value:_amount}("");
    require(success, "Transfer failed");

    emit Withdraw(msg.sender, _amount);
  }
}