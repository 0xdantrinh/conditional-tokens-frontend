import React, { useState, useEffect, useCallback } from 'react'
import Web3 from 'web3'
import { UmaOracleRepo } from 'src/logic/UmaOracle'
import { UMA_CONFIG } from 'src/conf/uma'
import QuestionDetailsModal from './QuestionDetailsModal'
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

            // Determine status
            let status: EnrichedQuestion['status']
            if (questionData.resolved || resolvedQuestionIds.has(event.questionID)) {
              status = 'Resolved'
            } else if (isReady) {
              status = 'Ready to Resolve'
            } else if (questionData.requestTimestamp !== '0') {
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
            }
          } catch (err) {
            console.error('Error enriching question:', event.questionID, err)
            return {
              ...event,
              questionData: null,
              isReady: false,
              parsedData: oracleRepo.parseAncillaryData(event.ancillaryData),
              status: 'Waiting for Proposal' as const,
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
    </div>
  )
}

export default OraclePage
