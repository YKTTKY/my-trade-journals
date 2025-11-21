import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateProfitFactor,
  calculateAverageWin,
  calculateAverageLoss,
  calculateExpectancy,
  calculateBestWin,
  calculateWorstLoss,
  calculateMaxDrawdown,
  calculateMaxConsecutiveWins,
  calculateMaxConsecutiveLosses,
  calculateTotalPnLPercentage,
  calculateDailyPnL,
  groupTradesByMonth,
  groupTradesByWeekday
} from '../utils/calculations'
import { exportToCSV, exportToPDF } from '../utils/export'
import TagSelector from '../components/TagSelector'
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'
import toast from 'react-hot-toast'

const Analytics = () => {
  const [trades, setTrades] = useState([])
  const [filteredTrades, setFilteredTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [assetType, setAssetType] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [view, setView] = useState('overview')
  const { user } = useAuth()

  useEffect(() => {
    loadTrades()
  }, [])

  useEffect(() => {
    // Filter trades based on selected criteria
    let filtered = [...trades]

    if (dateRange.startDate) {
      filtered = filtered.filter(t => t.trade_date >= dateRange.startDate)
    }

    if (dateRange.endDate) {
      filtered = filtered.filter(t => t.trade_date <= dateRange.endDate)
    }

    if (assetType) {
      filtered = filtered.filter(t => t.asset_type === assetType)
    }

    if (selectedTags.length > 0) {
      const tagIds = selectedTags.map(t => t.id)
      filtered = filtered.filter(trade =>
        trade.tags?.some(({ tag_id }) => tagIds.includes(tag_id))
      )
    }

    setFilteredTrades(filtered)
  }, [trades, dateRange, assetType, selectedTags])

  const loadTrades = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`*, tags:trade_tags(tag_id, tag:tags(name, category, emoji))`)
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })

      if (error) throw error

      setTrades(data || [])
    } catch (error) {
      toast.error('Error loading trades: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredTrades.length === 0) {
      toast.error('No trades to export')
      return
    }

    const exportData = filteredTrades.map(trade => ({
      Date: new Date(trade.trade_date).toLocaleDateString(),
      'Asset Type': trade.asset_type,
      Symbol: trade.asset_symbol,
      'Entry Price': trade.entry_price,
      'Exit Price': trade.exit_price,
      'Position Size': trade.position_size,
      PnL: trade.pnl,
      'PnL %': trade.pnl_percentage?.toFixed(2),
      Fees: trade.fees,
      Notes: trade.notes
    }))

    exportToCSV(exportData, 'trades-export.csv')
    toast.success('CSV exported successfully')
  }

  const handleExportPDF = () => {
    exportToPDF(filteredTrades, stats, 'trades-report.pdf')
    toast.success('PDF exported successfully')
  }

  const stats = useMemo(() => {
    if (filteredTrades.length === 0) return null

    const totalTrades = filteredTrades.length
    const totalPnL = calculateTotalPnL(filteredTrades)
    const winRate = calculateWinRate(filteredTrades)
    const profitFactor = calculateProfitFactor(filteredTrades)
    const averageWin = calculateAverageWin(filteredTrades)
    const averageLoss = calculateAverageLoss(filteredTrades)
    const bestWin = calculateBestWin(filteredTrades)
    const worstLoss = calculateWorstLoss(filteredTrades)
    const expectancy = calculateExpectancy(filteredTrades)
    const maxDrawdown = calculateMaxDrawdown(filteredTrades)

    return {
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
    }
  }, [filteredTrades])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">
            In-depth analysis of your trading performance.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary">
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Type
            </label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="stocks">Stocks</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
              <option value="options">Options</option>
              <option value="futures">Futures</option>
              <option value="commodities">Commodities</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tagged Trades
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' })
              setAssetType('')
              setSelectedTags([])
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Trades Count */}
      <div className="card">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Showing {filteredTrades.length} trades</h3>
          <p className="text-gray-400">
            {trades.length} total trades in your journal
          </p>
        </div>
      </div>

      {filteredTrades.length > 0 && stats && (
        <>
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

          {/* Analytics Tabs */}
          <div className="card">
            <div className="border-b border-dark-border mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setView('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    view === 'overview'
                      ? 'border-primary-btn text-primary-btn'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setView('performance')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    view === 'performance'
                      ? 'border-primary-btn text-primary-btn'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setView('risk')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    view === 'risk'
                      ? 'border-primary-btn text-primary-btn'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Risk Analysis
                </button>
                <button
                  onClick={() => setView('strategy')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    view === 'strategy'
                      ? 'border-primary-btn text-primary-btn'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  By Strategy
                </button>
              </nav>
            </div>

            {view === 'overview' && <OverviewView trades={filteredTrades} stats={stats} />}
            {view === 'performance' && <PerformanceView trades={filteredTrades} stats={stats} />}
            {view === 'risk' && <RiskView trades={filteredTrades} stats={stats} />}
            {view === 'strategy' && <StrategyView trades={filteredTrades} />}
          </div>
        </>
      )}

      {filteredTrades.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No trades match your filters</div>
            <p className="text-gray-500">Try adjusting your filter criteria</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-components for different views
const OverviewView = ({ trades, stats }) => {
  // Prepare equity curve data
  const sortedTrades = [...trades].sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
  const equityData = sortedTrades.reduce((acc, trade) => {
    const prevValue = acc.length > 0 ? acc[acc.length - 1].value : 0
    const date = new Date(trade.trade_date)
    const label = `${date.getMonth() + 1}/${date.getDate()}`

    // Find existing entry for this date or create new one
    const existingEntry = acc.find(entry => entry.date === label)

    if (existingEntry) {
      existingEntry.value += trade.pnl || 0
    } else {
      acc.push({
        date: label,
        value: prevValue + (trade.pnl || 0)
      })
    }

    return acc
  }, [])

  // Wins/Losses distribution
  const wins = trades.filter(t => (t.pnl || 0) > 0).length
  const losses = trades.filter(t => (t.pnl || 0) < 0).length
  const breakeven = trades.filter(t => t.pnl === 0).length

  const distributionData = [
    { name: 'Wins', value: wins, color: '#22C55E' },
    { name: 'Losses', value: losses, color: '#EF4444' },
    { name: 'Breakeven', value: breakeven, color: '#6B7280' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Equity Curve</h4>
          <div className="h-64 bg-dark-bg rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#2A2A2A', border: '1px solid #404040' }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Wins vs Losses</h4>
          <div className="h-64 bg-dark-bg rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-1">Avg Win</h4>
          <p className="text-xl font-bold text-profit">${stats.averageWin.toFixed(2)}</p>
        </div>
        <div className="text-center p-4 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-1">Avg Loss</h4>
          <p className="text-xl font-bold text-loss">${stats.averageLoss.toFixed(2)}</p>
        </div>
        <div className="text-center p-4 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-1">Best Win</h4>
          <p className="text-xl font-bold text-profit">${stats.bestWin.toFixed(2)}</p>
        </div>
        <div className="text-center p-4 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-1">Worst Loss</h4>
          <p className="text-xl font-bold text-loss">${stats.worstLoss.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

const PerformanceView = ({ trades, stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Total Return</h4>
          <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.totalPnL > 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="text-center p-6 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Profit Factor</h4>
          <p className="text-3xl font-bold text-white">
            {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.profitFactor >= 1.5 ? 'Excellent' : stats.profitFactor >= 1 ? 'Good' : 'Needs Improvement'}
          </p>
        </div>

        <div className="text-center p-6 bg-dark-bg rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Expectancy</h4>
          <p className={`text-3xl font-bold ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.expectancy.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.expectancy > 0 ? 'Positive Edge' : 'Negative Edge'}
          </p>
        </div>
      </div>
    </div>
  )
}

const RiskView = ({ trades }) => {
  return (
    <div className="space-y-6">
      <div className="text-center p-8 bg-dark-bg rounded-lg">
        <h4 className="text-lg font-medium text-gray-400 mb-4">Risk Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Max Consecutive Wins</p>
            <p className="text-2xl font-bold text-profit">
              {calculateMaxConsecutiveWins(trades)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Max Consecutive Losses</p>
            <p className="text-2xl font-bold text-loss">
              {calculateMaxConsecutiveLosses(trades)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const StrategyView = ({ trades }) => {
  return (
    <div className="space-y-6">
      <div className="text-center p-8 bg-dark-bg rounded-lg">
        <h4 className="text-lg font-medium text-gray-400 mb-4">Strategy Performance</h4>
        <p className="text-gray-500">Strategy analysis coming soon...</p>
      </div>
    </div>
  )
}

export default Analytics
