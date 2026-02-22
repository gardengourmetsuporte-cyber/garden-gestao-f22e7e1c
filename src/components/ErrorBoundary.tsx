import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ocorreu um erro inesperado. Tente voltar ou recarregar a página.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              Tentar novamente
            </Button>
            <Button onClick={this.handleReload}>
              Recarregar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
