import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({ src }) {
  const videoRef = useRef()

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      return () => hls.destroy()
    } else {
      video.src = src
      video.play().catch(() => {})
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-xl bg-black max-h-[480px]"
      style={{ aspectRatio: '16/9' }}
    />
  )
}
