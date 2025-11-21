import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    type: 'trading_plan',
    content: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      toast.error('Error loading templates: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          ...formData,
          user_id: user.id
        })

      if (error) throw error

      toast.success('Template created successfully!')
      setFormData({ name: '', type: 'trading_plan', content: '' })
      setShowCreateForm(false)
      loadTemplates()
    } catch (error) {
      toast.error('Error creating template: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Template deleted successfully!')
      loadTemplates()
    } catch (error) {
      toast.error('Error deleting template: ' + error.message)
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
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Templates</h1>
          <p className="text-gray-400">
            Create and manage trading plan templates and checklists.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Template</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Morning Trading Plan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
                required
              >
                <option value="trading_plan">Trading Plan</option>
                <option value="checklist">Pre-trade Checklist</option>
                <option value="session_recap">Session Recap</option>
                <option value="risk_management">Risk Management Rules</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input-field"
                rows={10}
                placeholder={`Enter your template content here...\n\nFor example:\n- Pre-market analysis\n- Key levels to watch\n- Entry criteria\n- Risk management rules\n- Exit strategy\n`}
                required
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                Create Template
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No templates yet</div>
            <p className="text-gray-500">Create templates for your trading plans and checklists.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary mt-4"
            >
              Create Your First Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                <span className="text-xs bg-dark-border text-gray-400 px-2 py-1 rounded">
                  {template.type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-400 line-clamp-3 mb-4">
                {template.content.slice(0, 120)}{template.content.length > 120 ? '...' : ''}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Templates
