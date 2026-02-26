import { useState } from 'react'
import ConverterPage from './pages/ConverterPage.jsx'
import ConvertedPage from './pages/ConvertedPage.jsx'
import { Film, Upload } from 'lucide-react'

const NAV = [
  { id: 'converter', label: 'Converter', icon: Upload },
  { id: 'converted', label: 'Convertidos', icon: Film },
]

export default function App() {
  const [page, setPage] = useState('converter')
  const [converted, setConverted] = useState([])

  const addConverted = (job) => {
    setConverted((prev) => {
      if (prev.find((j) => j.id === job.id)) return prev
      return [job, ...prev]
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass m-4 mb-0 px-6 py-4 flex items-center gap-4 sticky top-4 z-50">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Film size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">HLS → MP4</span>
        </div>
        <nav className="flex gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                page === id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
              {id === 'converted' && converted.filter(j => j.status === 'done').length > 0 && (
                <span className="bg-brand-400/20 text-brand-400 text-xs px-1.5 py-0.5 rounded-full">
                  {converted.filter(j => j.status === 'done').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 pt-6">
        {page === 'converter' && <ConverterPage onConverted={(j) => { addConverted(j); setPage('converted') }} />}
        {page === 'converted' && <ConvertedPage jobs={converted} setJobs={setConverted} />}
      </main>
    </div>
  )
}
