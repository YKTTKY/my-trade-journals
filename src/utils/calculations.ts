export interface TradeSummary {
  pnl?: number
  entry_price?: number
  position_size?: number
  trade_date?: string
  [key: string]: any
}

export const calculatePnL = (
  entryPrice: number | string | undefined,
  exitPrice: number | string | undefined,
  positionSize: number | string | undefined,
  pointValue: number = 1,
  direction: 'long' | 'short' = 'long',
  fees: number = 0
): number => {
  const e = Number(entryPrice)
  const x = Number(exitPrice)
  const size = Number(positionSize)

  if (!e || !x || !size) return 0

  let pnl: number
  if (direction === 'short') {
    pnl = ((e - x) * size * pointValue) - fees
  } else {
    pnl = ((x - e) * size * pointValue) - fees
  }

  return pnl
}

export const calculatePnLPercentage = (
  entryPrice: number | string | undefined,
  exitPrice: number | string | undefined,
  direction: 'long' | 'short' = 'long'
): number => {
  const e = Number(entryPrice)
  const x = Number(exitPrice)
  if (!e || !x) return 0

  if (direction === 'short') return ((e - x) / e) * 100
  return ((x - e) / e) * 100
}

export const calculateRiskReward = (
  entryPrice: number | string | undefined,
  stopLoss: number | string | undefined,
  takeProfit: number | string | undefined
): number => {
  const e = Number(entryPrice)
  const s = Number(stopLoss)
  const t = Number(takeProfit)

  if (!e || !s || !t) return 0

  const risk = Math.abs(e - s)
  const reward = Math.abs(t - e)

  if (risk === 0) return 0
  return reward / risk
}

export const calculateTotalPnL = (trades: TradeSummary[] = []): number => {
  return trades.reduce((total, trade) => total + (trade.pnl || 0), 0)
}

export const calculateWinRate = (trades: TradeSummary[] = []): number => {
  if (!trades || trades.length === 0) return 0
  const wins = trades.filter(trade => (trade.pnl || 0) > 0).length
  return (wins / trades.length) * 100
}

export const calculateProfitFactor = (trades: TradeSummary[] = []): number => {
  const wins = trades.filter(trade => (trade.pnl || 0) > 0)
  const losses = trades.filter(trade => (trade.pnl || 0) < 0)

  const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0))

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0
  return totalWins / totalLosses
}

export const calculateAverageWin = (trades: TradeSummary[] = []): number => {
  const wins = trades.filter(trade => (trade.pnl || 0) > 0)
  if (wins.length === 0) return 0
  return wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / wins.length
}

export const calculateAverageLoss = (trades: TradeSummary[] = []): number => {
  const losses = trades.filter(trade => (trade.pnl || 0) < 0)
  if (losses.length === 0) return 0
  return losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losses.length
}

export const calculateExpectancy = (trades: TradeSummary[] = []): number => {
  if (!trades || trades.length === 0) return 0

  const winRate = calculateWinRate(trades) / 100
  const avgWin = calculateAverageWin(trades)
  const avgLoss = Math.abs(calculateAverageLoss(trades))

  if (avgLoss === 0) return 0
  return (winRate * avgWin) - ((1 - winRate) * avgLoss)
}

export const calculateMaxDrawdown = (trades: TradeSummary[] = []): number => {
  if (!trades || trades.length === 0) return 0

  const sortedTrades = [...trades].sort((a, b) => new Date(String(a.trade_date)).getTime() - new Date(String(b.trade_date)).getTime())

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

export const groupTradesByDate = (trades: TradeSummary[] = []) => {
  return trades.reduce<Record<string, TradeSummary[]>>((groups, trade) => {
    const date = new Date(String(trade.trade_date)).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(trade)
    return groups
  }, {})
}

export const calculateDailyPnL = (trades: TradeSummary[] = []) => {
  const grouped = groupTradesByDate(trades)
  return Object.entries(grouped).map(([date, trades]) => ({
    date,
    pnl: trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  }))
}

export const calculateBestWin = (trades: TradeSummary[] = []) => {
  if (!trades || trades.length === 0) return 0
  return Math.max(...trades.map(trade => trade.pnl || 0))
}

export const calculateWorstLoss = (trades: TradeSummary[] = []) => {
  if (!trades || trades.length === 0) return 0
  return Math.min(...trades.map(trade => trade.pnl || 0))
}

export const calculateMaxConsecutiveWins = (trades: TradeSummary[] = []) => {
  if (!trades || trades.length === 0) return 0

  const sorted = [...trades].sort((a, b) => new Date(String(a.trade_date)).getTime() - new Date(String(b.trade_date)).getTime())
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

export const calculateMaxConsecutiveLosses = (trades: TradeSummary[] = []) => {
  if (!trades || trades.length === 0) return 0

  const sorted = [...trades].sort((a, b) => new Date(String(a.trade_date)).getTime() - new Date(String(b.trade_date)).getTime())
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

export const groupTradesByMonth = (trades: TradeSummary[] = []) => {
  return trades.reduce<Record<string, { trades: TradeSummary[]; pnl: number; wins: number; losses: number }>>((groups, trade) => {
    const date = new Date(String(trade.trade_date))
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

export const groupTradesByWeekday = (trades: TradeSummary[] = []) => {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return trades.reduce<Record<string, { count: number; wins: number; losses: number; pnl: number; winRate: number }>>((groups, trade) => {
    const date = new Date(String(trade.trade_date))
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

export const calculateTotalPnLPercentage = (trades: TradeSummary[] = []) => {
  if (!trades || trades.length === 0) return 0

  const totalInvested = trades.reduce((sum, trade) => {
    return sum + ((trade.entry_price || 0) * (trade.position_size || 0))
  }, 0)

  const totalPnL = calculateTotalPnL(trades)

  if (totalInvested === 0) return 0
  return (totalPnL / totalInvested) * 100
}
