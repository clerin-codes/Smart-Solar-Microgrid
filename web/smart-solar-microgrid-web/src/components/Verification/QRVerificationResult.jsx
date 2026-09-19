// phase: processing | valid | invalid | completed
export default function QRVerificationResult({ phase, message }) {
  if (phase === 'processing') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-gray-600" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        Verifying QR code...
      </div>
    )
  }
  if (phase === 'invalid') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
        <div className="text-lg font-semibold text-red-700">&#10007; Invalid QR code</div>
        <p className="mt-1 text-sm text-red-700">{message}</p>
      </div>
    )
  }
  if (phase === 'valid') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-lg font-semibold text-blue-700">
        &#10003; Valid QR code &mdash; reservation verified
      </div>
    )
  }
  if (phase === 'completed') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-lg font-semibold text-green-700">
        &#10003; Energy transfer completed
      </div>
    )
  }
  return null
}
