'use client'
export default function TopNavbar() {
  return (
    <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md z-10">
      <div className="text-xl font-bold tracking-tight">الراسخون في القانون</div>
      <div className="flex items-center gap-4">
        <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-300">المسؤول: admin</span>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login' }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm transition-colors">
          تسجيل خروج
        </button>
      </div>
    </header>
  )
}
