//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Factory {
  function getErc20(address erc20TokenAddress) external returns (IERC20 erc20);
}

contract ERC20Factory is IERC20Factory {
  mapping(address => bool) private whitelist;

  constructor(address[] memory _whitelist) {
    for (uint i = 0; i < _whitelist.length; i++) {
      whitelist[_whitelist[i]] = true;
    }
  }

  function getErc20(address _erc20TokenAddress) public view override returns (IERC20 erc20) {
    require(whitelist[_erc20TokenAddress]);
    return IERC20(_erc20TokenAddress);
  }
}