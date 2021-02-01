//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "contracts/utils/ERC20Factory.sol";

struct Pool {
  address erc20Address;
  uint256 weiWorth;
  uint256 size;
  uint256 allowanceUsageLimit;
  mapping(address => uint256) allowances;
}

contract Poola {
  using SafeMath for uint256;

  mapping(address => uint256) private ethAllowances;
  mapping(string => Pool) private pools;

  IERC20Factory factory;
  constructor(IERC20Factory _factory) {
    factory = _factory;
  }

  function deposit(string memory _pool, address _erc20Address, uint256 _amount) public payable {    
    // add the ETH allowances
    ethAllowances[msg.sender] = ethAllowances[msg.sender].add(msg.value);

    // add the token allowance to the Pool
    pools[_pool].allowances[msg.sender] = pools[_pool].allowances[msg.sender].add(_amount);
    pools[_pool].size = pools[_pool].size.add(_amount);

    // sets how much 1 Wei can buy of this token
    pools[_pool].weiWorth = _amount.div(msg.value);

    // deposit the amount of the token
    pools[_pool].erc20Address = _erc20Address;
    IERC20 token = factory.getErc20(_erc20Address);
    require(token.transfer(address(this), _amount));
  }

  function tradeWithEth(string memory _pool, uint256 _amount) public {
    // substracts the allowance
    ethAllowances[msg.sender] = ethAllowances[msg.sender].sub(_amount);

    // transfers the token to the sender's address
    uint256 weiWorth = pools[_pool].weiWorth;
    IERC20 token = factory.getErc20(pools[_pool].erc20Address);
    uint256 amountToTransfer = _amount.mul(weiWorth);
    require(token.transfer(msg.sender, amountToTransfer));
  }

  function getPoolSize(string memory _pool) public view returns(uint256 _size) {
    return pools[_pool].size;
  }

  function getWeiWorth(string memory _pool) public view returns(uint256 _price) {
    return pools[_pool].weiWorth;
  }

  function myEthAllowance() public view returns (uint256 _allowance) {
    return ethAllowances[msg.sender];
  }

  function myTokenAllowance(string memory _pool) public view returns (uint256 _allowance) {
    return pools[_pool].allowances[msg.sender];
  }
}