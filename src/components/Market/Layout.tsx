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
