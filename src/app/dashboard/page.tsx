"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Activity, Users, LogOut } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [patients, setPatients] = useState<any[]>([])
  const [name, setName] = useState('')
  const [selectedDay, setSelectedDay] = useState('Mon')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else {
        setEmail(user.email || '')
        fetchPatients()
      }
    }
    checkUser()
  }, [router])

  const fetchPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*')
    if (!error) setPatients(data || [])
  }

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return;
    const { error } = await supabase
      .from('patients')
      .insert([{ name, admission_day: selectedDay }])
    
    if (!error) {
      setName('')
      fetchPatients()
    }
  }

  const deletePatient = async (id: string) => {
    if (confirm("Delete this patient record?")) {
      await supabase.from('patients').delete().eq('id', id)
      fetchPatients()
    }
  }

  // MILESTONE 3: Dynamic Data Visualization Logic
  const getDynamicChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    return days.map(day => ({
      name: day,
      count: patients.filter(p => p.admission_day === day).length
    }))
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-10 flex items-center gap-2">
          <Activity size={28} /> VitalSync
        </h1>
        <nav className="flex-1 space-y-2">
          <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-3 rounded-xl font-semibold cursor-pointer">
            <Activity size={20}/> Dashboard
          </div>
          <div className="flex items-center gap-3 text-slate-500 p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
            <Users size={20}/> Patients
          </div>
        </nav>
        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="flex items-center gap-3 text-red-500 p-3 hover:bg-red-50 rounded-xl mt-auto transition-all"
        >
          <LogOut size={20}/> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Hospital Overview</h2>
          <p className="text-slate-500 font-medium">Logged in as: <span className="text-blue-600">{email}</span></p>
        </header>

        {/* MILESTONE 3: The Chart Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Weekly Patient Admissions (Live)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDynamicChartData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MILESTONE 1: Form Section */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-4 text-slate-800">Register Admission</h3>
            <form onSubmit={addPatient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admission Day</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                <Plus size={20}/> Add to Roster
              </button>
            </form>
          </section>

          {/* MILESTONE 2: List & Delete Section */}
          <section className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-4 text-slate-800">Recent Patient Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {patients.length > 0 ? patients.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div>
                    <p className="font-bold text-slate-700">{p.name}</p>
                    <p className="text-xs text-blue-500 font-semibold uppercase">{p.admission_day}</p>
                  </div>
                  <button 
                    onClick={() => deletePatient(p.id)} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              )) : (
                <div className="col-span-2 py-10 text-center text-slate-400">
                  <Activity size={40} className="mx-auto mb-2 opacity-20" />
                  <p>No active patients in roster.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}