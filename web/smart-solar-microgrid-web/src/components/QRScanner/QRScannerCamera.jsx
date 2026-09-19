import { Html5Qrcode } from 'html5-qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../Common/ui'

const READER_ID = 'qr-reader'

// Camera-based QR scanner. Calls onScan(text) once per successful decode, then stops the camera.
export default function QRScannerCamera({ onScan, disabled = false }) {
  const scannerRef = useRef(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')

  const stop = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch {
      // camera already released
    }
    setActive(false)
  }, [])

  useEffect(() => () => void stop(), [stop])

  const start = async () => {
    setError('')
    setActive(true)
    try {
      // The reader div must be in the DOM before starting.
      await new Promise((r) => requestAnimationFrame(r))
      const scanner = new Html5Qrcode(READER_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          stop().then(() => onScan(text))
        },
        () => {},
      )
    } catch (err) {
      scannerRef.current = null
      setActive(false)
      setError(
        typeof err === 'string' && err.includes('Permission')
          ? 'Camera permission was denied. Allow camera access or paste the token below.'
          : 'Could not start the camera. Paste the QR token below instead.',
      )
    }
  }

  return (
    <div>
      <div
        id={READER_ID}
        className={active ? 'mx-auto max-w-sm overflow-hidden rounded-xl border border-gray-200' : 'hidden'}
      />
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {active ? (
        <Button variant="secondary" className="mt-3" onClick={stop}>
          Stop camera
        </Button>
      ) : (
        <Button onClick={start} disabled={disabled}>
          Start camera scanner
        </Button>
      )}
    </div>
  )
}
