'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface WatermarkProps {
  email: string
  containerRef: React.RefObject<HTMLDivElement | null>
}

function getRandomCoords() {
  const randomTop = Math.floor(Math.random() * 60 + 15)
  const randomLeft = Math.floor(Math.random() * 60 + 15)
  return { top: `${randomTop}%`, left: `${randomLeft}%` }
}

export function Watermark({ email, containerRef }: WatermarkProps) {
  // Lazy initialization of random starting coordinates (no synchronous setState in effect)
  const [position, setPosition] = useState(getRandomCoords)
  const watermarkRef = useRef<HTMLDivElement | null>(null)
  const isSelfMutating = useRef(false)

  const randomizePosition = useCallback(() => {
    setPosition(getRandomCoords())
  }, [])

  useEffect(() => {
    // Drift to random position every 22 seconds
    const interval = setInterval(randomizePosition, 22000)
    return () => clearInterval(interval)
  }, [randomizePosition])

  // Anti-tamper MutationObserver: guards against devtools removal or style hiding
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const enforceVisibility = () => {
      const el = watermarkRef.current
      if (!el) {
        // Element was removed from DOM -> force React re-render
        isSelfMutating.current = true
        randomizePosition()
        setTimeout(() => {
          isSelfMutating.current = false
        }, 50)
        return
      }

      // Check if style was tempered with
      const style = window.getComputedStyle(el)
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity || '1') < 0.1
      ) {
        isSelfMutating.current = true
        el.style.display = 'block'
        el.style.visibility = 'visible'
        el.style.opacity = '0.35'
        randomizePosition()
        setTimeout(() => {
          isSelfMutating.current = false
        }, 50)
      }
    }

    const observer = new MutationObserver(() => {
      if (isSelfMutating.current) return
      enforceVisibility()
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    })

    return () => observer.disconnect()
  }, [containerRef, randomizePosition])

  return (
    <div
      ref={watermarkRef}
      id="anvesha-player-watermark"
      className="absolute pointer-events-none select-none z-30 transition-all duration-1000 ease-in-out font-mono text-[11px] sm:text-xs font-semibold tracking-wider text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)',
        opacity: 0.35,
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span>{email}</span>
        <span className="text-[9px] opacity-75 font-sans">ANVESHA PROTECTED</span>
      </div>
    </div>
  )
}
