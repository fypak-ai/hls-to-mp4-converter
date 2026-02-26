import { useState } from 'react'
import { Film, Trash2, Download, Play, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import VideoPlayer from '../components/VideoPlayer.jsx'
import { deleteJob, mediaUrl } from '../api.js'

const StatusBadge = ({ status }) => {
  const map = {
    pending:    { icon: Clock,         color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',   label: 'Aguardando' },
    converting: { icon: Loader2,       color: 'text-brand-400 bg-brand-400/10 border-brand-400/20',      label: 'Convertendo',  spin: true },
    done:       { icon: CheckCircle,   color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Concluído' },
    error:      { icon: AlertCircle,   color: 'text-red-400 bg-red-400/10 border-red-400/20',             label: 'Erro' },
  }
  const { icon: Icon, color, label, spin } = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon size={11} className={spin ? 'animate-spin' : ''} />
      {label}
    </span>
  )
}

export default function ConvertedPage({ jobs, setJobs }) {
  const [playing, setPlaying] = useState(null)

  const handleDelete = async (job) => {
    try {
      await deleteJob(job.id)
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      if (playing?.id === job.id) setPlaying(null)
    } catch (e) {
      alert('Erro ao deletar: ' + e.message)
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Film size={48} className="mx-auto mb-4 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Nenhum arquivo convertido</h2>
        <p className="text-slate-500 text-sm">Os arquivos convertidos aparecerão aqui após a conversão.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Convertidos</h1>
        <span className="glass px-3 py-1 text-sm text-slate-400">{jobs.length} arquivo{jobs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Player */}
      {playing && playing.status === 'done' && (
        <div className="glass p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-200 truncate pr-4">{playing.source}</h3>
            <button onClick={() => setPlaying(null)} className="text-slate-500 hover:text-slate-200 transition-colors text-xs">Fechar</button>
          </div>
          <VideoPlayer src={mediaUrl(playing.output_url)} />
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="glass p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Film size={18} className="text-brand-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 truncate text-sm">{job.source}</p>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={job.status} />
                <span className="text-slate-600 text-xs">{new Date(job.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {job.status === 'error' && job.error && (
                <p className="text-red-400/70 text-xs mt-1 truncate">{job.error.slice(0, 80)}...</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {job.status === 'done' && (
                <>
                  <button
                    onClick={() => setPlaying(playing?.id === job.id ? null : job)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      playing?.id === job.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/20',
                    ].join(' ')}
                  >
                    <Play size={13} />
                    {playing?.id === job.id ? 'Pausar' : 'Play'}
                  </button>
                  <a
                    href={mediaUrl(job.output_url)}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <Download size={13} />
                    Baixar
                  </a>
                </>
              )}
              <button onClick={() => handleDelete(job)} className="btn-danger flex items-center gap-1.5 text-xs py-2">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
