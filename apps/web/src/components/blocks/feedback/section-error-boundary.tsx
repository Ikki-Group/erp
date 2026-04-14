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
  public override state: State = { hasError: false }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section error:', error, errorInfo)
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-background/50 backdrop-blur-sm rounded-2xl border border-dashed border-muted-foreground/15 min-h-[250px] text-center shadow-inner">
          <div className="bg-destructive/10 p-4 rounded-2xl text-destructive mb-4 shadow-sm border border-destructive/20 ring-4 ring-destructive/5">
            <AlertCircleIcon className="size-7" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-1.5">{this.props.title ?? 'Gagal memuat komponen'}</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-6 leading-relaxed">
            {this.state.error?.message ?? 'Terjadi kesalahan sistem saat merender bagian ini.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="h-9 gap-2 px-5 font-medium hover:bg-muted transition-all active:scale-95 shadow-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCwIcon className="size-3.5" /> Segarkan Bagian
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
