import React, { useState, useEffect } from 'react'
import loadConditionalTokensRepo from 'src/logic/ConditionalTokens'
import loadMarketMakersRepo from 'src/logic/MarketMakers'
import { getConditionId, getPositionId } from 'src/utils/markets'
import BigNumber from 'bignumber.js'
import Layout from './Layout'

BigNumber.config({ EXPONENTIAL_AT: 50 })

type MarketProps = {
  web3: any
  account: string
  marketConfig: any
}

enum MarketStage {
  Running = 0,
  Paused = 1,
  Closed = 2,
}

let conditionalTokensRepo: any
let marketMakersRepo: any

const Market: React.FC<MarketProps> = ({ web3, account, marketConfig }) => {
  const [isConditionLoaded, setIsConditionLoaded] = useState<boolean>(false)
  const [selectedAmount, setSelectedAmount] = useState<string>('')
  const [selectedOutcomeToken, setSelectedOutcomeToken] = useState<number>(0)
  const [marketInfo, setMarketInfo] = useState<any>(undefined)
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [withdrawingFees, setWithdrawingFees] = useState<boolean>(false)
  const [pausingMarket, setPausingMarket] = useState<boolean>(false)
  const [resumingMarket, setResumingMarket] = useState<boolean>(false)
  const [changingFee, setChangingFee] = useState<boolean>(false)
  const [newFeeValue, setNewFeeValue] = useState<string>('')
  const [currentFee, setCurrentFee] = useState<number>(0)

  useEffect(() => {
    const init = async () => {
      try {
        conditionalTokensRepo = await loadConditionalTokensRepo(
          web3,
          marketConfig.lmsrAddress,
          account,
        )
        marketMakersRepo = await loadMarketMakersRepo(web3, marketConfig.lmsrAddress, account)
        await getMarketInfo()

        // Check if current account is the owner
        const owner = await marketMakersRepo.owner()
        console.log({ owner, account })
        setIsOwner(owner.toLowerCase() === account.toLowerCase())

        // Get current fee
        const feeValue = await marketMakersRepo.fee()
        setCurrentFee(feeValue)

        setIsConditionLoaded(true)
      } catch (err) {
        setIsConditionLoaded(false)
        console.error(err)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3, account, marketConfig])

  const getMarketInfo = async () => {
    if (!process.env.REACT_APP_ORACLE_ADDRESS) return

    try {
      // Use outcomeSlotCount from config if available, otherwise use outcomes array length, default to 2
      const outcomeCount = marketConfig.outcomeSlotCount || marketConfig.outcomes?.length || 2
      console.log('Loading market with outcomeCount:', outcomeCount)

      const defaultOutcomes = [
        { title: 'Yes', short: 'Yes' },
        { title: 'No', short: 'No' },
      ]

      const collateral = await marketMakersRepo.getCollateralToken()

      // Use conditionId from config if available, otherwise calculate it
      const conditionId =
        marketConfig.conditionId ||
        getConditionId(process.env.REACT_APP_ORACLE_ADDRESS, marketConfig.questionId, outcomeCount)
      console.log('ConditionId:', conditionId)

      const payoutDenominator = await conditionalTokensRepo.payoutDenominator(conditionId)
      console.log('PayoutDenominator:', payoutDenominator.toString())

      const outcomes = []
      for (let outcomeIndex = 0; outcomeIndex < outcomeCount; outcomeIndex++) {
        console.log(`Loading outcome ${outcomeIndex}...`)

        const indexSet = (
          outcomeIndex === 0 ? 1 : parseInt(Math.pow(10, outcomeIndex).toString(), 2)
        ).toString()
        const collectionId = await conditionalTokensRepo.getCollectionId(
          `0x${'0'.repeat(64)}`,
          conditionId,
          indexSet,
        )
        const positionId = getPositionId(collateral.address, collectionId)

        console.log(`Calling calcMarginalPrice(${outcomeIndex})...`)
        const probability = await marketMakersRepo.calcMarginalPrice(outcomeIndex)

        const balance = await conditionalTokensRepo.balanceOf(account, positionId)
        const payoutNumerator = await conditionalTokensRepo.payoutNumerators(
          conditionId,
          outcomeIndex,
        )

        // Handle both string arrays and object arrays for outcomes
        const outcomeData = marketConfig.outcomes?.[outcomeIndex] || defaultOutcomes[outcomeIndex]
        const outcomeTitle =
          typeof outcomeData === 'string'
            ? outcomeData
            : outcomeData?.title || `Outcome ${outcomeIndex + 1}`

        const outcome = {
          index: outcomeIndex,
          title: outcomeTitle,
          probability: new BigNumber(probability)
            .dividedBy(Math.pow(2, 64))
            .multipliedBy(100)
            .toFixed(2),
          balance: new BigNumber(balance).dividedBy(Math.pow(10, collateral.decimals)),
          payoutNumerator: payoutNumerator,
        }
        outcomes.push(outcome)
      }

      const marketData = {
        lmsrAddress: marketConfig.lmsrAddress,
        title: marketConfig.title,
        category: marketConfig.category,
        description: marketConfig.description || '',
        outcomes,
        stage: MarketStage[await marketMakersRepo.stage()],
        questionId: marketConfig.questionId,
        conditionId: conditionId,
        payoutDenominator: payoutDenominator,
      }

      setMarketInfo(marketData)

      // Update current fee
      const feeValue = await marketMakersRepo.fee()
      setCurrentFee(feeValue)
    } catch (err) {
      console.error('Error in getMarketInfo:', err)
      throw err
    }
  }

  const buy = async () => {
    const collateral = await marketMakersRepo.getCollateralToken()
    const formatedAmount = new BigNumber(selectedAmount).multipliedBy(
      new BigNumber(Math.pow(10, collateral.decimals)),
    )

    const outcomeTokenAmounts = Array.from(
      { length: marketInfo.outcomes.length },
      (value: any, index: number) =>
        index === selectedOutcomeToken ? formatedAmount : new BigNumber(0),
    )

    const cost = await marketMakersRepo.calcNetCost(outcomeTokenAmounts)

    // Use cost for deposit/approval but pass 0 as collateralLimit to disable slippage protection
    // This avoids issues with rounding differences between client and contract calcNetCost
    const costForDeposit = new BigNumber(Math.ceil(cost * 1.01)) // Small buffer for deposit

    const collateralBalance = await collateral.contract.balanceOf(account)
    if (costForDeposit.gt(collateralBalance)) {
      // Need to deposit ETH to get WETH (use buffered amount for safety)
      await collateral.contract.deposit({ value: costForDeposit.toString(), from: account })
    }

    // Check allowance and approve max uint256 if needed (one-time approval)
    const allowance = await collateral.contract.allowance(account, marketInfo.lmsrAddress)
    if (new BigNumber(allowance).lt(costForDeposit)) {
      // Approve maximum amount to avoid repeated approvals
      const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      await collateral.contract.approve(marketInfo.lmsrAddress, MAX_UINT256, {
        from: account,
      })
    }

    // Pass 0 as collateralLimit to disable protection (contract will use actual netCost)
    const tx = await marketMakersRepo.trade(outcomeTokenAmounts, 0, account)
    console.log({ tx })

    await getMarketInfo()
  }

  const sell = async () => {
    const collateral = await marketMakersRepo.getCollateralToken()
    const formatedAmount = new BigNumber(selectedAmount).multipliedBy(
      new BigNumber(Math.pow(10, collateral.decimals)),
    )

    const isApproved = await conditionalTokensRepo.isApprovedForAll(account, marketInfo.lmsrAddress)
    if (!isApproved) {
      await conditionalTokensRepo.setApprovalForAll(marketInfo.lmsrAddress, true, account)
    }

    const outcomeTokenAmounts = Array.from({ length: marketInfo.outcomes.length }, (v, i) =>
      i === selectedOutcomeToken ? formatedAmount.negated() : new BigNumber(0),
    )

    // Pass 0 as collateralLimit to disable protection (contract will use actual netCost)
    // This avoids issues with rounding differences between client and contract calcNetCost
    const tx = await marketMakersRepo.trade(outcomeTokenAmounts, 0, account)
    console.log({ tx })

    await getMarketInfo()
  }

  const redeem = async () => {
    const collateral = await marketMakersRepo.getCollateralToken()

    const indexSets = Array.from({ length: marketInfo.outcomes.length }, (v, i) =>
      i === 0 ? 1 : parseInt(Math.pow(10, i).toString(), 2),
    )

    const tx = await conditionalTokensRepo.redeemPositions(
      collateral.address,
      `0x${'0'.repeat(64)}`,
      marketInfo.conditionId,
      indexSets,
      account,
    )
    console.log({ tx })

    await getMarketInfo()
  }

  const close = async () => {
    const tx = await marketMakersRepo.close(account)
    console.log({ tx })

    await getMarketInfo()
  }

  const resolve = async (resolutionOutcomeIndex: number) => {
    const payouts = Array.from(
      { length: marketInfo.outcomes.length },
      (value: any, index: number) => (index === resolutionOutcomeIndex ? 1 : 0),
    )

    const tx = await conditionalTokensRepo.reportPayouts(marketInfo.questionId, payouts, account)
    console.log({ tx })

    await getMarketInfo()
  }

  const withdrawFees = async () => {
    if (!isOwner) {
      alert('Only the market owner can withdraw fees')
      return
    }

    setWithdrawingFees(true)
    try {
      const collateral = await marketMakersRepo.getCollateralToken()

      // Get current fee balance in the market maker contract
      const feeBalance = await collateral.contract.balanceOf(marketInfo.lmsrAddress)

      if (new BigNumber(feeBalance).isZero()) {
        alert('No fees available to withdraw')
        setWithdrawingFees(false)
        return
      }

      // Call withdrawFees on the market maker
      const tx = await marketMakersRepo.withdrawFees(account)
      console.log({ tx })

      // Truffle contracts return receipt directly in tx.receipt or tx object itself
      const receipt = tx.receipt || tx

      // Parse the AMMFeeWithdrawal event to get the fees amount
      let withdrawnAmount = feeBalance
      if (receipt && receipt.logs && receipt.logs.length > 0) {
        // Look for the AMMFeeWithdrawal event
        const feeWithdrawalLog = receipt.logs.find((log: any) => {
          // Event signature for AMMFeeWithdrawal(uint fees)
          return (
            log.topics &&
            log.topics.length > 0 &&
            log.topics[0] === '0xce1d35d26fbf6b3cc5cd924de10b5a52b08e484129ea7d93abc48d739fffe5b9'
          )
        })
        if (feeWithdrawalLog && feeWithdrawalLog.data) {
          withdrawnAmount = web3.eth.abi.decodeParameter('uint256', feeWithdrawalLog.data)
        }
      }

      const formattedAmount = new BigNumber(withdrawnAmount)
        .dividedBy(Math.pow(10, collateral.decimals))
        .toFixed(4)

      alert(`Successfully withdrew ${formattedAmount} WETH in fees!`)
      await getMarketInfo()
    } catch (err: any) {
      console.error('Error withdrawing fees:', err)
      if (err.message.includes('caller is not the owner')) {
        alert('Error: Only the owner can withdraw fees')
      } else {
        alert(`Error withdrawing fees: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setWithdrawingFees(false)
    }
  }

  const pauseMarket = async () => {
    if (!isOwner) {
      alert('Only the market owner can pause the market')
      return
    }

    if (marketInfo.stage !== 'Running') {
      alert('Market must be in Running state to pause')
      return
    }

    setPausingMarket(true)
    try {
      const tx = await marketMakersRepo.pause(account)
      console.log({ tx })
      alert('Market paused successfully!')
      await getMarketInfo()
    } catch (err: any) {
      console.error('Error pausing market:', err)
      alert(`Error pausing market: ${err.message || 'Unknown error'}`)
    } finally {
      setPausingMarket(false)
    }
  }

  const resumeMarket = async () => {
    if (!isOwner) {
      alert('Only the market owner can resume the market')
      return
    }

    if (marketInfo.stage !== 'Paused') {
      alert('Market must be in Paused state to resume')
      return
    }

    setResumingMarket(true)
    try {
      const tx = await marketMakersRepo.resume(account)
      console.log({ tx })
      alert('Market resumed successfully!')
      await getMarketInfo()
    } catch (err: any) {
      console.error('Error resuming market:', err)
      alert(`Error resuming market: ${err.message || 'Unknown error'}`)
    } finally {
      setResumingMarket(false)
    }
  }

  const handleChangeFee = async () => {
    if (!isOwner) {
      alert('Only the market owner can change fees')
      return
    }

    if (marketInfo.stage !== 'Paused') {
      alert('Market must be paused before changing fees')
      return
    }

    if (!newFeeValue || parseFloat(newFeeValue) < 0 || parseFloat(newFeeValue) > 100) {
      alert('Please enter a valid fee percentage between 0 and 100')
      return
    }

    setChangingFee(true)
    try {
      // Convert percentage to the contract's fee format
      // Contract uses uint64 where 10000000000000000 = 1%
      // FEE_RANGE constant is 10^16 (10000000000000000)
      // So 5% = 5 * 10^16
      const feeRange = '10000000000000000' // 10^16
      const newFeeInContract = new BigNumber(newFeeValue).multipliedBy(feeRange).toFixed(0)

      // Pass as string to avoid JavaScript number overflow
      const tx = await marketMakersRepo.changeFee(newFeeInContract, account)
      console.log({ tx })

      alert(`Fee changed to ${newFeeValue}% successfully!`)
      setNewFeeValue('')
      await getMarketInfo()
    } catch (err: any) {
      console.error('Error changing fee:', err)
      alert(`Error changing fee: ${err.message || 'Unknown error'}`)
    } finally {
      setChangingFee(false)
    }
  }

  const isMarketClosed =
    isConditionLoaded && MarketStage[marketInfo.stage].toString() === MarketStage.Closed.toString()
  const isMarketPaused =
    isConditionLoaded && MarketStage[marketInfo.stage].toString() === MarketStage.Paused.toString()
  const isMarketRunning =
    isConditionLoaded && MarketStage[marketInfo.stage].toString() === MarketStage.Running.toString()

  // Calculate current fee percentage for display
  // Contract uses uint64 where 10^16 = 1%, so just divide by 10^16 to get percentage
  const currentFeePercentage = new BigNumber(currentFee)
    .dividedBy('10000000000000000') // Divide by 10^16 (FEE_RANGE) to get percentage
    .toFixed(2)

  return (
    <Layout
      account={account}
      isConditionLoaded={isConditionLoaded}
      isMarketClosed={isMarketClosed}
      isMarketPaused={isMarketPaused}
      isMarketRunning={isMarketRunning}
      marketInfo={marketInfo}
      setSelectedAmount={setSelectedAmount}
      selectedAmount={selectedAmount}
      setSelectedOutcomeToken={setSelectedOutcomeToken}
      selectedOutcomeToken={selectedOutcomeToken}
      buy={buy}
      sell={sell}
      redeem={redeem}
      close={close}
      resolve={resolve}
      isOwner={isOwner}
      withdrawFees={withdrawFees}
      withdrawingFees={withdrawingFees}
      pauseMarket={pauseMarket}
      pausingMarket={pausingMarket}
      resumeMarket={resumeMarket}
      resumingMarket={resumingMarket}
      handleChangeFee={handleChangeFee}
      changingFee={changingFee}
      newFeeValue={newFeeValue}
      setNewFeeValue={setNewFeeValue}
      currentFeePercentage={currentFeePercentage}
    />
  )
}

export default Market
