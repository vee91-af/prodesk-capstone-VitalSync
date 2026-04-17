"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setEmail(user.email || '')
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">VitalSync</h1>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg font-semibold">Dashboard</div>
          <div className="p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">Appointments</div>
          <div className="p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">Medical Records</div>
          <div className="p-3 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">Settings</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Patient Overview</h2>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Welcome back,</h3>
            <p className="text-slate-500">{email}</p>
          </div>

          {/* New User "Getting Started" Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">👤</div>
              <h4 className="font-bold mb-2">Complete Profile</h4>
              <p className="text-sm text-slate-500">Add your age, blood group, and medical history.</p>
              <button className="mt-4 text-blue-600 text-sm font-semibold hover:underline">Start now →</button>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 text-xl">📅</div>
              <h4 className="font-bold mb-2">Book Appointment</h4>
              <p className="text-sm text-slate-500">Schedule your first consultation with a specialist.</p>
              <button className="mt-4 text-green-600 text-sm font-semibold hover:underline">View doctors →</button>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-xl">📄</div>
              <h4 className="font-bold mb-2">Upload Records</h4>
              <p className="text-sm text-slate-500">Keep all your prescriptions and reports in one place.</p>
              <button className="mt-4 text-purple-600 text-sm font-semibold hover:underline">Upload →</button>
            </div>
          </div>

          {/* Health Summary Placeholder */}
          <div className="mt-10 p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <p className="text-slate-400">No health data available yet. Complete your profile to see your vitals here.</p>
          </div>
        </div>
      </main>
    </div>
  )
}