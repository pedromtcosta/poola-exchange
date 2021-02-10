# Poola Exchange

This is a very simplistic exchange for trading [ERC-20](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/) tokens based on pools. Anyone can create a pool and deposit tokens to it. When you create your pool you set a price and the address of the token this pool will receive, then you can start depositing to it. Once people buy tokens from your pool, you get allowance and then you can use this allowance to either withdraw ETH or to buy tokens from other pools.

### Future work

This is mainly a study project. In theory, I believe this idea can be functional with some more work. Some things I plan to work on:
- functions for the pool owners to update their pools;
- pool owners should get have benefits, which would give them incentive to keep providing liquidity to the contract. How? No clue yet. Help please? :)

### Tech

As already stated, this project is mainly a study project. Here you will find what I believe to be a nice overall approach to developing smart contracts with Solidity. The Solidity code is quite simplistic, but I believe you can find some nice ideas about how to architecture the project:
- "Inversion of Control"-like idea using the IERC20Factory interface inside the main contract
- ERC20 factory class with whitelisted addresses
- Overall unit testing with a Facade for simplifying creation of mocks and execution of functions

### Deployments

The contracts cointained here are deployed to the [Ropsten](https://ropsten.etherscan.io) test network under the addresses:

>Poola: 0x22137554767684F24004579D89ACB8c2E6528A32

>ERC20Factory: 0xc88837C1FDA7a9Bd1D002209280914Df8FBb39C3

### See also

[Poola Exchange App](https://github.com/pedromtcosta/poola-exchange-app): React app for interacting with the Poola contract using Web3

[Incredibly Useful Tokens](https://github.com/pedromtcosta/incredibly-useful-tokens): Repository with tokens deployed to Ropsten for playing around with the contract and the REact app
