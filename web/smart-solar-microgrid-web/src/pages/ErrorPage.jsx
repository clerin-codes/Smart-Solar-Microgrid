import logo from '../assets/sunchain-logo.png'
import { LinkButton } from '../components/Common/ui'

// Status screen for 404 (not found) and 500 (unexpected error). `embedded` renders inside the app layout.
export default function ErrorPage({ code, title, message, action, embedded = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${embedded ? 'py-16' : 'min-h-screen bg-gray-50 p-6'}`}
    >
      {!embedded && <img src={logo} alt="SunChain" className="mb-8 h-16 w-auto" />}
      <div className="text-6xl font-bold text-primary-600">{code}</div>
      <h1 className="mt-3 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">{message}</p>
      <div className="mt-6">{action ?? <LinkButton to="/">Back to dashboard</LinkButton>}</div>
    </div>
  )
}
