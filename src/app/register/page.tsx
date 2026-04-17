"use client"
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      alert(error.message)
    } else if (data.user) {
      // If user exists, force move to dashboard
      console.log("Registration success:", data.user)
      router.push('/dashboard') 
      // Add this line to ensure the page refreshes the auth state
      router.refresh() 
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleRegister} className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Create Account</h1>
        <input 
          type="email" 
          placeholder="Email" 
          required
          className="w-full p-3 mb-4 border rounded-lg outline-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required
          className="w-full p-3 mb-6 border rounded-lg outline-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="mt-4 text-center text-sm">
          Already a user? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  )
}