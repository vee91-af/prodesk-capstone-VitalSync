"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  History,
  FileText,
  LogOut,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Activity,
  ChevronRight,
  User
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [medicalHistory, setMedicalHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)

  // Booking Form State
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        console.error("Patient Dashboard - Profile missing or error:", error)
        return
      }

      console.log("Patient Dashboard - Current Role:", profile.role)

      if (profile.role === 'doctor') {
        console.log("Redirecting doctor to correct portal...")
        router.push('/dashboard')
        return
      }

      setUser(user)



      // Parallel data fetching
      // Note: We use !doctor_id to specify which foreign key to use for the join
      const [doctorsRes, appointmentsRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'doctor'),
        supabase.from('appointments')
          .select('*, profiles!appointments_doctor_id_fkey(email)')
          .eq('patient_id', user.id)
          .order('date', { ascending: false }),




        supabase.from('medical_history').select('*').eq('patient_id', user.id).order('diagnosis_date', { ascending: false })
      ])

      if (doctorsRes.error) console.error("Patient Dashboard - Doctors Error:", doctorsRes.error.message)
      if (appointmentsRes.error) console.error("Patient Dashboard - Appointments Error:", appointmentsRes.error.message)
      if (historyRes.error) console.error("Patient Dashboard - History Error:", historyRes.error.message)

      if (!doctorsRes.error) setDoctors(doctorsRes.data || [])
      if (!appointmentsRes.error) setAppointments(appointmentsRes.data || [])
      if (!historyRes.error) setMedicalHistory(historyRes.data || [])


      setIsLoading(false)
    }

    fetchData()

    // Set up realtime subscription for doctor availability
    const channel = supabase
      .channel('doctor-availability')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new.role === 'doctor') {
            setDoctors(current =>
              current.map(doc => doc.id === payload.new.id ? { ...doc, is_online: payload.new.is_online } : doc)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])




  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      return toast.warning("Please fill all booking details")
    }

    setIsBooking(true)
    const { error: appError } = await supabase.from('appointments').insert([{
      patient_id: user.id,
      doctor_id: selectedDoctor,
      date: appointmentDate,
      time: appointmentTime,
      notes: notes,
      status: 'scheduled'
    }])

    if (appError) {
      toast.error("Booking failed: " + appError.message)
    } else {
      // Automatically add to Doctor's Roster too
      const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'short' })
      await supabase.from('patients').insert([{
        name: user.email?.split('@')[0] || 'New Patient',
        admission_day: dayOfWeek
      }])

      toast.success("Appointment booked and added to roster!")

      // Reset form
      setSelectedDoctor('')
      setAppointmentDate('')
      setAppointmentTime('')
      setNotes('')
    }
    setIsBooking(false)
  }

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
      </div>
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Initializing your health portal...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900">
      <Toaster position="top-right" richColors />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Activity size={24} />
            </div>
            <span className="text-xl font-black text-blue-600 tracking-tight">VitalSync</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800">{user?.email}</p>
              <p className="text-xs text-blue-500 font-medium">Patient Account</p>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Hello, Patient! 👋</h1>
          <p className="text-slate-500">Manage your health journey and upcoming consultations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Booking & History */}
          <div className="lg:col-span-8 space-y-8">

            {/* Streamlined Doctor Marketplace */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope className="text-blue-600" size={24} />
                  Available Specialists
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {doctors.filter(d => d.is_online).length} Online Now
                </div>
              </div>

              {!selectedDoctor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.length === 0 ? (
                    <div className="col-span-2 p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 italic">
                      No doctors available at the moment.
                    </div>
                  ) : (
                    doctors.map(doc => (
                      <div
                        key={doc.id}
                        className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-50 transition-all group cursor-pointer"
                        onClick={() => setSelectedDoctor(doc.id)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Stethoscope size={24} />
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase border ${doc.is_online ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {doc.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 truncate mb-1">{doc.email}</h3>
                        <p className="text-xs text-slate-500 mb-4 font-medium">Senior Medical Specialist</p>
                        <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                          Select Specialist
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                        <Calendar size={28} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">Booking with Specialist</h3>
                        <p className="text-sm text-blue-600 font-medium">{doctors.find(d => d.id === selectedDoctor)?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDoctor('')}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 px-4 py-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      Change Doctor
                    </button>
                  </div>

                  <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Preferred Date</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full p-4 bg-white border border-blue-100 rounded-2xl outline-blue-600 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Preferred Time</label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full p-4 bg-white border border-blue-100 rounded-2xl outline-blue-600 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Symptoms / Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Briefly describe your symptoms..."
                        className="w-full p-4 bg-white border border-blue-100 rounded-2xl outline-blue-600 min-h-[120px] shadow-sm resize-none"
                      />
                    </div>
                    <button
                      disabled={isBooking}
                      className="md:col-span-2 w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
                    >
                      {isBooking ? <Loader2 className="animate-spin" size={24} /> : <>Confirm & Book Slot <Plus size={24} /></>}
                    </button>
                  </form>
                </div>
              )}
            </section>


            {/* Appointment History */}
            <section>
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="text-blue-600" size={24} />
                  Appointment History
                </h2>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  {appointments.length} Total
                </span>
              </div>

              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-100">
                    <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">No appointments scheduled yet.</p>
                  </div>
                ) : (
                  appointments.map((app) => (
                    <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-200 transition-colors group">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${app.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                          {app.status === 'scheduled' ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{app.doctor?.email || 'General Physician'}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {app.date}</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {app.time}</span>
                          </div>
                        </div>

                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <p className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${app.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                              app.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                            {app.status}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{app.notes || 'No notes provided'}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${app.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                            app.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                              'bg-slate-100 text-slate-400'
                          }`}>
                          {app.status === 'confirmed' ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Medical History & Profile */}
          <div className="lg:col-span-4 space-y-8">

            {/* Medical History */}
            <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-blue-400" size={24} />
                Medical History
              </h2>

              <div className="space-y-6">
                {medicalHistory.length === 0 ? (
                  <div className="text-slate-500 text-sm italic">
                    Your digitized medical records will appear here after your first consultation.
                  </div>
                ) : (
                  medicalHistory.map((item) => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-blue-500/30">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-slate-900"></div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{item.diagnosis_date}</p>
                      <h4 className="font-bold text-lg mt-1">{item.condition}</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.treatment}</p>
                    </div>
                  ))
                )}

                {/* Visual Placeholder for UX */}
                <div className="pt-4 border-t border-white/10 mt-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                    <span>Recent Activity</span>
                    <Activity size={14} />
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-white/5 rounded-full w-full"></div>
                    <div className="h-2 bg-white/5 rounded-full w-3/4"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Profile Stats */}
            <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Vital Profile</h3>
                  <p className="text-sm text-slate-500">ID: VS-{user?.id?.slice(0, 8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Blood Group</p>
                  <p className="text-xl font-black text-slate-800">B+</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Last Visit</p>
                  <p className="text-sm font-black text-slate-800">{appointments[0]?.date || 'None'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Insurance</p>
                  <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active Premium Sync
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}


