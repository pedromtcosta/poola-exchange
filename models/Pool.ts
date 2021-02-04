import { BigNumber } from "ethers";

export interface Pool {
  erc20Address: string,
  owner: string,
  pricePerWei: BigNumber,
  size: BigNumber
}