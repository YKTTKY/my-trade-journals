import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [formData, setFormData] = useState<any>({ name: '', type: 'trading_plan', content: '' })
  const { user } = (useAuth() as any) || {}

  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error: any) {
      toast.error('Error loading templates: ' + (error.message || String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('templates').insert({ ...formData, user_id: user.id })
      if (error) throw error

      toast.success('Template created successfully!')
      setFormData({ name: '', type: 'trading_plan', content: '' })
      setShowCreateForm(false)
      loadTemplates()
    } catch (error: any) {
      toast.error('Error creating template: ' + (error.message || String(error)))
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase.from('templates').delete().eq('id', id)
      if (error) throw error

      toast.success('Template deleted successfully!')
      loadTemplates()
    } catch (error: any) {
      toast.error('Error deleting template: ' + (error.message || String(error)))
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
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content mb-2">Templates</h1>
          <p className="text-base-content/70">Create and manage trading plan templates and checklists.</p>
        </div>

        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-base-content mb-4">Create New Template</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">Template Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input input-bordered w-full" placeholder="e.g., Morning Trading Plan" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-2">Template Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="select select-bordered w-full" required>
                <option value="trading_plan">Trading Plan</option>
                <option value="checklist">Pre-trade Checklist</option>
                <option value="session_recap">Session Recap</option>
                <option value="risk_management">Risk Management Rules</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-2">Template Content</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="textarea textarea-bordered w-full" rows={10} placeholder={`Enter your template content here...`} required />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">Create Template</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-base-content/70 text-lg mb-2">No templates yet</div>
            <p className="text-base-content/60">Create templates for your trading plans and checklists.</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-4">Create Your First Template</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-base-content">{template.name}</h3>
                <span className="text-xs bg-base-300 text-base-content/70 px-2 py-1 rounded">{template.type.replace('_', ' ')}</span>
              </div>
              <div className="text-sm text-base-content/70 line-clamp-3 mb-4">{template.content.slice(0, 120)}{template.content.length > 120 ? '...' : ''}</div>
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                <button onClick={() => handleDelete(template.id)} className="text-error hover:text-error-focus">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Templates
