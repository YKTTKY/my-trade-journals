import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateProfitFactor,
  calculateAverageWin,
  calculateAverageLoss,
  calculateBestWin,
  calculateWorstLoss,
  calculateExpectancy,
  calculateMaxDrawdown,
  calculateTotalPnLPercentage
} from '../utils/calculations'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalPnL: 0,
    winRate: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    expectancy: 0,
    maxDrawdown: 0,
    bestWin: 0,
    worstLoss: 0
  })
  const [recentTrades, setRecentTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const channel = supabase
      .channel('trades_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadDashboardData()
      })
      .subscribe()

    loadDashboardData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const loadDashboardData = async () => {
    try {
      // Fetch all trades for the user
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })

      if (error) throw error

      // Calculate statistics
      const totalTrades = trades.length
      const totalPnL = calculateTotalPnL(trades)
      const winRate = calculateWinRate(trades)
      const profitFactor = calculateProfitFactor(trades)
      const averageWin = calculateAverageWin(trades)
      const averageLoss = calculateAverageLoss(trades)
      const bestWin = calculateBestWin(trades)
      const worstLoss = calculateWorstLoss(trades)
      const expectancy = calculateExpectancy(trades)
      const maxDrawdown = calculateMaxDrawdown(trades)

      setStats({
        totalTrades,
        totalPnL,
        winRate,
        profitFactor,
        averageWin,
        averageLoss,
        bestWin,
        worstLoss,
        expectancy,
        maxDrawdown
      })

      // Get recent trades (last 5)
      setRecentTrades(trades.slice(0, 5))
    } catch (error) {
      toast.error('Error loading dashboard data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const renderTrades = [...recentTrades].reverse()
  const equityData = renderTrades.reduce((acc, trade) => {
    const prevValue = acc.length > 0 ? acc[acc.length - 1].value : 0
    acc.push({
      date: new Date(trade.trade_date).toLocaleDateString(),
      value: prevValue + (trade.pnl || 0)
    })
    return acc
  }, [])

  const winsLossesData = [
    { name: 'Wins', value: recentTrades.filter(t => (t.pnl || 0) > 0).length, color: '#22C55E' },
    { name: 'Losses', value: recentTrades.filter(t => (t.pnl || 0) < 0).length, color: '#EF4444' },
    { name: 'Breakeven', value: recentTrades.filter(t => t.pnl === 0).length, color: '#6B7280' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Overview of your trading performance and recent activity.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Trades</h3>
          <p className="text-3xl font-bold text-white">{stats.totalTrades}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Win Rate</h3>
          <p className={`text-3xl font-bold ${stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
            {stats.winRate.toFixed(1)}%
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total P&L</h3>
          <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Expectancy</h3>
          <p className={`text-3xl font-bold ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.expectancy.toFixed(2)}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Max Drawdown</h3>
          <p className="text-3xl font-bold text-loss">
            {stats.maxDrawdown.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2A2A', border: '1px solid #404040' }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wins vs Losses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Wins vs Losses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winsLossesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winsLossesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-dark-bg rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Profit Factor</h4>
            <p className="text-2xl font-bold text-white">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-4 bg-dark-bg rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Avg Win</h4>
            <p className="text-2xl font-bold text-profit">
              +${stats.averageWin.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-4 bg-dark-bg rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Avg Loss</h4>
            <p className="text-2xl font-bold text-loss">
              {stats.averageLoss.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-4 bg-dark-bg rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Best / Worst</h4>
            <p className="text-xl font-bold">
              <span className="text-profit">+${stats.bestWin.toFixed(2)}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-loss">{stats.worstLoss.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          <Link to="/trades" className="text-primary-btn hover:text-blue-400">
            View All →
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No trades yet</div>
            <Link to="/trades/add" className="btn-primary mt-4 inline-block">
              Add Your First Trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(trade.trade_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{trade.asset_symbol}</div>
                        <div className="text-xs text-gray-500">{trade.asset_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${trade.position_direction === 'short' ? 'text-red-400' : 'text-green-400'}`}>
                        {trade.position_direction === 'short' ? '📉' : '📈'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      trade.pnl >= 0 ? 'text-profit' : 'text-loss'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      trade.pnl_percentage >= 0 ? 'text-profit' : 'text-loss'
                    }`}>
                      {trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
