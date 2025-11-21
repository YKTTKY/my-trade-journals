import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TradeForm from '../components/TradeForm'
import { fetchTrades, updateTrade } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { parseHKInputToUTC } from '../utils/timezone'

const EditTrade = () => {
  const { id } = useParams()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const loadTrade = async () => {
      try {
        const { data, error } = await fetchTrades(user.id)
        if (error) throw error

        const tradeToEdit = data.find(t => t.id === parseInt(id))
        if (!tradeToEdit) {
          toast.error('Trade not found')
          navigate('/trades')
          return
        }

        setTrade(tradeToEdit)
      } catch (error) {
        toast.error('Error loading trade: ' + error.message)
      } finally {
        setFetchLoading(false)
      }
    }

    loadTrade()
  }, [id, user.id, navigate])

  const handleSubmit = async (tradeData, tagIds = []) => {
    setLoading(true)

    try {
      const tradeId = parseInt(id)
      // Update the trade (tags are not updated in edit mode for simplicity)
      // Ensure trade_date is converted from HKT input to UTC ISO before updating
      const payload = {
        ...tradeData,
        trade_date: tradeData.trade_date ? parseHKInputToUTC(tradeData.trade_date) : null,
      }

      const { error } = await updateTrade(tradeId, payload)
      if (error) {
        console.error('Update error:', error)
        throw error
      }

      toast.success('Trade updated successfully!')
      navigate('/trades')
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('Error updating trade: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn"></div>
      </div>
    )
  }

  if (!trade) return null

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Edit Trade</h1>
        <p className="text-gray-400">
          Update your trade information below.
        </p>
      </div>

      <div className="card">
        <TradeForm
          initialData={trade}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Update Trade"
        />
      </div>
    </div>
  )
}

export default EditTrade
