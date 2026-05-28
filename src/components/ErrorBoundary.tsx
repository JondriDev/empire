import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>
      return (
        <div style={{
          background: 'var(--gl-bg)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#fca5a5' }}>Something went wrong</h3>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.reset}
            style={{
              background: 'rgba(34,211,238,0.2)',
              border: '1px solid rgba(34,211,238,0.4)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1.5rem',
              color: '#a8e3e2',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}