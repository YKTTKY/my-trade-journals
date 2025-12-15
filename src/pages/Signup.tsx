import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/supabase'
import toast from 'react-hot-toast'

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password)
      if (error) throw error

      toast.success('Account created successfully! Please check your email to verify your account.')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">Trading Journal Pro</h1>
          <p className="text-base-content/70">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-base-content mb-2">Email Address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input input-bordered w-full" placeholder="you@example.com" />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-base-content mb-2">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input input-bordered w-full" placeholder="At least 6 characters" minLength={6} />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-base-content mb-2">Confirm Password</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input input-bordered w-full" placeholder="Confirm your password" minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="w-full btn btn-primary flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-base-content/70">Already have an account? <Link to="/login" className="text-primary hover:text-primary-focus font-medium">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
