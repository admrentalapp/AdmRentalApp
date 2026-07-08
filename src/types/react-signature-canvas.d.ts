declare module 'react-signature-canvas' {
  import type { Component, Ref } from 'react'

  export interface ReactSignatureCanvasProps {
    velocityFilterWeight?: number
    minWidth?: number
    maxWidth?: number
    minDistance?: number
    dotSize?: number | (() => number)
    penColor?: string
    throttle?: number
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>
    backgroundColor?: string
    clearOnResize?: boolean
    onEnd?: () => void
  }

  export default class SignatureCanvas extends Component<ReactSignatureCanvasProps> {
    getCanvas(): HTMLCanvasElement
    getTrimmedCanvas(): HTMLCanvasElement
    clear(): void
    isEmpty(): boolean
    fromDataURL(base64: string): void
    toDataURL(type?: string, encoderOptions?: number): string
  }
}
