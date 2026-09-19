import { Component } from 'react'
import ErrorPage from '../../pages/ErrorPage'

// Catches render errors anywhere below it and shows the 500 page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <ErrorPage
        code="500"
        title="Something went wrong"
        message={String(this.state.error.message || this.state.error)}
        action={
          <button
            onClick={() => window.location.assign('/')}
            className="min-h-10 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to dashboard
          </button>
        }
      />
    )
  }
}
