import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrades, deleteTrade } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { calculateTotalPnL, calculateWinRate } from '../utils/calculations'
import toast from 'react-hot-toast'

const Trades: React.FC = () => {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<any>({
    assetType: '',
    startDate: '',
    endDate: '',
    sortBy: 'trade_date',
    sortOrder: 'desc'
  })
  const { user } = (useAuth() as any) || {}

  useEffect(() => {
    loadTrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadTrades = async () => {
    setLoading(true)
    try {
      const { data, error } = await fetchTrades(user.id, filters)
      if (error) throw error

      const sorted = [...(data || [])].sort((a, b) => {
        const aVal = a[filters.sortBy]
        const bVal = b[filters.sortBy]
        const order = filters.sortOrder === 'desc' ? -1 : 1

        if (filters.sortBy === 'trade_date') {
          return order * (new Date(bVal).getTime() - new Date(aVal).getTime())
        }

        if (typeof aVal === 'string') {
          return order * aVal.localeCompare(bVal)
        }

        return order * (aVal - bVal)
      })

      setTrades(sorted)
    } catch (error: any) {
      toast.error('Error loading trades: ' + (error.message || String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return

    try {
      const { error } = await deleteTrade(id)
      if (error) throw error

      toast.success('Trade deleted successfully')
      loadTrades()
    } catch (error: any) {
      toast.error('Error deleting trade: ' + (error.message || String(error)))
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev: any) => ({ ...prev, [name]: value }))
  }

  const winRate = calculateWinRate(trades)
  const totalPnL = calculateTotalPnL(trades)

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Your Trades</h1>
        <p className="text-gray-400">View and manage all your trading activity in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Trades</h3>
          <p className="text-3xl font-bold text-white">{trades.length}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Win Rate</h3>
          <p className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total P&L</h3>
          <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>{totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-300 mb-2">Asset Type</label>
            <select id="assetType" name="assetType" value={filters.assetType} onChange={handleFilterChange} className="input-field">
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
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input id="startDate" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} className="input-field" />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input id="endDate" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} className="input-field" />
          </div>

          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select id="sortBy" name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="input-field">
              <option value="trade_date">Date</option>
              <option value="asset_symbol">Symbol</option>
              <option value="pnl">P&L</option>
              <option value="pnl_percentage">P&L %</option>
            </select>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-300 mb-2">Order</label>
            <select id="sortOrder" name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange} className="input-field">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">All Trades</h3>
          <Link to="/trades/add" className="btn-primary">Add New Trade</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No trades found</div>
            <p className="text-gray-500">Start by adding your first trade!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Exit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">P&L %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {trades.map((trade) => (
                  <tr key={trade.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(trade.trade_date).toLocaleDateString()}<br />
                      <span className="text-xs text-gray-500">{new Date(trade.trade_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{trade.asset_symbol}</div>
                        <div className="text-xs text-gray-500">{trade.asset_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${trade.position_direction === 'short' ? 'text-red-400' : 'text-green-400'}`}>{trade.position_direction === 'short' ? '📉' : '📈'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${trade.entry_price?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${trade.exit_price?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.position_size}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${trade.pnl_percentage >= 0 ? 'text-profit' : 'text-loss'}`}>{trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage?.toFixed(2)}%</td>
                    <td className="px-6 py-4 whitespace-wrap text-sm">
                      <div className="flex flex-wrap gap-1">
                        {trade.tags?.map(({ tag }: any) => (
                          <span key={tag.id} className="tag-chip"><span className="mr-1">{tag.emoji || '🏷️'}</span>{tag.name}</span>
                        )) || 'No tags'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link to={`/trades/edit/${trade.id}`} className="text-primary-btn hover:text-blue-400">Edit</Link>
                      <button onClick={() => handleDelete(trade.id)} className="text-red-400 hover:text-red-300">Delete</button>
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

export default Trades
