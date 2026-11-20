import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../app/AppContext';
import { loadBook, translationById, type TranslationId } from '../data/bible';
import { BOOKS } from '../data/books';
import { db, patchMark, type MarkRow } from '../db/db';
import { Empty, PageHeader, Segmented } from '../components/ui';

type Tab = 'fav' | 'color' | 'note';

export function Saved() {
  const { settings } = useApp();
  const [tab, setTab] = useState<Tab>('fav');
  const rows = useLiveQuery(() => db.marks.toArray(), []);
  const list = (rows ?? [])
    .filter((m) => (tab === 'fav' ? m.fav : tab === 'color' ? !!m.color : !!m.note.trim()))
    .sort((a, b) => a.book - b.book || a.chapter - b.chapter || a.verse - b.verse);

  return (
    <>
      <PageHeader title="Meu conteúdo" back="/mais" />
      <main className="page">
        <Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'fav', label: 'Favoritos' }, { value: 'color', label: 'Destaques' }, { value: 'note', label: 'Notas' }]} />
        {rows && list.length === 0 ? (
          <Empty icon={tab === 'fav' ? '❤' : tab === 'color' ? '🖍' : '📝'} title="Nada por aqui ainda" text="Durante a leitura, toque em um versículo para favoritar, destacar ou anotar." />
        ) : null}
        {list.map((m) => <SavedItem key={m.key} m={m} tr={settings.translation} tab={tab} />)}
      </main>
    </>
  );
}

function SavedItem({ m, tr, tab }: { m: MarkRow; tr: TranslationId; tab: Tab }) {
  const [text, setText] = useState('');
  useEffect(() => {
    let alive = true;
    loadBook(tr, m.book).then((b) => { if (alive) setText(b[m.chapter - 1]?.[m.verse - 1] ?? ''); }).catch(() => undefined);
    return () => { alive = false; };
  }, [tr, m.book, m.chapter, m.verse]);
  return (
    <section className={`card ${m.color ? `hl-${m.color}` : ''}`}>
      <Link to={`/ler/${m.book}/${m.chapter}?v=${m.verse}`} className="verse-ref">
        {BOOKS[m.book].name} {m.chapter}:{m.verse} ({translationById(tr).short})
      </Link>
      <p className="saved-text">{text || '…'}</p>
      {m.note ? <p className="note">📝 {m.note}</p> : null}
      <div className="row gap">
        <button className="btn ghost small" onClick={() => void patchMark(m.book, m.chapter, m.verse, tab === 'fav' ? { fav: 0 } : tab === 'color' ? { color: null } : { note: '' })}>
          {tab === 'fav' ? 'Remover dos favoritos' : tab === 'color' ? 'Remover destaque' : 'Apagar nota'}
        </button>
        <Link className="btn ghost small" to={`/ler/${m.book}/${m.chapter}?v=${m.verse}`}>Abrir no capítulo</Link>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <PageHeader title="Licenças e créditos" back="/mais" />
      <main className="page prose">
        <h2>Lâmpada — Bíblia</h2>
        <p>Aplicativo gratuito para leitura da Bíblia, com planos de leitura e acompanhamento de progresso. Funciona offline e guarda tudo no seu próprio aparelho.</p>
        <h3>Textos bíblicos (domínio público)</h3>
        <ul>
          <li><strong>Tradução Brasileira (TB)</strong> — Sociedade Bíblica do Brasil, tradução concluída em 1917; texto em domínio público.</li>
          <li><strong>Almeida Revista e Corrigida, edição de 1911 (ARC)</strong> — tradução de João Ferreira de Almeida; texto histórico em domínio público, com a ortografia da época.</li>
        </ul>
        <p>Os arquivos foram obtidos do projeto de código aberto <em>damarals/biblias</em> (licença MIT para o conjunto de dados). Os textos modernos protegidos (NVI, NAA, NTLH, ARA e outros) não são utilizados.</p>
        <h3>Tópicos e planos</h3>
        <p>As seleções de versículos por tema e os planos de leitura (sequencial, cronológico e misto) foram montados para este app. A ordem cronológica é aproximada: estudiosos divergem sobre a datação de alguns livros.</p>
        <h3>Privacidade</h3>
        <p>Não há conta nem coleta de dados. Progresso, notas e ajustes ficam apenas neste aparelho. Use a função de backup para não perdê-los.</p>
      </main>
    </>
  );
}
