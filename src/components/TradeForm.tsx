import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePnL, calculatePnLPercentage, calculateRiskReward } from '../utils/calculations'
import { getDateTimeForInput, formatDateTimeLocal } from '../utils/timezone'
import TagSelector from './TagSelector'
import toast from 'react-hot-toast'
import type { Trade, TradeTagWithTag, Tag } from '../types/supabase'

interface TradeFormProps {
  initialData?: Partial<Trade> & { tags?: TradeTagWithTag[] }
  onSubmit: (tradeData: Partial<Trade>, tagIds?: number[]) => Promise<void>
  loading?: boolean
  submitText?: string
}

const TradeForm: React.FC<TradeFormProps> = ({ initialData = {}, onSubmit, loading, submitText = 'Save Trade' }) => {
  const navigate = useNavigate()

  // Extract tags from initial data (if editing)
  const initialTags: Tag[] = initialData.tags?.map(({ tag }) => ({
    id: tag.id,
    name: tag.name,
    category: tag.category,
    emoji: tag.emoji
  })) || []

  // Format initial data date if it exists
  const formattedInitialData = initialData.trade_date
    ? { ...initialData, trade_date: formatDateTimeLocal(initialData.trade_date) }
    : initialData

  const [formData, setFormData] = useState<any>({
    asset_type: 'stocks',
    position_direction: 'long',
    asset_symbol: '',
    entry_price: '',
    exit_price: '',
    position_size: '',
    point_value: 1,
    stop_loss: '',
    take_profit: '',
    fees: 0,
    trade_date: getDateTimeForInput(),
    notes: '',
    ...formattedInitialData,
  })

  const [calculatedPnL, setCalculatedPnL] = useState<number>(initialData.pnl || 0)
  const [calculatedPnLPercentage, setCalculatedPnLPercentage] = useState<number>(initialData.pnl_percentage || 0)
  const [calculatedRR, setCalculatedRR] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags)

  useEffect(() => {
    const pnl = calculatePnL(
      parseFloat(formData.entry_price),
      parseFloat(formData.exit_price),
      parseFloat(formData.position_size),
      parseFloat(formData.point_value),
      formData.position_direction || 'long',
      parseFloat(formData.fees)
    )
    setCalculatedPnL(pnl)

    const pnlPercentage = calculatePnLPercentage(
      parseFloat(formData.entry_price),
      parseFloat(formData.exit_price),
      formData.position_direction || 'long'
    )
    setCalculatedPnLPercentage(pnlPercentage)

    const rr = calculateRiskReward(
      parseFloat(formData.entry_price),
      parseFloat(formData.stop_loss),
      parseFloat(formData.take_profit)
    )
    setCalculatedRR(rr)
  }, [formData.entry_price, formData.exit_price, formData.position_size, formData.point_value, formData.position_direction, formData.fees, formData.stop_loss, formData.take_profit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tradeData: Partial<Trade> = {
      asset_type: formData.asset_type,
      position_direction: formData.position_direction,
      asset_symbol: formData.asset_symbol,
      entry_price: parseFloat(formData.entry_price),
      exit_price: parseFloat(formData.exit_price),
      position_size: parseFloat(formData.position_size),
      point_value: parseFloat(formData.point_value) || 1,
      stop_loss: parseFloat(formData.stop_loss) || null,
      take_profit: parseFloat(formData.take_profit) || null,
      fees: parseFloat(formData.fees) || 0,
      trade_date: formData.trade_date,
      pnl: calculatedPnL,
      pnl_percentage: calculatedPnLPercentage,
      notes: formData.notes,
    }

    const tagIds = selectedTags.map(tag => tag.id as number)

    try {
      await onSubmit(tradeData, tagIds)
    } catch (error: any) {
      toast.error('Error saving trade: ' + (error?.message || String(error)))
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="asset_type" className="block text-sm font-medium text-gray-300 mb-2">
            Asset Type
          </label>
          <select
            id="asset_type"
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="stocks">Stocks</option>
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="options">Options</option>
            <option value="futures">Futures</option>
            <option value="commodities">Commodities</option>
          </select>
        </div>

        <div>
          <label htmlFor="asset_symbol" className="block text-sm font-medium text-gray-300 mb-2">
            Asset Symbol
          </label>
          <input
            id="asset_symbol"
            name="asset_symbol"
            type="text"
            value={formData.asset_symbol}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., AAPL, BTC, EURUSD"
            required
          />
        </div>

        <div>
          <label htmlFor="position_direction" className="block text-sm font-medium text-gray-300 mb-2">
            Position Direction
          </label>
          <select
            id="position_direction"
            name="position_direction"
            value={formData.position_direction}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="long">Long 📈</option>
            <option value="short">Short 📉</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label htmlFor="entry_price" className="block text-sm font-medium text-gray-300 mb-2">
            Entry Price
          </label>
          <input
            id="entry_price"
            name="entry_price"
            type="number"
            step="0.01"
            value={formData.entry_price}
            onChange={handleChange}
            className="input-field"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label htmlFor="exit_price" className="block text-sm font-medium text-gray-300 mb-2">
            Exit Price
          </label>
          <input
            id="exit_price"
            name="exit_price"
            type="number"
            step="0.01"
            value={formData.exit_price}
            onChange={handleChange}
            className="input-field"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label htmlFor="position_size" className="block text-sm font-medium text-gray-300 mb-2">
            Position Size
          </label>
          <input
            id="position_size"
            name="position_size"
            type="number"
            step="0.01"
            value={formData.position_size}
            onChange={handleChange}
            className="input-field"
            placeholder="0"
            required
          />
        </div>

        {formData.asset_type === 'futures' && (
          <div>
            <label htmlFor="point_value" className="block text-sm font-medium text-gray-300 mb-2">
              Point Value ($)
            </label>
            <input
              id="point_value"
              name="point_value"
              type="number"
              step="0.01"
              value={formData.point_value}
              onChange={handleChange}
              className="input-field"
              placeholder="20"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For NQ: $20 per point. For ES: $50 per point.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="fees" className="block text-sm font-medium text-gray-300 mb-2">
            Fees
          </label>
          <input
            id="fees"
            name="fees"
            type="number"
            step="0.01"
            value={formData.fees}
            onChange={handleChange}
            className="input-field"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="stop_loss" className="block text-sm font-medium text-gray-300 mb-2">
            Stop Loss (Optional)
          </label>
          <input
            id="stop_loss"
            name="stop_loss"
            type="number"
            step="0.01"
            value={formData.stop_loss}
            onChange={handleChange}
            className="input-field"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="take_profit" className="block text-sm font-medium text-gray-300 mb-2">
            Take Profit (Optional)
          </label>
          <input
            id="take_profit"
            name="take_profit"
            type="number"
            step="0.01"
            value={formData.take_profit}
            onChange={handleChange}
            className="input-field"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="trade_date" className="block text-sm font-medium text-gray-300 mb-2">
            Trade Date & Time
          </label>
          <input
            id="trade_date"
            name="trade_date"
            type="datetime-local"
            value={formData.trade_date}
            onChange={handleChange}
            className="input-field"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            🕒 Hong Kong Time (UTC+8)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Profit/Loss</h3>
          <p className={`text-2xl font-bold ${
            calculatedPnL >= 0 ? 'text-profit' : 'text-loss'
          }`}>
            {calculatedPnL >= 0 ? '+' : ''}{calculatedPnL.toFixed(2)}
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-1">P&L %</h3>
          <p className={`text-2xl font-bold ${
            calculatedPnLPercentage >= 0 ? 'text-profit' : 'text-loss'
          }`}>
            {calculatedPnLPercentage >= 0 ? '+' : ''}{calculatedPnLPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Risk:Reward</h3>
          <p className="text-2xl font-bold text-white">
            {calculatedRR.toFixed(2)}:1
          </p>
        </div>
      </div>

      <div>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className="input-field"
          placeholder="Add any additional notes about this trade..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          ) : (
            submitText
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TradeForm
