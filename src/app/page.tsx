"use client"
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">VitalSync</h1>
        <div className="space-x-4">
          <Link href="/login" className="text-zinc-600 font-medium hover:text-blue-600 transition">
            Sign In
          </Link>
          <Link href="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-8 py-24 text-center">
        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
          Healthcare Management Simplified
        </span>
        <h2 className="mt-8 text-6xl font-black text-zinc-900 leading-tight">
          Your Health, <span className="text-blue-600">Synchronized.</span>
        </h2>
        <p className="mt-6 text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          The all-in-one patient dashboard for tracking vitals, managing appointments, 
          and accessing medical records securely from anywhere.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4">
          <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-200">
            Create Free Account
          </Link>
          <Link href="/login" className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 hover:-translate-y-1 transition-all shadow-xl shadow-zinc-200">
            Access Dashboard
          </Link>
        </div>

        {/* Preview Feature Cards */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Smart Booking</h3>
            <p className="mt-2 text-zinc-500">Schedule appointments with specialists in just a few clicks.</p>
          </div>
          <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Real-time Vitals</h3>
            <p className="mt-2 text-zinc-500">Monitor your heart rate, BP, and activity through our dashboard.</p>
          </div>
          <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Secure Records</h3>
            <p className="mt-2 text-zinc-500">Your medical data is encrypted and accessible only to you.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 text-center text-zinc-400 text-sm">
        © 2026 VitalSync Healthcare Solutions. All rights reserved.
      </footer>
    </div>
  )
}