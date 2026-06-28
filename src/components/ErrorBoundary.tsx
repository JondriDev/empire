import { Component, type ReactNode, type ErrorInfo } from 'react'
import { tint } from '../design-system/tokens'

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
          border: `1px solid ${tint('c-danger', 30)}`,
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'color-mix(in srgb, var(--c-danger) 70%, var(--text))' }}>Something went wrong</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.reset}
            style={{
              background: tint('signal', 20),
              border: `1px solid ${tint('signal', 40)}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 1.5rem',
              color: 'color-mix(in srgb, var(--signal) 70%, var(--text))',
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