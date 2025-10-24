const assert = require('assert')

class ConditionalTokensRepo {
  conditionalTokens: any

  constructor(contracts: any) {
    assert(contracts, '"contracts" is required')

    this.conditionalTokens = contracts.conditionalTokens
  }

  balanceOf = async (account: string, positionId: number) => {
    return this.conditionalTokens.methods.balanceOf(account, positionId).call()
  }

  getOutcomeSlotCount = async (id: string) => {
    return this.conditionalTokens.methods.getOutcomeSlotCount(id).call()
  }

  getCollectionId = async (parentCollectionId: string, conditionId: string, indexSet: number[]) => {
    return this.conditionalTokens.methods
      .getCollectionId(parentCollectionId, conditionId, indexSet)
      .call()
  }

  payoutDenominator = async (conditionId: string) => {
    return this.conditionalTokens.methods.payoutDenominator(conditionId).call()
  }

  payoutNumerators = async (conditionId: string, outcomeIndex: number) => {
    return this.conditionalTokens.methods.payoutNumerators(conditionId, outcomeIndex).call()
  }

  isApprovedForAll = async (account: string, lmsrMarketMakerAddress: string) => {
    return this.conditionalTokens.methods.isApprovedForAll(account, lmsrMarketMakerAddress).call()
  }

  setApprovalForAll = async (lmsrMarketMakerAddress: string, approved: boolean, from: string) => {
    return this.conditionalTokens.methods
      .setApprovalForAll(lmsrMarketMakerAddress, approved)
      .send({ from })
  }

  reportPayouts = async (questionId: string, payouts: number[], from: string) => {
    return this.conditionalTokens.methods.reportPayouts(questionId, payouts).send({ from })
  }

  redeemPositions = async (
    collateralAddress: string,
    parentCollectionId: string,
    marketConditionId: string,
    indexSets: number[],
    from: string,
  ) => {
    return this.conditionalTokens.methods
      .redeemPositions(collateralAddress, parentCollectionId, marketConditionId, indexSets)
      .send({ from })
  }

  // ...
}

export default ConditionalTokensRepo
