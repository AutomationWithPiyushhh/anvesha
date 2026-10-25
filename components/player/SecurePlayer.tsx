'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Watermark } from '@/components/player/Watermark'
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface SecurePlayerProps {
  videoId: string
  userEmail: string
  initialPositionSeconds?: number
  onCompleted?: () => void
  onNextLesson?: () => void
  hasNextLesson?: boolean
}

export function SecurePlayer({
  videoId,
  userEmail,
  initialPositionSeconds = 0,
  onCompleted,
  onNextLesson,
  hasNextLesson = false,
}: SecurePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false)
  const [playbackStartedAt, setPlaybackStartedAt] = useState<string | null>(null)
  const [stoppedReason, setStoppedReason] = useState<string | null>(null)
  const [isMarkedCompleted, setIsMarkedCompleted] = useState(false)

  const lastSavedPosition = useRef(0)
  const hasResumedInitial = useRef(false)
  const tokenExpiresAt = useRef<number | null>(null)

  // 1. Attach HLS stream to video tag
  const loadHlsStream = useCallback(
    (playbackUrl: string) => {
      const video = videoRef.current
      if (!video) return

      if (hlsRef.current) {
        hlsRef.current.destroy()
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        })

        hls.loadSource(playbackUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false)
          if (!hasResumedInitial.current && initialPositionSeconds > 0) {
            video.currentTime = initialPositionSeconds
            hasResumedInitial.current = true
          }
        })

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError()
                break
              default:
                hls.destroy()
                setError('Failed to load video stream. Please retry.')
                break
            }
          }
        })

        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = playbackUrl
        video.addEventListener('loadedmetadata', () => {
          setLoading(false)
          if (!hasResumedInitial.current && initialPositionSeconds > 0) {
            video.currentTime = initialPositionSeconds
            hasResumedInitial.current = true
          }
        })
      } else {
        setError('Your browser does not support HLS video playback.')
        setLoading(false)
      }
    },
    [initialPositionSeconds]
  )

  // 2. Fetch authorized HLS playback token from server route
  const fetchVideoToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStoppedReason(null)

    try {
      const res = await fetch('/api/video/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to authorize video streaming')
        setLoading(false)
        return
      }

      tokenExpiresAt.current = data.expires
      setPlaybackStartedAt(data.playbackStartedAt)

      loadHlsStream(data.playbackUrl)
    } catch {
      setError('An unexpected network error occurred while initializing the secure player.')
      setLoading(false)
    }
  }, [videoId, loadHlsStream])

  // Initial load effect
  useEffect(() => {
    let isMounted = true
    hasResumedInitial.current = false

    async function initialize() {
      try {
        const res = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        })

        const data = await res.json()
        if (!isMounted) return

        if (!res.ok) {
          setError(data.error || 'Failed to authorize video streaming')
          setLoading(false)
          return
        }

        tokenExpiresAt.current = data.expires
        setPlaybackStartedAt(data.playbackStartedAt)
        loadHlsStream(data.playbackUrl)
      } catch {
        if (isMounted) {
          setError('An unexpected network error occurred while initializing the secure player.')
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [videoId, loadHlsStream])

  // 3. Save progress to /api/progress
  const saveProgress = useCallback(
    async (posSeconds: number, markCompleted: boolean) => {
      if (Math.abs(posSeconds - lastSavedPosition.current) < 2 && !markCompleted) {
        return
      }

      lastSavedPosition.current = posSeconds

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            positionSeconds: Math.floor(posSeconds),
            completed: markCompleted,
          }),
        })

        if (markCompleted) {
          setIsMarkedCompleted(true)
          onCompleted?.()
        }
      } catch {
        // Quietly handle transient save error
      }
    },
    [videoId, onCompleted]
  )

  // 4. Active heartbeat every 30s: enforces single active playback per user
  useEffect(() => {
    if (!isPlaying || !playbackStartedAt) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/video/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            playbackStartedAt,
          }),
        })

        const data = await res.json()

        if (data.status === 'stopped') {
          // Pause player immediately
          videoRef.current?.pause()
          setIsPlaying(false)
          setStoppedReason(
            data.message || 'Playback stopped: another session started on another device.'
          )
        }
      } catch {
        // Transient network issue
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isPlaying, videoId, playbackStartedAt])

  // 5. Save position every 10 seconds while playing & check ~90% completion
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video) return

      const curr = video.currentTime
      const dur = video.duration || duration

      const is90Percent = dur > 0 && curr / dur >= 0.9
      const shouldComplete = is90Percent && !isMarkedCompleted

      saveProgress(curr, shouldComplete || isMarkedCompleted)
    }, 10000)

    return () => clearInterval(interval)
  }, [isPlaying, duration, isMarkedCompleted, saveProgress])

  // Save on pause or page unload
  useEffect(() => {
    const handleUnload = () => {
      if (videoRef.current) {
        navigator.sendBeacon(
          '/api/progress',
          JSON.stringify({
            videoId,
            positionSeconds: Math.floor(videoRef.current.currentTime),
            completed: isMarkedCompleted,
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [videoId, isMarkedCompleted])

  // 6. Transparent token refresh before expiration (~2 mins before)
  useEffect(() => {
    if (!tokenExpiresAt.current) return

    const msUntilExpiry = (tokenExpiresAt.current - Math.floor(Date.now() / 1000) - 120) * 1000
    if (msUntilExpiry <= 0) return

    const timer = setTimeout(() => {
      fetchVideoToken()
    }, msUntilExpiry)

    return () => clearTimeout(timer)
  }, [fetchVideoToken])

  // 7. Custom container fullscreen handling (requirement 6)
  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    // iOS detection for CSS pseudo-fullscreen fallback
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS) {
      setIsPseudoFullscreen((prev) => !prev)
      return
    }

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {
        setIsPseudoFullscreen(true)
      })
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Video control helpers
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
      saveProgress(video.currentTime, isMarkedCompleted)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
    saveProgress(newTime, isMarkedCompleted)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative group bg-black rounded-3xl overflow-hidden aspect-video w-full shadow-2xl select-none ${
        isPseudoFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none'
          : ''
      }`}
    >
      {/* Native Video Tag with security constraints */}
      <video
        ref={videoRef}
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback nofullscreen"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Dynamic Drifting Email Watermark (stays in fullscreen) */}
      <Watermark email={userEmail} containerRef={containerRef} />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center gap-3 text-white">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[#ffc107] rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Securing HLS Stream...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-white">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h3 className="text-base font-bold mb-1">Playback Error</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">{error}</p>
          <button
            onClick={fetchVideoToken}
            className="btn-accent text-xs font-bold py-2 px-4 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Stream</span>
          </button>
        </div>
      )}

      {/* Concurrency Interruption Modal */}
      {stoppedReason && (
        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#ffc107] flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">Session Paused</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
            {stoppedReason}
          </p>
          <button
            onClick={fetchVideoToken}
            className="btn-accent text-xs font-bold py-2.5 px-6 flex items-center gap-2 shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play on this Device</span>
          </button>
        </div>
      )}

      {/* Custom Player Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
        {/* Progress Timeline Slider */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ffc107]"
        />

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-[#ffc107] transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-1.5 hover:text-[#ffc107] transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time Indicator */}
            <span className="font-mono text-[11px] text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Manual Mark Complete */}
            <button
              onClick={() => saveProgress(currentTime, true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                isMarkedCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-white/10 hover:bg-[#ffc107] hover:text-black text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isMarkedCompleted ? 'Completed' : 'Mark Watched'}</span>
            </button>

            {/* Next Lesson shortcut if available */}
            {hasNextLesson && onNextLesson && (
              <button
                onClick={onNextLesson}
                className="btn-accent py-1 px-3 text-[11px] font-bold"
              >
                Next Lesson
              </button>
            )}

            {/* Custom Container Fullscreen Toggle (keeps watermark) */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-[#ffc107] transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen || isPseudoFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
