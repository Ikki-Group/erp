import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
  title?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 min-h-[200px] text-center">
          <div className="bg-destructive/10 p-3 rounded-full text-destructive mb-3">
            <AlertCircleIcon className="size-6" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {this.props.title || 'Gagal memuat komponen'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-[240px] mb-4">
            {this.state.error?.message || 'Terjadi kesalahan sistem saat merender bagian ini.'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCwIcon className="size-3" /> Coba Lagi
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
