//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DummyToken is ERC20 {
  constructor(address _account, uint256 _initialBalace) ERC20("DummyToken", "DMT") {
    _mint(_account, _initialBalace);
  }
}