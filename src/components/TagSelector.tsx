import React, { useState, useEffect } from 'react'
import { fetchTags, addTag } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import type { Tag } from '../types/supabase'

const CATEGORY_EMOJIS: Record<string, string> = {
  asset: '📊',
  strategy: '🎯',
  'market-condition': '📈',
  'emotional-state': '😊',
  other: '🏷️',
}

type Props = {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

const TagSelector: React.FC<Props> = ({ selectedTags, onTagsChange }) => {
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState<string>('')
  const [newTagCategory, setNewTagCategory] = useState<string>('other')
  const [loading, setLoading] = useState<boolean>(false)
  const { user } = (useAuth() as any) || {}

  useEffect(() => {
    loadTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTags = async () => {
    try {
      const { data, error } = await fetchTags(user.id)
      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!newTagName.trim()) return

    if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      setNewTagName('')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await addTag({
        name: newTagName,
        category: newTagCategory,
        emoji: CATEGORY_EMOJIS[newTagCategory] || '🏷️',
        user_id: user.id,
      })

      if (error) throw error

      setTags([...tags, data])
      setNewTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id)

    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const groupedTags = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const key = tag.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(tag)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-base-content">Tags</label>

      {Object.entries(groupedTags).map(([category, categoryTags]) => (
        <div key={category}>
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">
            {category.replace('-', ' ')} {CATEGORY_EMOJIS[category] || '🏷️'}
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryTags.map(tag => {
              const isSelected = selectedTags.some(t => t.id === tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content hover:bg-base-200'
                  }`}
                  type="button"
                >
                  <span className="mr-1">{tag.emoji || '🏷️'}</span>
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <form onSubmit={handleAddTag} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Add new tag..."
          className="input input-bordered flex-1"
          disabled={loading}
        />

        <select
          value={newTagCategory}
          onChange={(e) => setNewTagCategory(e.target.value)}
          className="select select-bordered"
          disabled={loading}
        >
          <option value="strategy">Strategy</option>
          <option value="asset">Asset</option>
          <option value="market-condition">Market Condition</option>
          <option value="emotional-state">Emotional State</option>
          <option value="other">Other</option>
        </select>

        <button type="submit" className="btn btn-primary px-4" disabled={loading || !newTagName.trim()}>
          Add
        </button>
      </form>

      {loading && (
        <div className="text-center py-2">
          <svg className="animate-spin h-5 w-5 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      )}
    </div>
  )
}

export default TagSelector
