# Poola Exchange

This is a WIP for a exchange based on liquidity pools. The general idea is that addresses can deposit an amount of a specific [ERC-20](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/) token together with an amount of ETH which represents the same amount of what was deposited of the chosen token and by doing that, they have "withdraw allowances" based on how much of they deposited (both in token and ETH).

## General funcioning idea
Having these liquidity pools is great when the values are coherent, but addresses can try depositing amounts which doesn't correspond to reality in order to take advantage of the allowances. That's why we need some measures to control the prices of the tokens and how much of the allowance an address can withdraw in a specific point.

Basically when you make a deposit, you create a pool which contains the amount of the token you deposited, with a corressponding price for the token**. You also get an allowace for the ETH you deposited, which you can use right away and an allowance for the token you deposited, which gets released for you to use once someone pays the price you set on the pool you created during your deposit.

You can also deposit tokens to an already created pool if you agree with the price of the token which is set there. Otherwise, you can create a new pool with a price which you think makes more sense for that token.

The withdraw allowance is per pool and it is shared, which means once someone buys tokens from a specific pool anyone that deposited that token to that pool may make use of the allowance, and once they do it, the allowance for the others will decrease. This allowance however is maxed to the amount of tokes which were bought on that pool, so if somone bought 100 of the given token, people can only use up to 100 of their allowance.

### Deployments
#### Ropsten

ERC20Factory: 0x719769CED9F4f9236e23e8794404982E890090a4

Poola: 0xF129acEb9d8117a1397A61BaC82c2bda83753250

### Motivation and other things
I have no ideaif this is a decent model for an exchange. Ideally there should probably be a way the reward people that create liquidity on the pools, but I will think about this some other time, I am creating this project mostly for fun :)
