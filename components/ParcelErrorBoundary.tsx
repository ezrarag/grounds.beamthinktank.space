'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ShieldAlert, RefreshCw, X } from 'lucide-react'

interface Props {
  children: ReactNode
  onClose?: () => void
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ParcelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ParcelErrorBoundary caught a client-side rendering exception:', error, errorInfo)
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md flex justify-center items-center">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/40 bg-[#0c1a14] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-bold">
                <ShieldAlert className="h-5 w-5" />
                <span>{this.props.fallbackTitle || 'Parcel Inspection Notice'}</span>
              </div>
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  type="button"
                  className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                Unable to render full property workspace
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Some parcel data fields returned from the municipality or Regrid API were incomplete or malformed.
              </p>
              {this.state.error && (
                <div className="rounded-xl bg-black/60 border border-white/10 p-3 text-[11px] font-mono text-rose-300 max-h-24 overflow-y-auto">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  type="button"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                >
                  Close Modal
                </button>
              )}
              <button
                onClick={this.handleReset}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Inspection</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
