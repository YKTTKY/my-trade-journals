import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { calculateDailyPnL, groupTradesByMonth, groupTradesByWeekday } from '../utils/calculations'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [trades, setTrades] = useState([])
  const [dailyPnL, setDailyPnL] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [weekdayData, setWeekdayData] = useState([])
  const [selectedDateTrades, setSelectedDateTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })

      if (error) throw error

      setTrades(data || [])

      // Calculate daily P&L for calendar heatmap
      const daily = calculateDailyPnL(data || [])
      setDailyPnL(daily)

      // Calculate monthly data
      const monthly = groupTradesByMonth(data || [])
      setMonthlyData(monthly)

      // Calculate weekday data
      const weekday = groupTradesByWeekday(data || [])
      setWeekdayData(weekday)
    } catch (error) {
      toast.error('Error loading calendar data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTileColor = (pnl) => {
    if (pnl === 0) return 'bg-gray-600'
    if (pnl > 0) {
      const intensity = Math.min(Math.abs(pnl) / 1000, 1)
      if (intensity > 0.7) return 'bg-green-600'
      if (intensity > 0.4) return 'bg-green-700'
      return 'bg-green-800'
    } else {
      const intensity = Math.min(Math.abs(pnl) / 1000, 1)
      if (intensity > 0.7) return 'bg-red-600'
      if (intensity > 0.4) return 'bg-red-700'
      return 'bg-red-800'
    }
  }

  const getTodos = async (date) => {
    const dateStr = date.toDateString()
    const todos = await Promise.all([
      fetchTodos('daily', dateStr),
      fetchTodos('weekly', dateStr),
      fetchTodos('monthly', dateStr)
    ])
    setSelectedDateTrades(todos.flat())
  }

  const fetchTodos = async (period, date) => {
    switch (period) {
      case 'daily':
        return dailyPnL.filter(d => new Date(d.date).toDateString() === date)
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return trades.filter(t => {
          const tradeDate = new Date(t.trade_date)
          return tradeDate >= weekStart && tradeDate <= weekEnd
        })
      case 'monthly':
        const monthStart = new Date(date)
        monthStart.setDate(1)
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(0)
        return trades.filter(t => {
          const tradeDate = new Date(t.trade_date)
          return tradeDate >= monthStart && tradeDate <= monthEnd
        })
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Calendar View</h1>
        <p className="text-gray-400">
          Visualize your trading profitability by day, week, and month.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>

            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              onClickDay={(date) => getTodos(date)}
              className="calendar w-full"
              tileContent={({ date, view }) => {
                if (view !== 'month') return null

                const dateStr = date.toDateString()
                const dayTrades = trades.filter(t =>
                  new Date(t.trade_date).toDateString() === dateStr
                )

                if (dayTrades.length === 0) return null

                const totalPnL = dayTrades.reduce((sum, t) => sum + t.pnl, 0)

                return (
                  <div className="mt-1">
                    <div className={`w-2 h-2 rounded-full mx-auto ${totalPnL > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                )
              }}
            />

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-300">Profitable Day</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-gray-300">Losing Day</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                <span className="text-gray-300">No Trades</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateTrades.length > 0 && (
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Trades for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {selectedDateTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-dark-bg rounded">
                    <div>
                      <div className="text-white font-medium">{trade.asset_symbol}</div>
                      <div className="text-sm text-gray-400">
                        {trade.asset_type} • {new Date(trade.trade_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Month Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">
              {format(selectedDate, 'MMMM')} Summary
            </h3>
            {(() => {
              const monthTrades = trades.filter(t => {
                const tradeDate = new Date(t.trade_date)
                return tradeDate.getMonth() === selectedDate.getMonth() &&
                       tradeDate.getFullYear() === selectedDate.getFullYear()
              })

              const pnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0)
              const wins = monthTrades.filter(t => t.pnl > 0).length
              const losses = monthTrades.filter(t => t.pnl < 0).length
              const total = monthTrades.length

              return (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades</span>
                    <span className="text-white font-medium">{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wins</span>
                    <span className="text-profit">{wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losses</span>
                    <span className="text-loss">{losses}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dark-border">
                    <span className="text-gray-400">Total P&L</span>
                    <span className={`font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Best/Worst Days */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Best Days</h3>
            {(() => {
              const monthly = groupTradesByMonth(trades)
              const sorted = Object.entries(monthly)
                .map(([month, data]) => ({ month, ...data }))
                .sort((a, b) => b.pnl - a.pnl)

              if (sorted.length === 0) {
                return <p className="text-gray-400 text-sm">No data available</p>
              }

              return (
                <div className="space-y-2">
                  {sorted.slice(0, 3).map((item) => (
                    <div key={item.month} className="flex justify-between">
                      <span className="text-gray-400">{item.month}</span>
                      <span className="text-profit">+{item.pnl.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Day of Week Analysis */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Best Days of Week</h3>
            {(() => {
              const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              const weekdayData = groupTradesByWeekday(trades)

              const sorted = Object.entries(weekdayData)
                .sort((a, b) => b[1].winRate - a[1].winRate)
                .filter(([day]) => parseInt(day) >= 1 && parseInt(day) <= 5) // Only weekdays

              if (sorted.length === 0) {
                return <p className="text-gray-400 text-sm">No weekday data available</p>
              }

              return (
                <div className="space-y-2">
                  {sorted.slice(0, 3).map(([day, data]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-400">{weekdays[parseInt(day)]}</span>
                      <div className="text-right">
                        <div className={data.winRate >= 50 ? 'text-profit' : 'text-loss'}>
                          {data.winRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">{data.count} trades</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarView
