import React, { useState, useEffect } from 'react'
import { UmaOracleRepo } from 'src/logic/UmaOracle'
import { EnrichedQuestion } from './types'
import styles from './modal.module.css'

interface QuestionDetailsModalProps {
  question: EnrichedQuestion
  account: string
  oracleRepo: UmaOracleRepo
  onClose: () => void
  onResolved: () => void
}

const QuestionDetailsModal: React.FC<QuestionDetailsModalProps> = ({
  question,
  account,
  oracleRepo,
  onClose,
  onResolved,
}) => {
  const [resolving, setResolving] = useState(false)
  const [settling, setSettling] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSettleConfirmation, setShowSettleConfirmation] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expectedPayouts, setExpectedPayouts] = useState<string[]>([])
  const [livenessCountdown, setLivenessCountdown] = useState<number | null>(null)
  const [currentStatus, setCurrentStatus] = useState(question.status)
  const [isCurrentlyReady, setIsCurrentlyReady] = useState(question.isReady)

  useEffect(() => {
    // Check if ready in real-time
    const checkReadyState = async () => {
      console.log('Checking ready state for question:', question.questionID)
      const ready = await oracleRepo.isReady(question.questionID)
      console.log('isReady result:', ready)
      setIsCurrentlyReady(ready)

      if (ready && currentStatus === 'Proposed - Pending Liveness') {
        console.log('Updating status to Ready to Resolve')
        setCurrentStatus('Ready to Resolve')
      }
    }
    checkReadyState()
    const interval = setInterval(checkReadyState, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [question.questionID, oracleRepo, currentStatus])

  useEffect(() => {
    // Load expected payouts if ready
    const loadPayouts = async () => {
      if (question.isReady) {
        try {
          const payouts = await oracleRepo.getExpectedPayouts(question.questionID)
          setExpectedPayouts(payouts)
        } catch (err) {
          console.error('Error loading payouts:', err)
        }
      }
    }
    loadPayouts()

    // Calculate liveness countdown if proposed
    if (question.status === 'Proposed - Pending Liveness' && question.questionData) {
      const requestTime = parseInt(question.questionData.requestTimestamp)
      const liveness = parseInt(question.questionData.liveness)
      const expiryTime = requestTime + liveness

      const updateCountdown = () => {
        const now = Math.floor(Date.now() / 1000)
        const remaining = expiryTime - now
        setLivenessCountdown(remaining > 0 ? remaining : 0)
      }

      updateCountdown()
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [question, oracleRepo])

  const handleResolve = async () => {
    try {
      setResolving(true)
      setError(null)

      const tx = await oracleRepo.resolve(question.questionID, account)
      setTxHash(tx.transactionHash)

      // Wait a bit for confirmation
      setTimeout(() => {
        onResolved()
      }, 2000)
    } catch (err: any) {
      console.error('Error resolving question:', err)
      setError(err.message || 'Failed to resolve question')
      setResolving(false)
    }
  }

  const handleSettle = async () => {
    try {
      setSettling(true)
      setError(null)

      const tx = await oracleRepo.settle(question.questionID, account)
      setTxHash(tx.transactionHash)

      // Wait for confirmation and reload
      setTimeout(() => {
        setSettling(false)
        setShowSettleConfirmation(false)
        // Reload the page to refresh ready state
        window.location.reload()
      }, 3000)
    } catch (err: any) {
      console.error('Error settling proposal:', err)
      setError(err.message || 'Failed to settle proposal')
      setSettling(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const getBasescanUrl = (hash: string) => {
    return `https://sepolia.basescan.org/tx/${hash}`
  }

  const getBasescanAddressUrl = (address: string) => {
    return `https://sepolia.basescan.org/address/${address}`
  }

  const interpretPayouts = (payouts: string[]) => {
    if (payouts.length !== 2) return 'Unknown'
    const yesAmount = parseInt(payouts[0])
    const noAmount = parseInt(payouts[1])

    if (yesAmount > noAmount) return 'YES'
    if (noAmount > yesAmount) return 'NO'
    return 'INVALID'
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Question Details</h2>
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

          {/* Full Ancillary Data */}
          <div className={styles.section}>
            <h4>Ancillary Data</h4>
            <div className={styles.codeBlock}>{question.parsedData.raw}</div>
          </div>

          {/* Question State */}
          <div className={styles.section}>
            <h4>State Information</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Question ID:</span>
                <span className={styles.value}>
                  {question.questionID}
                  <button
                    className={styles.copyButton}
                    onClick={() => navigator.clipboard.writeText(question.questionID)}
                    title="Copy"
                  >
                    📋
                  </button>
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Status:</span>
                <span className={styles.value}>
                  {currentStatus}
                  {isCurrentlyReady && currentStatus !== 'Ready to Resolve' && (
                    <span style={{ marginLeft: '10px', color: '#4caf50' }}>(Ready to resolve)</span>
                  )}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Resolved:</span>
                <span className={styles.value}>
                  {question.questionData?.resolved ? 'Yes' : 'No'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Paused:</span>
                <span className={styles.value}>{question.questionData?.paused ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Creator:</span>
                <span className={styles.value}>
                  <a
                    href={getBasescanAddressUrl(question.creator)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {question.creator}
                  </a>
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Reward:</span>
                <span className={styles.value}>
                  {(parseFloat(question.reward) / 1e6).toFixed(2)} USDC
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Proposal Bond:</span>
                <span className={styles.value}>
                  {(parseFloat(question.proposalBond) / 1e6).toFixed(2)} USDC
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Liveness Period:</span>
                <span className={styles.value}>
                  {question.questionData?.liveness
                    ? `${parseInt(question.questionData.liveness) / 3600} hours`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Liveness Countdown */}
          {livenessCountdown !== null && livenessCountdown > 0 && (
            <div className={styles.section}>
              <div className={styles.countdown}>
                ⏱️ Liveness period ends in: <strong>{formatCountdown(livenessCountdown)}</strong>
              </div>
            </div>
          )}

          {/* Settle Button - shown when liveness expired but not settled */}
          {livenessCountdown === 0 &&
            !isCurrentlyReady &&
            question.oracleRequest &&
            !question.oracleRequest.settled && (
              <div className={styles.section}>
                <div
                  style={{
                    padding: '15px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    border: '2px solid #ff9800',
                    marginBottom: '15px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#e65100' }}>
                    ⏰ Liveness Period Expired
                  </div>
                  <p style={{ marginBottom: '15px', fontSize: '14px' }}>
                    The liveness period has expired. The proposal needs to be settled before it can
                    be resolved. Anyone can call settle to finalize the proposal.
                  </p>
                  {!showSettleConfirmation ? (
                    <button
                      className={styles.resolveButton}
                      onClick={() => setShowSettleConfirmation(true)}
                      style={{ backgroundColor: '#ff9800' }}
                    >
                      ⚙️ Settle Proposal
                    </button>
                  ) : (
                    <div className={styles.confirmation}>
                      <p>Settle this proposal on the OptimisticOracle?</p>
                      <div className={styles.confirmButtons}>
                        <button
                          className={styles.confirmButton}
                          onClick={handleSettle}
                          disabled={settling}
                        >
                          {settling ? 'Settling...' : 'Confirm Settle'}
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setShowSettleConfirmation(false)}
                          disabled={settling}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Settlement Information */}
          {question.questionData?.resolved && expectedPayouts.length > 0 && (
            <div className={styles.section}>
              <h4>Settlement</h4>
              <div className={styles.settlement}>
                <div className={styles.settlementResult}>
                  Result: <strong>{interpretPayouts(expectedPayouts)}</strong>
                </div>
                <div className={styles.payoutsGrid}>
                  <div>YES Payout: {expectedPayouts[0]}</div>
                  <div>NO Payout: {expectedPayouts[1]}</div>
                </div>
              </div>
            </div>
          )}

          {/* View on Basescan */}
          <div className={styles.section}>
            <a
              href={getBasescanUrl(question.transactionHash)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.basescanLink}
            >
              View Initialization Transaction on Basescan →
            </a>
          </div>

          {/* Resolve Action */}
          {isCurrentlyReady && !question.questionData?.resolved && (
            <div className={styles.section}>
              {!showConfirmation ? (
                <button className={styles.resolveButton} onClick={() => setShowConfirmation(true)}>
                  ✅ Resolve Question
                </button>
              ) : (
                <div className={styles.confirmation}>
                  <p>Are you sure you want to resolve this question?</p>
                  <div className={styles.confirmButtons}>
                    <button
                      className={styles.confirmButton}
                      onClick={handleResolve}
                      disabled={resolving}
                    >
                      {resolving ? 'Resolving...' : 'Confirm'}
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setShowConfirmation(false)}
                      disabled={resolving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className={styles.section}>
              <div className={styles.success}>
                ✅ Question resolved successfully!
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

export default QuestionDetailsModal
