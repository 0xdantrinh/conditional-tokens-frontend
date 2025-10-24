import React, { useState, useEffect, useCallback } from 'react'
import Web3 from 'web3'
import { UmaOracleRepo } from 'src/logic/UmaOracle'
import { UMA_CONFIG } from 'src/conf/uma'
import QuestionDetailsModal from './QuestionDetailsModal'
import ProposeAnswerModal from './ProposeAnswerModal'
import { LivenessCountdown } from './LivenessCountdown'
import { EnrichedQuestion, StatusFilter } from './types'
import styles from './style.module.css'

interface OraclePageProps {
  web3: Web3
  account: string
}

const OraclePage: React.FC<OraclePageProps> = ({ web3, account }) => {
  const [oracleRepo] = useState(() => new UmaOracleRepo(web3))
  const [questions, setQuestions] = useState<EnrichedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [selectedQuestion, setSelectedQuestion] = useState<EnrichedQuestion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [questionToPropose, setQuestionToPropose] = useState<EnrichedQuestion | null>(null)

  // Load all questions
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use configured start block to reduce query range
      const startBlock = UMA_CONFIG.BASE_SEPOLIA.startBlock

      // Get all QuestionInitialized events from start block
      const events = await oracleRepo.getQuestionInitializedEvents(startBlock)

      // Get resolved events to mark resolved questions
      const resolvedEvents = await oracleRepo.getQuestionResolvedEvents(startBlock)
      const resolvedQuestionIds = new Set(resolvedEvents.map((e) => e.questionID))

      // Enrich each question with additional data
      const enriched: EnrichedQuestion[] = await Promise.all(
        events.map(async (event) => {
          try {
            const questionData = await oracleRepo.getQuestion(event.questionID)
            const isReady = await oracleRepo.isReady(event.questionID)
            const parsedData = oracleRepo.parseAncillaryData(event.ancillaryData)

            // Get oracle request for liveness countdown
            const oracleRequest =
              questionData.requestTimestamp !== '0'
                ? await oracleRepo.getOracleRequest(event.questionID)
                : null

            // Determine status
            let status: EnrichedQuestion['status']
            if (questionData.resolved || resolvedQuestionIds.has(event.questionID)) {
              status = 'Resolved'
            } else if (isReady) {
              status = 'Ready to Resolve'
            } else if (
              oracleRequest &&
              oracleRequest.proposer !== '0x0000000000000000000000000000000000000000'
            ) {
              // Only mark as "Proposed" if someone actually proposed (proposer is not zero address)
              status = 'Proposed - Pending Liveness'
            } else {
              status = 'Waiting for Proposal'
            }

            return {
              ...event,
              questionData,
              isReady,
              parsedData,
              status,
              oracleRequest,
            }
          } catch (err) {
            console.error('Error enriching question:', event.questionID, err)
            return {
              ...event,
              questionData: null,
              isReady: false,
              parsedData: oracleRepo.parseAncillaryData(event.ancillaryData),
              status: 'Waiting for Proposal' as const,
              oracleRequest: null,
            }
          }
        }),
      )

      // Sort by timestamp (newest first)
      enriched.sort((a, b) => parseInt(b.requestTimestamp) - parseInt(a.requestTimestamp))

      setQuestions(enriched)
    } catch (err: any) {
      console.error('Error loading questions:', err)
      setError(err.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [oracleRepo])

  useEffect(() => {
    loadQuestions()

    // Poll for updates every 30 seconds
    const interval = setInterval(loadQuestions, 30000)
    return () => clearInterval(interval)
  }, [loadQuestions])

  // Filter questions by status
  const filteredQuestions = questions.filter((q) => {
    if (statusFilter === 'All') return true
    if (statusFilter === 'Pending') {
      return q.status === 'Waiting for Proposal' || q.status === 'Proposed - Pending Liveness'
    }
    if (statusFilter === 'Ready') return q.status === 'Ready to Resolve'
    if (statusFilter === 'Resolved') return q.status === 'Resolved'
    return true
  })

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000)
    return date.toLocaleString()
  }

  // Format amount (assuming 18 decimals for USDC-like tokens)
  const formatAmount = (amount: string) => {
    return (parseFloat(amount) / 1e6).toFixed(2) // Assuming 6 decimals for USDC
  }

  // Truncate address
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Truncate question ID
  const truncateQuestionId = (id: string) => {
    return `${id.slice(0, 10)}...${id.slice(-4)}`
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Format proposed answer value
  const formatProposedAnswer = (proposedPrice: string) => {
    // YES = 1e18, NO = 0, UNDECIDED = 0.5e18
    console.log('Proposed price raw:', proposedPrice)
    const value = proposedPrice
    if (value === '1000000000000000000') return 'YES ✅'
    if (value === '0') return 'NO ❌'
    if (value === '500000000000000000') return 'UNDECIDED 🤷'
    return `Unknown (${value})`
  }

  // Get status badge color
  const getStatusColor = (status: EnrichedQuestion['status']) => {
    switch (status) {
      case 'Waiting for Proposal':
        return '#9e9e9e'
      case 'Proposed - Pending Liveness':
        return '#ff9800'
      case 'Ready to Resolve':
        return '#4caf50'
      case 'Resolved':
        return '#2196f3'
      default:
        return '#9e9e9e'
    }
  }

  // Open question details
  const openQuestionDetails = (question: EnrichedQuestion) => {
    setSelectedQuestion(question)
    setShowModal(true)
  }

  // Handle question resolved
  const handleQuestionResolved = () => {
    setShowModal(false)
    loadQuestions() // Reload to update status
  }

  if (loading && questions.length === 0) {
    return (
      <div className={styles.container}>
        <h2>📋 UMA Oracle Questions</h2>
        <div className={styles.loading}>Loading questions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>📋 UMA Oracle Questions</h2>
        <div className={styles.error}>
          <p>❌ Error: {error}</p>
          <button onClick={loadQuestions} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📋 UMA Oracle Questions</h2>
        <p className={styles.subtitle}>
          Manage and resolve prediction market questions via UMA's Optimistic Oracle
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {(['All', 'Pending', 'Ready', 'Resolved'] as StatusFilter[]).map((filter) => (
          <button
            key={filter}
            className={`${styles.filterTab} ${statusFilter === filter ? styles.active : ''}`}
            onClick={() => setStatusFilter(filter)}
          >
            {filter}
            {filter === 'All' && ` (${questions.length})`}
            {filter === 'Pending' &&
              ` (${
                questions.filter(
                  (q) =>
                    q.status === 'Waiting for Proposal' ||
                    q.status === 'Proposed - Pending Liveness',
                ).length
              })`}
            {filter === 'Ready' &&
              ` (${questions.filter((q) => q.status === 'Ready to Resolve').length})`}
            {filter === 'Resolved' &&
              ` (${questions.filter((q) => q.status === 'Resolved').length})`}
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className={styles.questionList}>
        {filteredQuestions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions found for this filter.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.questionID}
              className={styles.questionCard}
              onClick={() => openQuestionDetails(question)}
            >
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.questionTitle}>{question.parsedData.title}</h3>
                  <p className={styles.questionId}>
                    ID: {truncateQuestionId(question.questionID)}
                    <button
                      className={styles.copyButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(question.questionID)
                      }}
                      title="Copy Question ID"
                    >
                      📋
                    </button>
                  </p>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(question.status) }}
                >
                  {question.status}
                </div>
              </div>

              {question.parsedData.description && (
                <p className={styles.questionDescription}>{question.parsedData.description}</p>
              )}

              <div className={styles.cardDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created:</span>
                  <span>{formatTimestamp(question.requestTimestamp)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Reward:</span>
                  <span>{formatAmount(question.reward)} USDC</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bond:</span>
                  <span>{formatAmount(question.proposalBond)} USDC</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Creator:</span>
                  <span>
                    {truncateAddress(question.creator)}
                    <button
                      className={styles.copyButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(question.creator)
                      }}
                      title="Copy Creator Address"
                    >
                      📋
                    </button>
                  </span>
                </div>
              </div>

              {question.status === 'Waiting for Proposal' && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    className={styles.proposeButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuestionToPropose(question)
                      setShowProposeModal(true)
                    }}
                  >
                    💡 Propose Answer
                  </button>
                </div>
              )}

              {question.status === 'Proposed - Pending Liveness' && question.oracleRequest && (
                <div
                  style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Proposed Answer:</strong>{' '}
                    {formatProposedAnswer(question.oracleRequest.proposedPrice)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Proposed by:</strong> {truncateAddress(question.oracleRequest.proposer)}
                    <button
                      className={styles.copyButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(question.oracleRequest!.proposer)
                      }}
                      title="Copy Proposer Address"
                    >
                      📋
                    </button>
                  </div>
                  <div>
                    <strong>Liveness remaining:</strong>{' '}
                    <LivenessCountdown expirationTime={question.oracleRequest.expirationTime} />
                  </div>
                </div>
              )}

              {question.isReady && (
                <div className={styles.readyIndicator}>✅ Ready to resolve - Click to resolve</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Question Details Modal */}
      {showModal && selectedQuestion && (
        <QuestionDetailsModal
          question={selectedQuestion}
          account={account}
          oracleRepo={oracleRepo}
          onClose={() => setShowModal(false)}
          onResolved={handleQuestionResolved}
        />
      )}

      {/* Propose Answer Modal */}
      {showProposeModal && questionToPropose && (
        <ProposeAnswerModal
          question={questionToPropose}
          account={account}
          oracleRepo={oracleRepo}
          web3={web3}
          onClose={() => {
            setShowProposeModal(false)
            setQuestionToPropose(null)
          }}
          onProposed={() => {
            setShowProposeModal(false)
            setQuestionToPropose(null)
            loadQuestions() // Reload to update status
          }}
        />
      )}
    </div>
  )
}

export default OraclePage
