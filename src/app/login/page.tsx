"use client"
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Login Error: " + error.message)
    } else if (data.user) {
      alert("Login Successful!")
      // This forces the browser to recognize the new session
      router.refresh() 
      // Redirect to the dashboard
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-slate-100">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">VitalSync Login</h1>
        
        <input 
          type="email" 
          placeholder="Email" 
          required
          className="w-full p-4 mb-4 border rounded-xl outline-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required
          className="w-full p-4 mb-6 border rounded-xl outline-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="mt-6 text-center text-sm">
          New here? <Link href="/register" className="text-blue-600 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  )
}