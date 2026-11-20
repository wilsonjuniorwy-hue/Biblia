import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
        <div className="empty-icon" aria-hidden>⚠️</div>
        <h3>Algo deu errado</h3>
        <p className="muted">
          Se você está em uma janela privada ou bloqueou o armazenamento do site, o app não consegue salvar seu progresso.
          Tente abrir em uma janela normal.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>Recarregar</button>
      </div>
    );
  }
}
