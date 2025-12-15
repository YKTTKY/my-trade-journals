import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { calculateDailyPnL, groupTradesByMonth, groupTradesByWeekday } from '../utils/calculations'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [trades, setTrades] = useState<any[]>([])
  const [dailyPnL, setDailyPnL] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any>({})
  const [weekdayData, setWeekdayData] = useState<any>({})
  const [selectedDateTrades, setSelectedDateTrades] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { user } = (useAuth() as any) || {}

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const daily = calculateDailyPnL(data || [])
      setDailyPnL(daily)

      const monthly = groupTradesByMonth(data || [])
      setMonthlyData(monthly)

      const weekday = groupTradesByWeekday(data || [])
      setWeekdayData(weekday)
    } catch (error: any) {
      toast.error('Error loading calendar data: ' + (error.message || String(error)))
    } finally {
      setLoading(false)
    }
  }

  const getTodos = async (date: Date) => {
    const todos = await Promise.all([fetchTodos('daily', date), fetchTodos('weekly', date), fetchTodos('monthly', date)])
    setSelectedDateTrades(todos.flat())
  }

  const fetchTodos = async (period: string, date: Date) => {
    switch (period) {
      case 'daily':
        return dailyPnL.filter(d => new Date(d.date).toDateString() === date.toDateString())
      case 'weekly': {
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return trades.filter(t => {
          const tradeDate = new Date(t.trade_date)
          return tradeDate >= weekStart && tradeDate <= weekEnd
        })
      }
      case 'monthly': {
        const monthStart = new Date(date)
        monthStart.setDate(1)
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(0)
        return trades.filter(t => {
          const tradeDate = new Date(t.trade_date)
          return tradeDate >= monthStart && tradeDate <= monthEnd
        })
      }
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content mb-2">Calendar View</h1>
        <p className="text-base-content/70">Visualize your trading profitability by day, week, and month.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-base-content mb-4">{format(selectedDate, 'MMMM yyyy')}</h3>

            <Calendar
              value={selectedDate}
              onChange={(value: any) => setSelectedDate(value as Date)}
              onClickDay={(date: Date) => getTodos(date)}
              className="calendar w-full"
              tileContent={({ date, view }) => {
                if (view !== 'month') return null

                const dateStr = date.toDateString()
                const dayTrades = trades.filter(t => new Date(t.trade_date).toDateString() === dateStr)

                if (dayTrades.length === 0) return null

                const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)

                return (
                  <div className="mt-1">
                    <div className={`w-2 h-2 rounded-full mx-auto ${totalPnL > 0 ? 'bg-success' : 'bg-error'}`}></div>
                  </div>
                )
              }}
            />

            {/* Legend omitted for brevity */}
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateTrades.length > 0 && (
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-base-content mb-4">Trades for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <div className="space-y-2">
                {selectedDateTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-base-300 rounded">
                    <div>
                      <div className="text-base-content font-medium">{trade.asset_symbol}</div>
                      <div className="text-sm text-base-content/70">
                        {trade.asset_type} • {new Date(trade.trade_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-error'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Month Summary etc. - kept similar to original for now */}
          <div className="card">
            <h3 className="text-lg font-semibold text-base-content mb-4">{format(selectedDate, 'MMMM')} Summary</h3>
            {/* Summary content computed client-side */}
            {(() => {
              const monthTrades = trades.filter(t => {
                const tradeDate = new Date(t.trade_date)
                return tradeDate.getMonth() === selectedDate.getMonth() && tradeDate.getFullYear() === selectedDate.getFullYear()
              })

              const pnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
              const wins = monthTrades.filter(t => (t.pnl || 0) > 0).length
              const losses = monthTrades.filter(t => (t.pnl || 0) < 0).length
              const total = monthTrades.length

              return (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Total Trades</span>
                    <span className="text-base-content font-medium">{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Wins</span>
                    <span className="text-success">{wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Losses</span>
                    <span className="text-error">{losses}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-base-300">
                    <span className="text-base-content/70">Total P&L</span>
                    <span className={`font-bold ${pnl >= 0 ? 'text-success' : 'text-error'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</span>
                  </div>
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
