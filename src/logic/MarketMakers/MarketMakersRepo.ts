const assert = require('assert')

class MarketMakersRepo {
  lmsrMarketMaker: any
  collateralToken: any
  account: string | undefined

  constructor(contracts: any) {
    assert(contracts, '"contracts" is required')

    this.lmsrMarketMaker = contracts.lmsrMarketMaker
    this.collateralToken = contracts.collateralToken
    this.account = contracts.account
  }

  getAddress = async () => {
    return this.lmsrMarketMaker.options.address
  }

  getCollateralToken = async () => {
    return this.collateralToken
  }

  conditionIds = async (index: number) => {
    return this.lmsrMarketMaker.methods.conditionIds(index).call()
  }

  owner = async () => {
    return this.lmsrMarketMaker.methods.owner().call()
  }

  funding = async () => {
    return this.lmsrMarketMaker.methods.funding().call()
  }

  stage = async () => {
    return this.lmsrMarketMaker.methods.stage().call()
  }

  close = async (from: string) => {
    return this.lmsrMarketMaker.methods.close().send({ from })
  }

  calcNetCost = async (outcomeTokenAmounts: number[]) => {
    return this.lmsrMarketMaker.methods.calcNetCost(outcomeTokenAmounts).call()
  }

  calcMarginalPrice = async (outcomeIndex: number) => {
    const callOptions = this.account ? { from: this.account } : undefined
    if (callOptions) {
      return this.lmsrMarketMaker.methods.calcMarginalPrice(outcomeIndex).call(callOptions)
    }
    return this.lmsrMarketMaker.methods.calcMarginalPrice(outcomeIndex).call()
  }

  trade = async (tradeAmounts: number[], collateralLimit: number, from: string) => {
    return this.lmsrMarketMaker.methods.trade(tradeAmounts, collateralLimit).send({ from })
  }

  withdrawFees = async (from: string) => {
    // withdrawFees() takes no parameters in the contract
    // Call it as a transaction (not a call) since it modifies state
    return this.lmsrMarketMaker.methods.withdrawFees().send({ from })
  }

  pause = async (from: string) => {
    return this.lmsrMarketMaker.methods.pause().send({ from })
  }

  resume = async (from: string) => {
    return this.lmsrMarketMaker.methods.resume().send({ from })
  }

  changeFee = async (newFee: string | number, from: string) => {
    return this.lmsrMarketMaker.methods.changeFee(newFee).send({ from })
  }

  fee = async () => {
    return this.lmsrMarketMaker.methods.fee().call()
  }

  // Liquidity Provider functions
  addLiquidity = async (amount: string | number, from: string) => {
    return this.lmsrMarketMaker.methods.addLiquidity(amount).send({ from })
  }

  withdrawLiquidity = async (from: string) => {
    return this.lmsrMarketMaker.methods.withdrawLiquidity().send({ from })
  }

  redeemPositions = async (from: string) => {
    return this.lmsrMarketMaker.methods.redeemPositions().send({ from })
  }

  getPendingFees = async (provider: string) => {
    return this.lmsrMarketMaker.methods.getPendingFees(provider).call()
  }

  getSharePercentage = async (provider: string) => {
    return this.lmsrMarketMaker.methods.getSharePercentage(provider).call()
  }

  liquidityShares = async (provider: string) => {
    return this.lmsrMarketMaker.methods.liquidityShares(provider).call()
  }

  totalShares = async () => {
    return this.lmsrMarketMaker.methods.totalShares().call()
  }

  // ...
}

export default MarketMakersRepo
