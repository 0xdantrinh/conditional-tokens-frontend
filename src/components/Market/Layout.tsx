import React from 'react'
import { Paper, Button, TextField, RadioGroup, FormControlLabel, Radio } from '@material-ui/core'
import styles from '../style.module.css'

type TradingFormProps = {
  isMarketClosed: boolean
  marketInfo: any
  setSelectedAmount: any
  setSelectedOutcomeToken: any
  selectedOutcomeToken: number
}

type TraderActionsProps = {
  marketInfo: any
  isMarketClosed: boolean
  selectedAmount: string
  redeem: any
  buy: any
  sell: any
}

type OperatorActionsProps = {
  isMarketClosed: boolean
  close: any
}

type OracleActionsProps = {
  isMarketClosed: boolean
  marketInfo: any
  resolve: any
}

type LayoutProps = {
  account: string
  isConditionLoaded: boolean
  isMarketClosed: boolean
  isMarketPaused: boolean
  isMarketRunning: boolean
  marketInfo: any
  setSelectedAmount: any
  selectedAmount: string
  setSelectedOutcomeToken: any
  selectedOutcomeToken: number
  buy: any
  sell: any
  redeem: any
  close: any
  resolve: any
  isOwner: boolean
  withdrawFees: any
  withdrawingFees: boolean
  pauseMarket: any
  pausingMarket: boolean
  resumeMarket: any
  resumingMarket: boolean
  handleChangeFee: any
  changingFee: boolean
  newFeeValue: string
  setNewFeeValue: any
  currentFeePercentage: string
  userShares: string
  totalShares: string
  pendingFees: string
  sharePercentage: string
  addLiquidity: any
  addingLiquidity: boolean
  removeLiquidity: any
  removingLiquidity: boolean
  liquidityAmount: string
  setLiquidityAmount: any
  sharesToRemove: string
  setSharesToRemove: any
  ethBalance: string
  wethBalance: string
  wethAllowance: string
  wrappingEth: boolean
  unwrappingWeth: boolean
  approvingWeth: boolean
  wrapAmount: string
  unwrapAmount: string
  setWrapAmount: any
  setUnwrapAmount: any
  wrapEth: any
  unwrapWeth: any
  approveWeth: any
}

const TradingForm: React.FC<TradingFormProps> = ({
  isMarketClosed,
  marketInfo,
  setSelectedAmount,
  setSelectedOutcomeToken,
  selectedOutcomeToken,
}) => (
  <>
    <div className={styles.inputContainer}>
      <TextField
        variant="filled"
        label="Collateral value"
        type="number"
        onChange={(e) => setSelectedAmount(e.target.value)}
        disabled={isMarketClosed}
      />
    </div>
    <RadioGroup
      defaultValue={0}
      onChange={(e) => setSelectedOutcomeToken(parseInt(e.target.value))}
      value={selectedOutcomeToken}
    >
      {marketInfo.outcomes.map((outcome: any, index: number) => (
        <div
          key={outcome.title}
          className={[
            styles.outcome,
            marketInfo.payoutDenominator > 0 && outcome.payoutNumerator > 0 && styles.rightOutcome,
            marketInfo.payoutDenominator > 0 &&
              !(outcome.payoutNumerator > 0) &&
              styles.wrongOutcome,
          ].join(' ')}
        >
          <FormControlLabel
            value={!isMarketClosed ? outcome.index : 'disabled'}
            control={<Radio color="primary" />}
            label={outcome.title}
          />
          <div className={styles.outcomeInfo}>Probability: {outcome.probability.toString()}%</div>
          <div className={styles.outcomeInfo}>
            My balance: {outcome.balance.toFixed(5).toString()}
          </div>
        </div>
      ))}
    </RadioGroup>
  </>
)

const TraderActions: React.FC<TraderActionsProps> = ({
  marketInfo,
  isMarketClosed,
  selectedAmount,
  redeem,
  buy,
  sell,
}) => (
  <>
    <h3>Trader actions:</h3>
    <div className={styles.actions}>
      <Button
        variant="contained"
        onClick={redeem}
        disabled={!isMarketClosed || !marketInfo.payoutDenominator}
      >
        Redeem
      </Button>
      <Button variant="contained" onClick={buy} disabled={isMarketClosed || !selectedAmount}>
        Buy
      </Button>
      <Button variant="contained" onClick={sell} disabled={isMarketClosed || !selectedAmount}>
        Sell
      </Button>
    </div>
  </>
)

const OperatorActions: React.FC<OperatorActionsProps> = ({ isMarketClosed, close }) => (
  <>
    <h3>Operator actions:</h3>
    <Button variant="contained" onClick={close} disabled={isMarketClosed}>
      Close
    </Button>
  </>
)

const OracleActions: React.FC<OracleActionsProps> = ({ isMarketClosed, marketInfo, resolve }) => (
  <>
    <h3>Oracle actions:</h3>
    <div className={styles.actions}>
      {marketInfo.outcomes.map((outcome: any, index: number) => (
        <Button
          key={outcome.short}
          variant="contained"
          onClick={() => resolve(index)}
          disabled={!isMarketClosed}
        >
          Resolve {outcome.title}
        </Button>
      ))}
    </div>
  </>
)

const Layout: React.FC<LayoutProps> = ({
  account,
  isConditionLoaded,
  isMarketClosed,
  isMarketPaused,
  isMarketRunning,
  marketInfo,
  setSelectedAmount,
  selectedAmount,
  setSelectedOutcomeToken,
  selectedOutcomeToken,
  buy,
  sell,
  redeem,
  close,
  resolve,
  isOwner,
  withdrawFees,
  withdrawingFees,
  pauseMarket,
  pausingMarket,
  resumeMarket,
  resumingMarket,
  handleChangeFee,
  changingFee,
  newFeeValue,
  setNewFeeValue,
  currentFeePercentage,
  userShares,
  totalShares,
  pendingFees,
  sharePercentage,
  addLiquidity,
  addingLiquidity,
  removeLiquidity,
  removingLiquidity,
  liquidityAmount,
  setLiquidityAmount,
  sharesToRemove,
  setSharesToRemove,
  ethBalance,
  wethBalance,
  wethAllowance,
  wrappingEth,
  unwrappingWeth,
  approvingWeth,
  wrapAmount,
  unwrapAmount,
  setWrapAmount,
  setUnwrapAmount,
  wrapEth,
  unwrapWeth,
  approveWeth,
}) => {
  return (
    <Paper className={styles.condition}>
      {isConditionLoaded ? (
        <>
          <div
            style={{ borderBottom: '1px solid #ddd', paddingBottom: '15px', marginBottom: '20px' }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '10px' }}>{marketInfo.title}</h2>
                {marketInfo.description && (
                  <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                    {marketInfo.description}
                  </p>
                )}
              </div>
              <div style={{ marginLeft: '20px', textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    backgroundColor:
                      marketInfo.stage === 'Running'
                        ? '#4caf50'
                        : marketInfo.stage === 'Closed'
                        ? '#f44336'
                        : '#ff9800',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {marketInfo.stage}
                </div>
              </div>
            </div>
            {marketInfo.category && (
              <div style={{ marginTop: '10px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {marketInfo.category}
                </span>
              </div>
            )}
          </div>
          <TradingForm
            isMarketClosed={isMarketClosed}
            marketInfo={marketInfo}
            setSelectedAmount={setSelectedAmount}
            setSelectedOutcomeToken={setSelectedOutcomeToken}
            selectedOutcomeToken={selectedOutcomeToken}
          />
          <TraderActions
            marketInfo={marketInfo}
            isMarketClosed={isMarketClosed}
            selectedAmount={selectedAmount}
            redeem={redeem}
            buy={buy}
            sell={sell}
          />

          {isOwner && (
            <>
              <h3>Owner actions:</h3>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  Current Fee: <strong>{currentFeePercentage}%</strong>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="contained"
                    onClick={withdrawFees}
                    disabled={withdrawingFees}
                    style={{ backgroundColor: '#2196f3', marginRight: '10px' }}
                  >
                    {withdrawingFees ? 'Withdrawing...' : 'Withdraw Fees'}
                  </Button>

                  {isMarketRunning && (
                    <Button
                      variant="contained"
                      onClick={pauseMarket}
                      disabled={pausingMarket}
                      style={{ backgroundColor: '#ff9800', marginRight: '10px' }}
                    >
                      {pausingMarket ? 'Pausing...' : 'Pause Market'}
                    </Button>
                  )}

                  {isMarketPaused && (
                    <Button
                      variant="contained"
                      onClick={resumeMarket}
                      disabled={resumingMarket}
                      style={{ backgroundColor: '#4caf50', marginRight: '10px' }}
                    >
                      {resumingMarket ? 'Resuming...' : 'Resume Market'}
                    </Button>
                  )}
                </div>

                {isMarketPaused && (
                  <div
                    style={{
                      marginTop: '15px',
                      padding: '15px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '5px',
                    }}
                  >
                    <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Change Fee</h4>
                    <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                      Market must be paused to change fees. Enter new fee percentage (0-100):
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TextField
                        variant="outlined"
                        label="New Fee %"
                        type="number"
                        value={newFeeValue}
                        onChange={(e) => setNewFeeValue(e.target.value)}
                        disabled={changingFee}
                        style={{ width: '150px' }}
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleChangeFee}
                        disabled={changingFee || !newFeeValue}
                        style={{ backgroundColor: '#9c27b0' }}
                      >
                        {changingFee ? 'Changing...' : 'Change Fee'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Liquidity Provider Dashboard */}
          {parseFloat(userShares) > 0 && (
            <>
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>
                  💧 Your Liquidity Position
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px',
                  }}
                >
                  <div
                    style={{
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>
                      Your LP Shares
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(parseFloat(userShares) / 1e18).toFixed(4)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>
                      Pool Ownership
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(parseFloat(sharePercentage) / 100).toFixed(2)}%
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '15px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>
                      Pending Fees
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                      {(parseFloat(pendingFees) / 1e18).toFixed(6)} WETH
                    </div>
                  </div>
                </div>
                {parseFloat(pendingFees) > 0 && (
                  <Button
                    variant="contained"
                    onClick={withdrawFees}
                    disabled={withdrawingFees}
                    style={{ backgroundColor: '#4caf50', marginBottom: '10px' }}
                  >
                    {withdrawingFees ? 'Claiming...' : '💰 Claim Fees'}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* WETH Preparation Widget */}
          {isMarketRunning && (
            <>
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                }}
              >
                <h3 style={{ marginBottom: '15px', color: '#9c27b0' }}>💰 WETH Preparation</h3>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '15px' }}>
                  Before adding liquidity, ensure you have enough WETH (Wrapped ETH) and approve the
                  MarketMaker contract.
                </p>

                {/* Balance Display */}
                <div
                  style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px' }}
                >
                  <div>
                    <strong>ETH Balance:</strong>{' '}
                    {(parseFloat(ethBalance || '0') / 1e18).toFixed(4)} ETH
                  </div>
                  <div>
                    <strong>WETH Balance:</strong>{' '}
                    <span
                      style={{ color: parseFloat(wethBalance || '0') > 0 ? '#4caf50' : '#666' }}
                    >
                      {(parseFloat(wethBalance || '0') / 1e18).toFixed(4)} WETH
                    </span>
                  </div>
                </div>

                {/* Wrap ETH Section */}
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>
                    Step 1a: Wrap ETH → WETH
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <TextField
                      variant="filled"
                      label="ETH Amount to Wrap"
                      type="number"
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value)}
                      disabled={wrappingEth}
                      style={{ flex: 1 }}
                      inputProps={{ min: 0, step: 0.001 }}
                    />
                    <Button
                      variant="contained"
                      onClick={wrapEth}
                      disabled={wrappingEth || !wrapAmount || parseFloat(wrapAmount) <= 0}
                      style={{ backgroundColor: '#9c27b0', color: 'white' }}
                    >
                      {wrappingEth ? 'Wrapping...' : 'Wrap ETH'}
                    </Button>
                  </div>
                </div>

                {/* Unwrap WETH Section */}
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>
                    Step 1b: Unwrap WETH → ETH (Optional)
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <TextField
                      variant="filled"
                      label="WETH Amount to Unwrap"
                      type="number"
                      value={unwrapAmount}
                      onChange={(e) => setUnwrapAmount(e.target.value)}
                      disabled={unwrappingWeth}
                      style={{ flex: 1 }}
                      inputProps={{ min: 0, step: 0.001 }}
                    />
                    <Button
                      variant="contained"
                      onClick={unwrapWeth}
                      disabled={unwrappingWeth || !unwrapAmount || parseFloat(unwrapAmount) <= 0}
                      style={{ backgroundColor: '#673ab7', color: 'white' }}
                    >
                      {unwrappingWeth ? 'Unwrapping...' : 'Unwrap WETH'}
                    </Button>
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                    💡 Convert WETH back to ETH if you have excess WETH
                  </div>
                </div>

                {/* Approve WETH Section */}
                <div style={{ marginBottom: '10px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>
                    Step 2: Approve WETH Spending
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <strong>Current Allowance:</strong>{' '}
                      <span
                        style={{
                          color: parseFloat(wethAllowance || '0') > 0 ? '#4caf50' : '#ff9800',
                          fontWeight: 'bold',
                        }}
                      >
                        {parseFloat(wethAllowance || '0') > 1e30
                          ? '∞ (Unlimited)'
                          : `${(parseFloat(wethAllowance || '0') / 1e18).toFixed(4)} WETH`}
                      </span>
                    </div>
                    <Button
                      variant="contained"
                      onClick={approveWeth}
                      disabled={
                        approvingWeth ||
                        parseFloat(wethAllowance || '0') > 1e30 ||
                        !liquidityAmount ||
                        parseFloat(liquidityAmount) <= 0
                      }
                      style={{
                        backgroundColor:
                          parseFloat(wethAllowance || '0') > 1e30 ? '#4caf50' : '#ff9800',
                        color: 'white',
                      }}
                    >
                      {approvingWeth
                        ? 'Approving...'
                        : parseFloat(wethAllowance || '0') > 1e30
                        ? '✓ Approved'
                        : 'Approve WETH'}
                    </Button>
                  </div>
                  {(!liquidityAmount || parseFloat(liquidityAmount) <= 0) && (
                    <div style={{ fontSize: '12px', color: '#ff9800', marginTop: '5px' }}>
                      ⚠️ Enter liquidity amount below first
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add Liquidity Section */}
          {isMarketRunning && (
            <>
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: '#2196f3' }}>➕ Add Liquidity</h3>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                  Add collateral to the pool and earn trading fees proportional to your share.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <TextField
                    variant="filled"
                    label="WETH Amount"
                    type="number"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    disabled={addingLiquidity}
                    style={{ flex: 1 }}
                    inputProps={{ min: 0, step: 0.001 }}
                  />
                  <Button
                    variant="contained"
                    onClick={addLiquidity}
                    disabled={
                      addingLiquidity || !liquidityAmount || parseFloat(liquidityAmount) <= 0
                    }
                    style={{ backgroundColor: '#2196f3' }}
                  >
                    {addingLiquidity ? 'Adding...' : 'Add Liquidity'}
                  </Button>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
                  Total Pool Shares: {(parseFloat(totalShares) / 1e18).toFixed(4)}
                </div>
              </div>
            </>
          )}

          {/* Remove Liquidity Section */}
          {isMarketPaused && parseFloat(userShares) > 0 && (
            <>
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: '#ff9800' }}>➖ Remove Liquidity</h3>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                  Market is paused. You can now remove your liquidity.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <TextField
                    variant="filled"
                    label="Shares to Remove"
                    type="number"
                    value={sharesToRemove}
                    onChange={(e) => setSharesToRemove(e.target.value)}
                    disabled={removingLiquidity}
                    style={{ flex: 1 }}
                    inputProps={{
                      min: 0,
                      max: parseFloat(userShares) / 1e18,
                      step: 0.0001,
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={removeLiquidity}
                    disabled={
                      removingLiquidity || !sharesToRemove || parseFloat(sharesToRemove) <= 0
                    }
                    style={{ backgroundColor: '#ff9800' }}
                  >
                    {removingLiquidity ? 'Removing...' : 'Remove Liquidity'}
                  </Button>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
                  Your Shares: {(parseFloat(userShares) / 1e18).toFixed(4)}
                </div>
              </div>
            </>
          )}

          {account === process.env.REACT_APP_OPERATOR_ADDRESS && (
            <OperatorActions isMarketClosed={isMarketClosed} close={close} />
          )}
          {account === process.env.REACT_APP_ORACLE_ADDRESS && (
            <OracleActions
              isMarketClosed={isMarketClosed}
              marketInfo={marketInfo}
              resolve={resolve}
            />
          )}
        </>
      ) : (
        <div>Loading...</div>
      )}
    </Paper>
  )
}

export default Layout
