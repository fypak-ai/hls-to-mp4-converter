import { useState, useRef } from 'react'
import { Upload, Link, FileVideo, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { uploadFile, startConvert, pollJob } from '../api.js'

const MODES = ['url', 'file']

export default function ConverterPage({ onConverted }) {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | converting | done | error
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const fileRef = useRef()

  const handleConvert = async () => {
    setError('')
    try {
      let filename = null

      if (mode === 'file') {
        if (!file) return
        setStatus('uploading')
        setProgress('Enviando arquivo...')
        const up = await uploadFile(file)
        filename = up.filename
      }

      setStatus('converting')
      setProgress('Iniciando conversão...')
      const job = await startConvert({ url: mode === 'url' ? url : null, filename })

      // Poll
      let current = job
      while (current.status === 'pending' || current.status === 'converting') {
        await sleep(1500)
        current = await pollJob(current.id)
        setProgress(current.status === 'converting' ? 'Convertendo com ffmpeg...' : 'Aguardando...')
      }

      if (current.status === 'done') {
        setStatus('done')
        setProgress('')
        onConverted(current)
      } else {
        throw new Error(current.error || 'Erro desconhecido')
      }
    } catch (e) {
      setStatus('error')
      setError(e.message)
    }
  }

  const reset = () => {
    setStatus('idle')
    setUrl('')
    setFile(null)
    setError('')
    setProgress('')
  }

  const canConvert = mode === 'url' ? url.trim().length > 0 : !!file

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Converter HLS → MP4
        </h1>
        <p className="text-slate-400 text-sm">
          Cole um link M3U8 ou envie um arquivo para converter em MP4
        </p>
      </div>

      <div className="glass p-6 space-y-5">
        {/* Mode toggle */}
        <div className="flex gap-2 bg-surface-900 p-1 rounded-xl">
          {[{ id: 'url', label: 'Link URL', icon: Link }, { id: 'file', label: 'Arquivo', icon: FileVideo }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                mode === id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        {mode === 'url' ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">URL do Stream</label>
            <input
              className="input-field font-mono text-sm"
              placeholder="https://example.com/stream/index.m3u8"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-200"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
          >
            <input ref={fileRef} type="file" accept=".m3u8,.m3u" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            <Upload className="mx-auto mb-2 text-slate-500" size={32} />
            {file ? (
              <p className="text-brand-400 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-slate-300 font-medium mb-1">Arraste ou clique para enviar</p>
                <p className="text-slate-500 text-xs">.m3u8 / .m3u</p>
              </>
            )}
          </div>
        )}

        {/* Status feedback */}
        {status === 'uploading' || status === 'converting' ? (
          <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
            <Loader2 size={18} className="text-brand-400 animate-spin flex-shrink-0" />
            <span className="text-brand-300 text-sm">{progress}</span>
          </div>
        ) : status === 'done' ? (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 text-sm">Conversão concluída! Veja em Convertidos.</span>
          </div>
        ) : status === 'error' ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-red-300 text-sm font-medium">Erro na conversão</span>
            </div>
            <pre className="text-red-400/70 text-xs overflow-auto max-h-24 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-3">
          {status === 'done' || status === 'error' ? (
            <button className="btn-primary flex-1" onClick={reset}>Nova conversão</button>
          ) : (
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={!canConvert || status === 'uploading' || status === 'converting'}
              onClick={handleConvert}
            >
              {status === 'uploading' || status === 'converting' ? (
                <><Loader2 size={16} className="animate-spin" /> Convertendo...</>
              ) : (
                <><ArrowRight size={16} /> Converter para MP4</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
