export const calculatePnL = (entryPrice, exitPrice, positionSize, pointValue = 1, direction = 'long', fees = 0) => {
  if (!entryPrice || !exitPrice || !positionSize) return 0

  let pnl
  if (direction === 'short') {
    // For short positions: profit when price goes down
    pnl = ((entryPrice - exitPrice) * positionSize * pointValue) - fees
  } else {
    // For long positions: profit when price goes up
    pnl = ((exitPrice - entryPrice) * positionSize * pointValue) - fees
  }

  return pnl
}

export const calculatePnLPercentage = (entryPrice, exitPrice, direction = 'long') => {
  if (!entryPrice || !exitPrice) return 0

  if (direction === 'short') {
    // For short positions: profit when price goes down
    return ((entryPrice - exitPrice) / entryPrice) * 100
  } else {
    // For long positions: profit when price goes up
    return ((exitPrice - entryPrice) / entryPrice) * 100
  }
}

export const calculateRiskReward = (entryPrice, stopLoss, takeProfit) => {
  if (!entryPrice || !stopLoss || !takeProfit) return 0

  const risk = Math.abs(entryPrice - stopLoss)
  const reward = Math.abs(takeProfit - entryPrice)

  if (risk === 0) return 0
  return reward / risk
}

export const calculateTotalPnL = (trades) => {
  return trades.reduce((total, trade) => total + (trade.pnl || 0), 0)
}

export const calculateWinRate = (trades) => {
  if (!trades || trades.length === 0) return 0
  const wins = trades.filter(trade => (trade.pnl || 0) > 0).length
  return (wins / trades.length) * 100
}

export const calculateProfitFactor = (trades) => {
  const wins = trades.filter(trade => (trade.pnl || 0) > 0)
  const losses = trades.filter(trade => (trade.pnl || 0) < 0)

  const totalWins = wins.reduce((sum, trade) => sum + trade.pnl, 0)
  const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0))

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0
  return totalWins / totalLosses
}

export const calculateAverageWin = (trades) => {
  const wins = trades.filter(trade => (trade.pnl || 0) > 0)
  if (wins.length === 0) return 0
  return wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length
}

export const calculateAverageLoss = (trades) => {
  const losses = trades.filter(trade => (trade.pnl || 0) < 0)
  if (losses.length === 0) return 0
  return losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length
}

export const calculateExpectancy = (trades) => {
  if (!trades || trades.length === 0) return 0

  const winRate = calculateWinRate(trades) / 100
  const avgWin = calculateAverageWin(trades)
  const avgLoss = Math.abs(calculateAverageLoss(trades))

  if (avgLoss === 0) return 0
  return (winRate * avgWin) - ((1 - winRate) * avgLoss)
}

export const calculateMaxDrawdown = (trades) => {
  if (!trades || trades.length === 0) return 0

  const sortedTrades = [...trades].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))

  let peak = 0
  let maxDrawdown = 0

  sortedTrades.forEach(trade => {
    const pnl = trade.pnl || 0
    peak = Math.max(peak, peak + pnl)
    const drawdown = peak - (peak + pnl)
    maxDrawdown = Math.max(maxDrawdown, drawdown)
  })

  return maxDrawdown
}

export const groupTradesByDate = (trades) => {
  return trades.reduce((groups, trade) => {
    const date = new Date(trade.trade_date).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(trade)
    return groups
  }, {})
}

export const calculateDailyPnL = (trades) => {
  const grouped = groupTradesByDate(trades)
  return Object.entries(grouped).map(([date, trades]) => ({
    date,
    pnl: trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  }))
}

export const calculateBestWin = (trades) => {
  if (!trades || trades.length === 0) return 0
  return Math.max(...trades.map(trade => trade.pnl || 0))
}

export const calculateWorstLoss = (trades) => {
  if (!trades || trades.length === 0) return 0
  return Math.min(...trades.map(trade => trade.pnl || 0))
}

export const calculateMaxConsecutiveWins = (trades) => {
  if (!trades || trades.length === 0) return 0

  const sorted = [...trades].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
  let maxStreak = 0
  let currentStreak = 0

  sorted.forEach(trade => {
    if ((trade.pnl || 0) > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  return maxStreak
}

export const calculateMaxConsecutiveLosses = (trades) => {
  if (!trades || trades.length === 0) return 0

  const sorted = [...trades].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
  let maxStreak = 0
  let currentStreak = 0

  sorted.forEach(trade => {
    if ((trade.pnl || 0) < 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  return maxStreak
}

export const groupTradesByMonth = (trades) => {
  return trades.reduce((groups, trade) => {
    const date = new Date(trade.trade_date)
    const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    if (!groups[month]) {
      groups[month] = { trades: [], pnl: 0, wins: 0, losses: 0 }
    }

    groups[month].trades.push(trade)
    groups[month].pnl += trade.pnl || 0

    if ((trade.pnl || 0) > 0) groups[month].wins++
    else if ((trade.pnl || 0) < 0) groups[month].losses++

    return groups
  }, {})
}

export const groupTradesByWeekday = (trades) => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return trades.reduce((groups, trade) => {
    const date = new Date(trade.trade_date)
    const dayOfWeek = date.getDay().toString()

    if (!groups[dayOfWeek]) {
      groups[dayOfWeek] = { count: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 }
    }

    groups[dayOfWeek].count++

    if ((trade.pnl || 0) > 0) {
      groups[dayOfWeek].wins++
    } else if ((trade.pnl || 0) < 0) {
      groups[dayOfWeek].losses++
    }

    groups[dayOfWeek].pnl += trade.pnl || 0
    groups[dayOfWeek].winRate = (groups[dayOfWeek].wins / groups[dayOfWeek].count) * 100

    return groups
  }, {})
}

export const calculateTotalPnLPercentage = (trades) => {
  if (!trades || trades.length === 0) return 0

  const totalInvested = trades.reduce((sum, trade) => {
    return sum + (trade.entry_price * trade.position_size)
  }, 0)

  const totalPnL = calculateTotalPnL(trades)

  if (totalInvested === 0) return 0
  return (totalPnL / totalInvested) * 100
}
