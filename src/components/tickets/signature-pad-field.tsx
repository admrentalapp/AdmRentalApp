import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export type SignaturePadFieldHandle = {
  isEmpty: () => boolean
  clear: () => void
  toDataUrl: () => string
}

export const SignaturePadField = forwardRef<
  SignaturePadFieldHandle,
  {
    id: string
    label: string
    onChange?: () => void
  }
>(function SignaturePadField({ id, label, onChange }, ref) {
  const padRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    clear: () => {
      padRef.current?.clear()
      onChange?.()
    },
    toDataUrl: () => padRef.current?.toDataURL('image/png') ?? '',
  }))

  useEffect(() => {
    const container = containerRef.current
    const canvas = padRef.current?.getCanvas()
    if (!container || !canvas) return

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const width = container.clientWidth
      const height = 160

      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const context = canvas.getContext('2d')
      if (context) {
        context.scale(ratio, ratio)
      }

      padRef.current?.clear()
      onChange?.()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={() => padRef.current?.clear()}
          className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
        >
          Limpar
        </button>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-border bg-white"
        style={{ touchAction: 'none' }}
      >
        <SignatureCanvas
          ref={padRef}
          penColor="#111827"
          canvasProps={{
            id,
            className: 'block w-full cursor-crosshair',
          }}
          onEnd={onChange}
        />
      </div>
    </div>
  )
})
