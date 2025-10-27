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

  // LP state
  const [userShares, setUserShares] = useState<string>('0')
  const [totalShares, setTotalShares] = useState<string>('0')
  const [pendingFees, setPendingFees] = useState<string>('0')
  const [sharePercentage, setSharePercentage] = useState<string>('0')
  const [addingLiquidity, setAddingLiquidity] = useState<boolean>(false)
  const [removingLiquidity, setRemovingLiquidity] = useState<boolean>(false)
  const [liquidityAmount, setLiquidityAmount] = useState<string>('')
  const [sharesToRemove, setSharesToRemove] = useState<string>('')
  const [redeemingPositions, setRedeemingPositions] = useState<boolean>(false)

  // WETH preparation state
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [wethBalance, setWethBalance] = useState<string>('0')
  const [wethAllowance, setWethAllowance] = useState<string>('0')
  const [wrappingEth, setWrappingEth] = useState<boolean>(false)
  const [unwrappingWeth, setUnwrappingWeth] = useState<boolean>(false)
  const [approvingWeth, setApprovingWeth] = useState<boolean>(false)
  const [wrapAmount, setWrapAmount] = useState<string>('')
  const [unwrapAmount, setUnwrapAmount] = useState<string>('')

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

        // Load LP info
        await loadLPInfo()

        // Load WETH info
        await loadWethInfo()

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

      const umaQuestionId = marketConfig.umaQuestionId || marketConfig.questionId
      if (!umaQuestionId) {
        throw new Error(`Market config for ${marketConfig.title} is missing umaQuestionId`)
      }

      // Use conditionId from config if available, otherwise calculate it
      const conditionId =
        marketConfig.conditionId ||
        getConditionId(process.env.REACT_APP_ORACLE_ADDRESS, umaQuestionId, outcomeCount)
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
        umaQuestionId,
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

  const loadLPInfo = async () => {
    try {
      const shares = await marketMakersRepo.liquidityShares(account)
      const total = await marketMakersRepo.totalShares()
      const pending = await marketMakersRepo.getPendingFees(account)
      const percentage = await marketMakersRepo.getSharePercentage(account)

      setUserShares(shares.toString())
      setTotalShares(total.toString())
      setPendingFees(pending.toString())
      setSharePercentage(percentage.toString())
    } catch (err) {
      console.error('Error loading LP info:', err)
    }
  }

  const loadWethInfo = async () => {
    try {
      const collateral = await marketMakersRepo.getCollateralToken()

      // Get ETH balance
      const ethBal = await web3.eth.getBalance(account)
      setEthBalance(ethBal)

      // Get WETH balance
      const wethBal = await collateral.contract.methods.balanceOf(account).call()
      setWethBalance(wethBal)

      // Get WETH allowance for market maker
      const allowance = await collateral.contract.methods
        .allowance(account, marketConfig.lmsrAddress)
        .call()
      setWethAllowance(allowance)
    } catch (err) {
      console.error('Error loading WETH info:', err)
    }
  }

  const wrapEth = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) {
      alert('Please enter a valid amount to wrap')
      return
    }

    setWrappingEth(true)
    try {
      const collateral = await marketMakersRepo.getCollateralToken()
      const amount = new BigNumber(wrapAmount).multipliedBy(
        new BigNumber(Math.pow(10, collateral.decimals)),
      )

      // Check ETH balance
      const ethBal = await web3.eth.getBalance(account)
      if (new BigNumber(ethBal).lt(amount)) {
        alert(
          `Insufficient ETH balance. You have ${new BigNumber(ethBal)
            .dividedBy(Math.pow(10, 18))
            .toFixed(4)} ETH but need ${wrapAmount} ETH`,
        )
        setWrappingEth(false)
        return
      }

      // Wrap ETH to WETH
      await collateral.contract.methods.deposit().send({ value: amount.toString(), from: account })

      alert(`Successfully wrapped ${wrapAmount} ETH to WETH!`)
      setWrapAmount('')
      await loadWethInfo()
    } catch (err: any) {
      console.error('Error wrapping ETH:', err)
      alert(`Error wrapping ETH: ${err.message || 'Transaction failed'}`)
    } finally {
      setWrappingEth(false)
    }
  }

  const unwrapWeth = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0) {
      alert('Please enter a valid amount to unwrap')
      return
    }

    setUnwrappingWeth(true)
    try {
      const collateral = await marketMakersRepo.getCollateralToken()
      const amount = new BigNumber(unwrapAmount).multipliedBy(
        new BigNumber(Math.pow(10, collateral.decimals)),
      )

      // Check WETH balance
      const wethBal = await collateral.contract.methods.balanceOf(account).call()
      if (new BigNumber(wethBal).lt(amount)) {
        alert(
          `Insufficient WETH balance. You have ${new BigNumber(wethBal)
            .dividedBy(Math.pow(10, collateral.decimals))
            .toFixed(4)} WETH but need ${unwrapAmount} WETH`,
        )
        setUnwrappingWeth(false)
        return
      }

      // Unwrap WETH to ETH
      await collateral.contract.methods.withdraw(amount.toString()).send({ from: account })

      alert(`Successfully unwrapped ${unwrapAmount} WETH to ETH!`)
      setUnwrapAmount('')
      await loadWethInfo()
    } catch (err: any) {
      console.error('Error unwrapping WETH:', err)
      alert(`Error unwrapping WETH: ${err.message || 'Transaction failed'}`)
    } finally {
      setUnwrappingWeth(false)
    }
  }

  const approveWeth = async () => {
    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      alert('Please enter the liquidity amount first')
      return
    }

    setApprovingWeth(true)
    try {
      const collateral = await marketMakersRepo.getCollateralToken()
      const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

      // Approve maximum amount to avoid repeated approvals
      await collateral.contract.methods
        .approve(marketConfig.lmsrAddress, MAX_UINT256)
        .send({ from: account })

      alert('Successfully approved MarketMaker to spend your WETH!')
      await loadWethInfo()
    } catch (err: any) {
      console.error('Error approving WETH:', err)
      alert(`Error approving WETH: ${err.message || 'Transaction failed'}`)
    } finally {
      setApprovingWeth(false)
    }
  }

  const addLiquidity = async () => {
    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (marketInfo.stage !== 'Running') {
      alert('Cannot add liquidity - market is not active')
      return
    }

    setAddingLiquidity(true)
    try {
      const collateral = await marketMakersRepo.getCollateralToken()
      const amount = new BigNumber(liquidityAmount).multipliedBy(
        new BigNumber(Math.pow(10, collateral.decimals)),
      )

      // Check WETH balance
      const wethBal = await collateral.contract.methods.balanceOf(account).call()
      if (new BigNumber(wethBal).lt(amount)) {
        const required = new BigNumber(amount)
          .dividedBy(Math.pow(10, collateral.decimals))
          .toFixed(4)
        const available = new BigNumber(wethBal)
          .dividedBy(Math.pow(10, collateral.decimals))
          .toFixed(4)
        alert(
          `Insufficient WETH balance. You have ${available} WETH but need ${required} WETH. Please wrap more ETH first.`,
        )
        setAddingLiquidity(false)
        return
      }

      // Check allowance and approve if needed
      const allowance = await collateral.contract.methods
        .allowance(account, marketConfig.lmsrAddress)
        .call()
      if (new BigNumber(allowance).lt(amount)) {
        alert(
          'Insufficient WETH allowance. Please approve the MarketMaker to spend your WETH first.',
        )
        setAddingLiquidity(false)
        return
      }

      const tx = await marketMakersRepo.addLiquidity(amount.toString(), account)
      console.log({ tx })

      alert('Liquidity added successfully!')
      setLiquidityAmount('')
      await getMarketInfo()
      await loadLPInfo()
      await loadWethInfo()
    } catch (err: any) {
      console.error('Error adding liquidity:', err)
      alert(`Error adding liquidity: ${err.message || 'Unknown error'}`)
    } finally {
      setAddingLiquidity(false)
    }
  }

  const redeemMarketPositions = async () => {
    if (marketInfo.stage !== 'Closed') {
      alert('Cannot redeem positions - market must be closed first')
      return
    }

    setRedeemingPositions(true)
    try {
      const tx = await marketMakersRepo.redeemPositions(account)
      console.log({ tx })

      alert('Market positions redeemed successfully! LPs can now withdraw their liquidity.')
      await getMarketInfo()
      await loadLPInfo()
    } catch (err: any) {
      console.error('Error redeeming market positions:', err)
      // Check if it's the "result not received" error
      if (err.message && err.message.includes('result for condition not received yet')) {
        alert(
          'Cannot redeem yet: Oracle has not reported the result. Please wait for the market to be resolved by the oracle.',
        )
      } else {
        alert(`Error redeeming positions: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setRedeemingPositions(false)
    }
  }

  const withdrawLiquidity = async () => {
    if (parseFloat(userShares) <= 0) {
      alert('You have no liquidity shares to withdraw')
      return
    }

    if (marketInfo.stage !== 'Closed') {
      alert('Cannot withdraw liquidity - market must be closed and resolved first')
      return
    }

    setRemovingLiquidity(true)
    try {
      const tx = await marketMakersRepo.withdrawLiquidity(account)
      console.log({ tx })

      alert('Liquidity withdrawn successfully!')
      setSharesToRemove('')
      await getMarketInfo()
      await loadLPInfo()
    } catch (err: any) {
      console.error('Error withdrawing liquidity:', err)
      alert(`Error withdrawing liquidity: ${err.message || 'Unknown error'}`)
    } finally {
      setRemovingLiquidity(false)
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

    const collateralBalance = await collateral.contract.methods.balanceOf(account).call()
    if (costForDeposit.gt(collateralBalance)) {
      // Need to deposit ETH to get WETH (use buffered amount for safety)
      await collateral.contract.methods
        .deposit()
        .send({ value: costForDeposit.toString(), from: account })
    }

    // Check allowance and approve max uint256 if needed (one-time approval)
    const allowance = await collateral.contract.methods
      .allowance(account, marketConfig.lmsrAddress)
      .call()
    if (new BigNumber(allowance).lt(costForDeposit)) {
      // Approve maximum amount to avoid repeated approvals
      const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      await collateral.contract.methods.approve(marketConfig.lmsrAddress, MAX_UINT256).send({
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

    const isApproved = await conditionalTokensRepo.isApprovedForAll(
      account,
      marketConfig.lmsrAddress,
    )
    if (!isApproved) {
      await conditionalTokensRepo.setApprovalForAll(marketConfig.lmsrAddress, true, account)
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
    if (!marketInfo?.umaQuestionId) {
      alert('Unable to resolve: UMA question id missing for this market')
      return
    }

    const payouts = Array.from(
      { length: marketInfo.outcomes.length },
      (value: any, index: number) => (index === resolutionOutcomeIndex ? 1 : 0),
    )

    const tx = await conditionalTokensRepo.reportPayouts(marketInfo.umaQuestionId, payouts, account)
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
      const feeBalance = await collateral.contract.methods
        .balanceOf(marketConfig.lmsrAddress)
        .call()

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
      userShares={userShares}
      totalShares={totalShares}
      pendingFees={pendingFees}
      sharePercentage={sharePercentage}
      addLiquidity={addLiquidity}
      addingLiquidity={addingLiquidity}
      redeemMarketPositions={redeemMarketPositions}
      redeemingPositions={redeemingPositions}
      withdrawLiquidity={withdrawLiquidity}
      removingLiquidity={removingLiquidity}
      liquidityAmount={liquidityAmount}
      setLiquidityAmount={setLiquidityAmount}
      sharesToRemove={sharesToRemove}
      setSharesToRemove={setSharesToRemove}
      ethBalance={ethBalance}
      wethBalance={wethBalance}
      wethAllowance={wethAllowance}
      wrappingEth={wrappingEth}
      unwrappingWeth={unwrappingWeth}
      approvingWeth={approvingWeth}
      wrapAmount={wrapAmount}
      unwrapAmount={unwrapAmount}
      setWrapAmount={setWrapAmount}
      setUnwrapAmount={setUnwrapAmount}
      wrapEth={wrapEth}
      unwrapWeth={unwrapWeth}
      approveWeth={approveWeth}
    />
  )
}

export default Market
