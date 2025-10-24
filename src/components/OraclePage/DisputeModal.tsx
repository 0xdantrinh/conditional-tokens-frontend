import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import { UmaOracleRepo } from 'src/logic/UmaOracle'
import { EnrichedQuestion } from './types'
import { UMA_CONFIG } from 'src/conf/uma'
import styles from './modal.module.css'

interface DisputeModalProps {
  question: EnrichedQuestion
  account: string
  oracleRepo: UmaOracleRepo
  web3: Web3
  onClose: () => void
  onDisputed: () => void
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  question,
  account,
  oracleRepo,
  web3,
  onClose,
  onDisputed,
}) => {
  const [step, setStep] = useState<'info' | 'approving' | 'disputing' | 'success'>('info')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [tokenAllowance, setTokenAllowance] = useState<string>('0')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')

  const rewardToken = UMA_CONFIG.BASE_SEPOLIA.rewardToken
  const optimisticOracle = UMA_CONFIG.BASE_SEPOLIA.optimisticOracle
  const requiredBond = question.proposalBond || '0'

  const loadTokenInfo = async () => {
    try {
      const erc20 = new web3.eth.Contract(
        [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { name: '_owner', type: 'address' },
              { name: '_spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            type: 'function',
          },
        ],
        rewardToken,
      )

      const balance = await erc20.methods.balanceOf(account).call()
      const allowance = await erc20.methods.allowance(account, optimisticOracle).call()

      setTokenBalance(balance as string)
      setTokenAllowance(allowance as string)
    } catch (err: any) {
      console.error('Error loading token info:', err)
      setError(`Failed to load token info: ${err.message}`)
    }
  }

  useEffect(() => {
    loadTokenInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async () => {
    try {
      setStep('approving')
      setError('')

      const erc20 = new web3.eth.Contract(
        [
          {
            constant: false,
            inputs: [
              { name: '_spender', type: 'address' },
              { name: '_value', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            type: 'function',
          },
        ],
        rewardToken,
      )

      // Approve enough for bond
      const approveTx = await erc20.methods
        .approve(optimisticOracle, requiredBond)
        .send({ from: account })

      console.log('Approval tx:', approveTx.transactionHash)
      await loadTokenInfo() // Reload to get new allowance
      setStep('info')
    } catch (err: any) {
      console.error('Approval error:', err)
      setError(`Approval failed: ${err.message}`)
      setStep('info')
    }
  }

  const handleDispute = async () => {
    try {
      setStep('disputing')
      setError('')

      if (!question.questionData) {
        throw new Error('Question data not available')
      }

      const tx = await oracleRepo.disputePrice(question.questionID)

      console.log('Dispute transaction:', tx.transactionHash)
      setTxHash(tx.transactionHash)
      setStep('success')
    } catch (err: any) {
      console.error('Dispute error:', err)
      setError(`Dispute failed: ${err.message}`)
      setStep('info')
    }
  }

  const needsApproval = BigInt(tokenAllowance) < BigInt(requiredBond)
  const hasInsufficientBalance = BigInt(tokenBalance) < BigInt(requiredBond)

  const formatAmount = (amount: string) => {
    return (parseFloat(amount) / 1e6).toFixed(2) // 6 decimals for USDC
  }

  const formatProposedAnswer = (proposedPrice: string) => {
    if (proposedPrice === '1000000000000000000') return 'YES ✅'
    if (proposedPrice === '0') return 'NO ❌'
    if (proposedPrice === '500000000000000000') return 'UNDECIDED 🤷'
    return `Unknown (${proposedPrice})`
  }

  const getTimeRemaining = () => {
    if (!question.oracleRequest) return 'Unknown'
    const now = Math.floor(Date.now() / 1000)
    const expiration = parseInt(question.oracleRequest.expirationTime)
    const diff = expiration - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>⚠️ Dispute Proposal</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {step === 'success' ? (
            <div className={styles.successSection}>
              <div className={styles.successIcon}>✅</div>
              <h3>Dispute Submitted Successfully!</h3>
              <p>Your dispute has been submitted to UMA's Optimistic Oracle.</p>
              <div className={styles.txInfo}>
                <p>
                  <strong>Transaction:</strong>
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Basescan ↗
                </a>
              </div>
              <div className={styles.infoBox} style={{ marginTop: '20px' }}>
                <p>
                  <strong>What happens next:</strong>
                </p>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Your dispute has escalated this question to UMA's DVM on Ethereum mainnet</li>
                  <li>UMA token holders will vote on the correct answer</li>
                  <li>Resolution is blocked until the DVM vote completes</li>
                  <li>
                    If the DVM sides with you, you'll receive your bond back plus the proposer's
                    bond
                  </li>
                  <li>If the DVM sides with the proposer, you'll forfeit your bond</li>
                </ul>
              </div>
              <button className={styles.primaryButton} onClick={onDisputed}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Question Info */}
              <div className={styles.section}>
                <h3>{question.parsedData.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                  {question.parsedData.description}
                </p>
              </div>

              {/* Current Proposal Info */}
              {question.oracleRequest && (
                <div className={styles.infoBox} style={{ backgroundColor: '#fffbeb' }}>
                  <p>
                    <strong>Current Proposal:</strong>{' '}
                    {formatProposedAnswer(question.oracleRequest.proposedPrice)}
                  </p>
                  <p style={{ marginTop: '5px' }}>
                    <strong>Proposed by:</strong> {question.oracleRequest.proposer.slice(0, 6)}...
                    {question.oracleRequest.proposer.slice(-4)}
                  </p>
                  <p style={{ marginTop: '5px' }}>
                    <strong>Time remaining:</strong> {getTimeRemaining()}
                  </p>
                </div>
              )}

              {/* Warning Box */}
              <div className={styles.warningBox}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                <p>
                  <strong>Important: Disputing requires posting a bond</strong>
                </p>
                <p style={{ marginTop: '10px' }}>
                  By disputing, you are claiming the proposed answer is incorrect. You must post a
                  bond of <strong>{formatAmount(requiredBond)} USDC</strong>.
                </p>
                <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '14px' }}>
                  <li>Your dispute will escalate to UMA's Data Verification Mechanism (DVM)</li>
                  <li>UMA token holders on Ethereum mainnet will vote on the correct answer</li>
                  <li>
                    If DVM agrees with you, you get your bond back + the proposer's bond + rewards
                  </li>
                  <li>If DVM sides with the proposer, you forfeit your bond</li>
                  <li>The market cannot be resolved until the DVM vote completes</li>
                </ul>
              </div>

              {/* Bond Requirements */}
              <div className={styles.section}>
                <h4>Bond Requirements</h4>
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <span>Required Bond:</span>
                    <strong>{formatAmount(requiredBond)} USDC</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <span>Your Balance:</span>
                    <span style={{ color: hasInsufficientBalance ? '#ef4444' : '#10b981' }}>
                      {formatAmount(tokenBalance)} USDC
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Allowance:</span>
                    <span>{formatAmount(tokenAllowance)} USDC</span>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className={styles.errorBox}>
                  <p>{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.modalFooter}>
                <button className={styles.secondaryButton} onClick={onClose}>
                  Cancel
                </button>

                {hasInsufficientBalance ? (
                  <button className={styles.primaryButton} disabled>
                    Insufficient Balance
                  </button>
                ) : needsApproval ? (
                  <button
                    className={styles.primaryButton}
                    onClick={handleApprove}
                    disabled={step === 'approving'}
                  >
                    {step === 'approving' ? 'Approving...' : 'Approve USDC'}
                  </button>
                ) : (
                  <button
                    className={styles.primaryButton}
                    onClick={handleDispute}
                    disabled={step === 'disputing'}
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    {step === 'disputing' ? 'Disputing...' : '⚠️ Submit Dispute'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DisputeModal
