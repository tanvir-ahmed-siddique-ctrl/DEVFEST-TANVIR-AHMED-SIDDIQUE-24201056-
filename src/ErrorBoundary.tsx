import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  failed: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return (
      <main className="rescue-screen">
        <h1>The desk hit a problem</h1>
        <p>Your files were not uploaded anywhere. Reload the page and open the requirements list again.</p>
        <button className="primary-button" onClick={() => window.location.reload()}>Reload</button>
      </main>
    )
  }
}
