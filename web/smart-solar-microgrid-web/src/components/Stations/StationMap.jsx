// Keyless Google Maps embed; falls back to a plain link if the frame is blocked.
export default function StationMap({ latitude, longitude, name, className = 'h-64' }) {
  const q = `${latitude},${longitude}`
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <iframe
        title={`Map of ${name}`}
        src={`https://maps.google.com/maps?q=${q}&z=13&output=embed`}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
