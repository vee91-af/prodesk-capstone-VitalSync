"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Activity, Users, LogOut, Sparkles, Loader2, Menu, X, Calendar, Clock, CheckCircle2, Stethoscope } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { toast, Toaster } from 'sonner'

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [patients, setPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [name, setName] = useState('')
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments'>('overview')
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let appointmentsChannel: any = null

    const checkUser = async () => {
      setIsCheckingRole(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error("Dashboard - Profile missing or error:", profileError)
        router.push('/login')
        return
      }

      if (profile.role === 'patient') {
        console.log("Redirecting patient to correct portal...")
        router.push('/patient-dashboard')
        return
      }


      // If we reach here, user is a confirmed doctor
      setUserId(user.id)
      setEmail(user.email || '')
      setIsCheckingRole(false)

      await supabase.from('profiles').update({ is_online: true }).eq('id', user.id)
      
      fetchPatients()
      fetchAppointments(user.id)
      setIsDataLoading(false)

      // REAL-TIME SUBSCRIPTIONS
      const channelId = `doctor-live-${user.id}-${Math.random().toString(36).slice(2, 7)}`
      appointmentsChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${user.id}` },
          () => fetchAppointments(user.id)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          () => fetchPatients()
        )
        .subscribe()
    }

    checkUser()

    return () => {
      if (appointmentsChannel) supabase.removeChannel(appointmentsChannel)
    }
  }, [router])


  const handleLogout = async () => {
    await supabase.from('profiles').update({ is_online: false }).eq('id', userId)
    await supabase.auth.signOut()
    router.push('/login')
  }


  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)

    if (error) {
      toast.error("Failed to update status: " + error.message)
    } else {
      toast.success(`Appointment ${newStatus}!`)
      // Refresh list
      const { data: { user } } = await supabase.auth.getUser()
      if (user) fetchAppointments(user.id)
    }
  }

  const fetchPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*')
    if (!error) setPatients(data || [])
  }

  const fetchAppointments = async (doctor_id: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles!appointments_patient_id_fkey(email)')
      .eq('doctor_id', doctor_id)
      .order('date', { ascending: false })





    
    if (error) {
      console.error("Doctor Dashboard - Fetch Appointments Error:", error.message, error.details)
    } else {
      setAppointments(data || [])
    }

  }

  const generateAISummary = async () => {
    if (patients.length === 0) return toast.error("No patients to analyze!");
    setIsAiLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const patientCount = patients.length;
      const busiestDay = getDynamicChartData().reduce((prev, current) => 
        (prev.count > current.count) ? prev : current
      ).name;

      const insights = [
        `Current roster shows ${patientCount} active admissions. Observation suggests peak activity on ${busiestDay}.`,
        `VitalSync Analysis: ${patientCount} patients registered. Data patterns indicate stable admission rates.`,
        `System Report: Shift handover complete for ${patientCount} individuals. Review protocols for ${busiestDay}.`
      ];

      setAiSummary(insights[Math.floor(Math.random() * insights.length)]);
      toast.success("AI Insights Generated");
    } catch (err) {
      toast.error("Analysis engine busy.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.warning("Enter a name");
    const { error } = await supabase.from('patients').insert([{ name, admission_day: selectedDay }])
    
    if (!error) {
      setName('')
      fetchPatients()
      toast.success(`${name} added to roster`)
    }
  }

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (!error) {
      fetchPatients()
      toast.error("Patient record deleted")
    }
  }

  const getDynamicChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    return days.map(day => ({
      name: day,
      count: patients.filter(p => p.admission_day === day).length
    }))
  }

  if (isCheckingRole) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Verifying Access...</p>
        </div>
      </div>
    )
  }

  if (isDataLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
        <p className="text-slate-500 font-medium font-bold uppercase tracking-widest text-[10px]">Syncing VitalData...</p>
      </div>
    )
  }


  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-50 w-72 h-full bg-white border-r border-slate-100 p-8 flex flex-col transition-transform duration-300 md:translate-x-0 shadow-2xl md:shadow-none`}>
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Stethoscope size={18} />
            </div>
            <span className="text-xl font-black text-blue-600 tracking-tight">VitalSync</span>
          </div>
          <button className="md:hidden p-2 hover:bg-slate-50 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Activity size={20}/> Overview
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'appointments' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Calendar size={20}/> Appointments
          </button>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 p-4 hover:bg-red-50 rounded-2xl font-bold transition-all mt-auto border border-red-50">
          <LogOut size={20}/> Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-100" onClick={() => setIsSidebarOpen(true)}>
              <Activity size={20} className="text-blue-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Welcome, Dr. {email.split('@')[0]}</h1>
              <p className="text-slate-400 font-medium">Here's your medical overview for today.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            System Online
          </div>
        </header>

        {activeTab === 'overview' ? (
          <>
            <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] text-white mb-8 shadow-2xl shadow-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Activity size={150} />
              </div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-4xl font-black mb-2 tracking-tight">Today's Pulse</h2>
                    <p className="text-slate-400 font-medium">Real-time diagnostics and patient volume.</p>
                  </div>
                  <button onClick={generateAISummary} disabled={isAiLoading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 text-sm flex items-center gap-2">
                    {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : "Generate Health Insight"}
                  </button>
                </div>
                {aiSummary && (
                  <div className="mt-8 p-6 bg-white/5 rounded-[1.5rem] border border-white/10 animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
                    <p className="text-base md:text-lg italic leading-relaxed text-slate-200">"{aiSummary}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800">Admission Volume</h3>
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-3 py-1 rounded-full border border-slate-100">Weekly Tracker</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDynamicChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
                <h3 className="font-black text-lg mb-6 text-slate-800">Add Medical History</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const { data: { user } } = await supabase.auth.getUser();
                  const targetPatient = patients.find(p => p.name === e.currentTarget.patientName.value);
                  if (!targetPatient) return toast.error("Patient not in roster");
                  
                  const { error } = await supabase.from('medical_history').insert([{
                    patient_id: targetPatient.id || user?.id, // Fallback for testing
                    doctor_id: user?.id,
                    diagnosis: e.currentTarget.diagnosis.value,
                    treatment: e.currentTarget.treatment.value,
                    diagnosis_date: new Date().toISOString()
                  }]);
                  
                  if (!error) {
                    toast.success("Medical History added!");
                    e.currentTarget.reset();
                  } else {
                    toast.error("Error: " + error.message);
                  }
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Patient</label>
                    <select name="patientName" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-blue-600 font-bold">
                      {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Diagnosis</label>
                    <input name="diagnosis" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-blue-600 font-medium" placeholder="Condition..." required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Treatment/Notes</label>
                    <textarea name="treatment" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-blue-600 font-medium h-24" placeholder="Prescription or notes..." required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-2">Update Records</button>
                </form>
              </section>

              <section className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">

                <h3 className="font-black text-lg mb-6 text-slate-800">Quick Roster</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.length === 0 ? (
                    <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 italic">
                      No active admissions.
                    </div>
                  ) : patients.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm font-black text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.admission_day}</p>
                        </div>
                      </div>
                      <button onClick={() => deletePatient(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>

        ) : (
          <div className="space-y-6">
            {appointments.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-medium">No appointments scheduled with you yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((app) => (
                  <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        app.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                        app.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {app.status === 'confirmed' ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Patient: {app.patient?.email}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-medium"><Calendar size={14} /> {app.date}</span>
                          <span className="flex items-center gap-1 font-medium"><Clock size={14} /> {app.time}</span>
                        </div>
                        {app.notes && <p className="text-xs text-slate-400 mt-2 italic">"{app.notes}"</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        app.status === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' : 
                        app.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {app.status}
                      </span>

                      {app.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => updateAppointmentStatus(app.id, 'cancelled')}
                            className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}


