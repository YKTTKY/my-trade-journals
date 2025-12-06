import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TradeForm from '../components/TradeForm'
import { addTrade, assignTagsToTrade } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { parseHKInputToUTC } from '../utils/timezone'
import type { Trade } from '../types/supabase'

const AddTrade: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSubmit = async (tradeData: Partial<Trade>, tagIds: number[] = []) => {
    setLoading(true)

    try {
      // Convert trade_date (HKT) to UTC ISO before storing
      const tradePayload: Partial<Trade> = {
        ...tradeData,
        user_id: user.id,
        trade_date: tradeData.trade_date ? parseHKInputToUTC(String(tradeData.trade_date)) : null,
      }

      // Create the trade
      const { data: trade, error: tradeError } = await addTrade(tradePayload)

      if (tradeError) throw tradeError

      // If tags were selected, assign them to the trade
      if (tagIds.length > 0 && trade) {
        const { error: tagsError } = await assignTagsToTrade(trade.id as number, tagIds)
        if (tagsError) {
          console.error('Error assigning tags:', tagsError)
          // Don't fail the whole operation if tags fail
        }
      }

      toast.success('Trade added successfully!')
      navigate('/trades')
    } catch (error: any) {
      toast.error('Error adding trade: ' + (error?.message || String(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Add New Trade</h1>
        <p className="text-gray-400">
          Log your trading activity with detailed information for better analysis.
        </p>
      </div>

      <div className="card">
        <TradeForm onSubmit={handleSubmit} loading={loading} submitText="Add Trade" />
      </div>
    </div>
  )
}

export default AddTrade
