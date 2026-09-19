import { useState } from 'react'
import { useStationLookup } from '../../hooks/useStationLookup'
import { qrService } from '../../services/qrService'
import { errorMessage } from '../../utils/formatters'
import { Button, Card, PageHeader, inputClass } from '../Common/ui'
import QRVerificationResult from '../Verification/QRVerificationResult'
import VerificationDialog from '../Verification/VerificationDialog'
import QRScannerCamera from './QRScannerCamera'
import ScanResultDisplay from './ScanResultDisplay'

// phase: idle | processing | valid | invalid | completed
export default function QRScannerPage() {
  const stations = useStationLookup()
  const [token, setToken] = useState('')
  const [phase, setPhase] = useState('idle')
  const [reservation, setReservation] = useState(null)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)

  const rescan = () => {
    setToken('')
    setPhase('idle')
    setReservation(null)
    setMessage('')
  }

  const verify = async (value) => {
    const qr = value.trim()
    if (!qr) return
    setToken(qr)
    setPhase('processing')
    setMessage('')
    try {
      setReservation(await qrService.verifyQR(qr))
      setPhase('valid')
    } catch (err) {
      setReservation(null)
      setMessage(errorMessage(err, 'QR verification failed.'))
      setPhase('invalid')
    }
  }

  const showInputs = phase === 'idle' || phase === 'invalid'

  return (
    <>
      <PageHeader
        title="QR Code Scanner"
        subtitle="Scan a prosumer's QR code to verify their reservation and complete the energy transfer"
      />

      {showInputs && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-semibold">Scan with camera</h2>
            <QRScannerCamera onScan={verify} />
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Enter token manually</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                verify(token)
              }}
              className="space-y-3"
            >
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={3}
                placeholder="Paste the QR token"
                className={`${inputClass} font-mono`}
              />
              <Button type="submit" disabled={!token.trim()}>
                Verify token
              </Button>
            </form>
          </Card>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <QRVerificationResult phase={phase} message={message} />
        {(phase === 'valid' || phase === 'completed') && reservation && (
          <ScanResultDisplay
            reservation={reservation}
            stationName={stations.nameOf(reservation.stationId)}
            completed={phase === 'completed'}
            onProceed={() => setConfirming(true)}
            onRescan={rescan}
          />
        )}
      </div>

      <VerificationDialog
        open={confirming}
        reservation={reservation}
        stationName={reservation ? stations.nameOf(reservation.stationId) : ''}
        onCancel={() => setConfirming(false)}
        onConfirm={(completed) => {
          setReservation(completed)
          setConfirming(false)
          setPhase('completed')
        }}
      />
    </>
  )
}
