"use client"
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'doctor' | 'patient'>('patient')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      toast.error(error.message)
    } else if (data.user) {
      // Save role to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email: data.user.email, role }])

      if (profileError) {
        toast.error("Error creating profile: " + profileError.message)
      } else {
        toast.success("Registration success!")
        // Redirect based on role
        if (role === 'doctor') {
          router.push('/dashboard')
        } else {
          router.push('/patient-dashboard')
        }
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <Toaster position="top-right" richColors />
      <form onSubmit={handleRegister} className="p-8 bg-white shadow-xl rounded-3xl w-full max-w-md border border-slate-100">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">Create Account</h1>
        <p className="text-slate-500 mb-8 text-sm">Join VitalSync medical network</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              required
              className="w-full p-3 border rounded-xl outline-blue-500 bg-slate-50 border-slate-200"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              className="w-full p-3 border rounded-xl outline-blue-500 bg-slate-50 border-slate-200"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`p-3 rounded-xl border-2 transition-all ${role === 'patient' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`p-3 rounded-xl border-2 transition-all ${role === 'doctor' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}
              >
                Doctor
              </button>
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold mt-8 hover:bg-blue-700 transition disabled:bg-blue-300 shadow-lg shadow-blue-100"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  )
}