import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import { UmaOracleRepo } from 'src/logic/UmaOracle'
import { UMA_CONFIG } from 'src/conf/uma'
import { EnrichedQuestion } from './types'
import styles from './modal.module.css'

interface ProposeAnswerModalProps {
  question: EnrichedQuestion
  account: string
  oracleRepo: UmaOracleRepo
  web3: Web3
  onClose: () => void
  onProposed: () => void
}

type Answer = 'yes' | 'no' | 'undecided'

const ProposeAnswerModal: React.FC<ProposeAnswerModalProps> = ({
  question,
  account,
  oracleRepo,
  web3,
  onClose,
  onProposed,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null)
  const [bondAmount, setBondAmount] = useState<string>('0')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [tokenAllowance, setTokenAllowance] = useState<string>('0')
  const [approving, setApproving] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const rewardTokenAddress = UMA_CONFIG.BASE_SEPOLIA.rewardToken

  // Load token balance and allowance
  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        // Get ERC20 contract
        const erc20ABI = [
          {
            constant: true,
            inputs: [{ name: 'account', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            type: 'function',
          },
          {
            constant: true,
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            type: 'function',
          },
          {
            constant: false,
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            type: 'function',
          },
        ]

        const tokenContract = new web3.eth.Contract(erc20ABI as any, rewardTokenAddress)

        const balance = await tokenContract.methods.balanceOf(account).call()
        const allowance = await tokenContract.methods
          .allowance(account, UMA_CONFIG.BASE_SEPOLIA.optimisticOracle)
          .call()

        setTokenBalance(balance)
        setTokenAllowance(allowance)

        // Get bond amount from question data
        if (question.questionData) {
          setBondAmount(question.questionData.proposalBond)
        }
      } catch (err: any) {
        console.error('Error loading token info:', err)
        setError('Failed to load token information')
      }
    }

    loadTokenInfo()
  }, [account, web3, rewardTokenAddress, question])

  const handleApprove = async () => {
    try {
      setApproving(true)
      setError(null)

      const erc20ABI = [
        {
          constant: false,
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          type: 'function',
        },
      ]

      const tokenContract = new web3.eth.Contract(erc20ABI as any, rewardTokenAddress)

      await tokenContract.methods
        .approve(UMA_CONFIG.BASE_SEPOLIA.optimisticOracle, bondAmount)
        .send({ from: account })

      // Update allowance
      setTokenAllowance(bondAmount)
      setApproving(false)
    } catch (err: any) {
      console.error('Error approving tokens:', err)
      setError(err.message || 'Failed to approve tokens')
      setApproving(false)
    }
  }

  const handlePropose = async () => {
    if (!selectedAnswer) return

    try {
      setProposing(true)
      setError(null)

      // Get proposed price based on selection
      const proposedPrice =
        selectedAnswer === 'yes'
          ? UMA_CONFIG.BASE_SEPOLIA.ANSWER_YES
          : selectedAnswer === 'no'
          ? UMA_CONFIG.BASE_SEPOLIA.ANSWER_NO
          : UMA_CONFIG.BASE_SEPOLIA.ANSWER_UNDECIDED

      // Propose price to OptimisticOracle
      const tx = await oracleRepo.proposePrice(question.questionID, proposedPrice, account)
      setTxHash(tx.transactionHash)

      // Wait a bit for confirmation
      setTimeout(() => {
        onProposed()
      }, 2000)
    } catch (err: any) {
      console.error('Error proposing answer:', err)
      setError(err.message || 'Failed to propose answer')
      setProposing(false)
    }
  }

  const formatAmount = (amount: string, decimals: number = 6) => {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2)
  }

  const needsApproval = parseFloat(tokenAllowance) < parseFloat(bondAmount)
  const insufficientBalance = parseFloat(tokenBalance) < parseFloat(bondAmount)

  const getBasescanUrl = (hash: string) => {
    return `https://sepolia.basescan.org/tx/${hash}`
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Propose Answer</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Question Info */}
          <div className={styles.section}>
            <h3>{question.parsedData.title}</h3>
            {question.parsedData.description && (
              <p className={styles.description}>{question.parsedData.description}</p>
            )}
          </div>

          {/* Bond Requirements */}
          <div className={styles.section}>
            <div
              style={{
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#e65100' }}>
                ⚠️ Bond Requirements
              </div>
              <div style={{ fontSize: '14px', color: '#424242' }}>
                You must bond <strong>{formatAmount(bondAmount)} tokens</strong> to propose an
                answer.
                <br />
                This will be returned if your answer is not disputed.
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                Note: Approval and proposal go to OptimisticOracleV2, not the adapter.
              </div>
            </div>
          </div>

          {/* Balance Info */}
          <div className={styles.section}>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Your Balance:</span>
                <span className={styles.value}>{formatAmount(tokenBalance)} tokens</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Required Bond:</span>
                <span className={styles.value}>{formatAmount(bondAmount)} tokens</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Current Allowance:</span>
                <span className={styles.value}>{formatAmount(tokenAllowance)} tokens</span>
              </div>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {insufficientBalance && (
            <div className={styles.section}>
              <div className={styles.error}>
                ❌ Insufficient balance. You have {formatAmount(tokenBalance)} tokens but need{' '}
                {formatAmount(bondAmount)} tokens.
              </div>
            </div>
          )}

          {/* Answer Selection */}
          {!insufficientBalance && !txHash && (
            <div className={styles.section}>
              <h4>Select Outcome</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => setSelectedAnswer('yes')}
                  disabled={approving || proposing}
                  style={{
                    padding: '16px',
                    border: selectedAnswer === 'yes' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: selectedAnswer === 'yes' ? '#e8f5e9' : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: selectedAnswer === 'yes' ? 600 : 400,
                  }}
                >
                  ✅ YES (100%)
                </button>
                <button
                  onClick={() => setSelectedAnswer('no')}
                  disabled={approving || proposing}
                  style={{
                    padding: '16px',
                    border: selectedAnswer === 'no' ? '2px solid #f44336' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: selectedAnswer === 'no' ? '#ffebee' : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: selectedAnswer === 'no' ? 600 : 400,
                  }}
                >
                  ❌ NO (0%)
                </button>
                <button
                  onClick={() => setSelectedAnswer('undecided')}
                  disabled={approving || proposing}
                  style={{
                    padding: '16px',
                    border:
                      selectedAnswer === 'undecided' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: selectedAnswer === 'undecided' ? '#fff3e0' : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: selectedAnswer === 'undecided' ? 600 : 400,
                  }}
                >
                  🤷 UNDECIDED (50%)
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!insufficientBalance && !txHash && (
            <div className={styles.section}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={approving || proposing || !selectedAnswer}
                    className={styles.confirmButton}
                    style={{ flex: 1 }}
                  >
                    {approving ? 'Approving...' : '1. Approve Tokens'}
                  </button>
                ) : (
                  <button
                    onClick={handlePropose}
                    disabled={!selectedAnswer || proposing}
                    className={styles.confirmButton}
                    style={{ flex: 1 }}
                  >
                    {proposing ? 'Proposing...' : 'Propose Answer'}
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={approving || proposing}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {txHash && (
            <div className={styles.section}>
              <div className={styles.success}>
                ✅ Answer proposed successfully!
                <br />
                Liveness period has started (typically 2 hours).
                <a href={getBasescanUrl(txHash)} target="_blank" rel="noopener noreferrer">
                  View transaction on Basescan →
                </a>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={styles.section}>
              <div className={styles.error}>❌ {error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProposeAnswerModal
