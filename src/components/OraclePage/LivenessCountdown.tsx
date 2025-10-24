import React, { useState, useEffect } from 'react'

interface LivenessCountdownProps {
  expirationTime: string // Unix timestamp as string
}

export const LivenessCountdown: React.FC<LivenessCountdownProps> = ({ expirationTime }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const expiration = parseInt(expirationTime)
      const diff = expiration - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft('Expired - Ready to resolve')
        return
      }

      const hours = Math.floor(diff / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = diff % 60

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [expirationTime])

  return (
    <span style={{ color: isExpired ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{timeLeft}</span>
  )
}
