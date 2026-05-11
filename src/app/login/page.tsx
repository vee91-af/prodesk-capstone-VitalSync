"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [healingMode, setHealingMode] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient'>('patient')
  const router = useRouter()
  
  // Redirect already logged-in users
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          router.push(profile.role === 'doctor' ? '/dashboard' : '/patient-dashboard')
        }
      }
    }
    checkSession()
  }, [router])


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("Attempting login for:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log("Auth success, fetching profile...")
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.log("Profile missing, entering healing mode")
          setPendingUser(data.user)
          setHealingMode(true)
          toast.info("Profile setup incomplete. Please choose your role.")
          setLoading(false)
        } else {
          console.log("Profile found, redirecting as:", profile.role)
          toast.success("Welcome back!")
          redirectUser(profile.role)
        }
      }
    } catch (err) {
      console.error("Login crash:", err)
      toast.error("An unexpected error occurred.")
      setLoading(false)
    }
  }

  const completeProfile = async () => {
    if (!pendingUser) return
    setLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .insert([{ id: pendingUser.id, email: pendingUser.email, role: selectedRole, is_online: true }])

    if (error) {
      toast.error("Error creating profile: " + error.message)
      setLoading(false)
    } else {
      toast.success("Profile completed!")
      redirectUser(selectedRole)
    }
  }

  const redirectUser = (role: string) => {
    const path = role === 'doctor' ? '/dashboard' : '/patient-dashboard'
    router.push(path)
    // We keep loading true during the transition to prevent button flickering
    setTimeout(() => {
      router.refresh()
      setLoading(false)
    }, 1000)
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-slate-900">
      <Toaster position="top-right" richColors />
      
      {!healingMode ? (
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-2xl shadow-slate-200 rounded-[2.5rem] w-full max-w-md border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-blue-600 mb-2">VitalSync</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sign in to your portal</p>
          </div>

          {/* Role Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole('patient')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${selectedRole === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('doctor')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${selectedRole === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Doctor
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                required
                className="w-full p-4 border border-slate-200 rounded-2xl outline-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                className="w-full p-4 border border-slate-200 rounded-2xl outline-blue-500 bg-slate-50 focus:bg-white transition-all shadow-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black mt-8 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-blue-100 text-lg"
          >
            {loading ? "Syncing..." : "Sign In"}
          </button>

          <p className="mt-8 text-center text-xs font-bold text-slate-400">
            Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Create one here</Link>
          </p>
        </form>

      ) : (
        <div className="p-8 bg-white shadow-xl rounded-[2rem] w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-300">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 mb-2">Complete Your Profile</h1>
            <p className="text-slate-500 text-sm">We just need to know your role to continue.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setSelectedRole('patient')}
              className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedRole === 'patient' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-inner' : 'border-slate-100 text-slate-400'}`}
            >
              <span className="text-2xl">👤</span>
              <span className="font-bold">Patient</span>
            </button>
            <button
              onClick={() => setSelectedRole('doctor')}
              className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedRole === 'doctor' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-inner' : 'border-slate-100 text-slate-400'}`}
            >
              <span className="text-2xl">🩺</span>
              <span className="font-bold">Doctor</span>
            </button>
          </div>

          <button 
            onClick={completeProfile}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            {loading ? "Syncing..." : "Finish Setup"}
          </button>
        </div>
      )}
    </div>
  )
}
