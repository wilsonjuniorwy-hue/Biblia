import { Component, useState, type ReactNode } from 'react';
import { db } from '../db/db';

/** Última saída: apaga só as configurações (o progresso, as notas e os favoritos ficam) e recarrega. */
async function resetSettingsAndReload() {
  try { await db.kv.clear(); } catch { /* sem armazenamento: o reload já é o que resta */ }
  location.reload();
}

function Recovery({ title, text, showReset }: { title: string; text: string; showReset: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="empty" role="alert" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
      <div className="empty-icon" aria-hidden>⚠️</div>
      <h1 className="empty-title">{title}</h1>
      <p className="muted">{text}</p>
      <div className="row gap wrap" style={{ justifyContent: 'center' }}>
        <button className="btn primary" onClick={() => location.reload()}>Tentar de novo</button>
        {showReset ? (
          <button className="btn ghost" disabled={busy} onClick={() => { setBusy(true); void resetSettingsAndReload(); }}>
            Restaurar configurações
          </button>
        ) : null}
      </div>
      {showReset ? <p className="muted small">“Restaurar configurações” mantém seu progresso, favoritos e notas.</p> : null}
    </div>
  );
}

/** Tela mostrada quando o navegador não deixa o app guardar dados (janela privada, bloqueio de site, etc.). */
export function StorageProblem({ slow }: { slow?: boolean }) {
  return (
    <Recovery
      title={slow ? 'O armazenamento está demorando' : 'Não foi possível acessar o armazenamento'}
      text="O app guarda seu progresso no próprio aparelho. Isso não está disponível agora, o que costuma acontecer em janela privada ou quando os dados do site estão bloqueados. Abra em uma janela normal, libere o armazenamento do site e tente de novo."
      showReset={false}
    />
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Recovery
        title="Algo deu errado"
        text="Um dado salvo neste aparelho pode estar inválido. Tente de novo; se continuar, restaure as configurações."
        showReset
      />
    );
  }
}
