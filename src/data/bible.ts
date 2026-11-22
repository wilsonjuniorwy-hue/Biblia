export type TranslationId = 'tb' | 'arc';
export interface Translation { id: TranslationId; short: string; name: string; note: string }

export const TRANSLATIONS: Translation[] = [
  { id: 'tb', short: 'TB', name: 'Tradução Brasileira', note: 'Linguagem clara, ortografia atual. Trechos entre [colchetes] não constam nos manuscritos mais antigos.' },
  { id: 'arc', short: 'ARC', name: 'Almeida Revista e Corrigida (1911)', note: 'Texto clássico, ortografia da época.' },
];
export const translationById = (id: string) => TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];

type BookText = string[][];
const cache = new Map<string, Promise<BookText>>();

/** Carrega (e guarda em memória) o texto de um livro. */
export function loadBook(tr: TranslationId, book: number): Promise<BookText> {
  const key = `${tr}:${book}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}bible/${tr}/${book}.json`).then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar o texto (${r.status})`);
      return r.json() as Promise<BookText>;
    });
    p.catch(() => cache.delete(key)); // permite nova tentativa depois de uma falha
    cache.set(key, p);
  }
  return p;
}

export async function loadChapter(tr: TranslationId, book: number, chapter: number): Promise<string[]> {
  const b = await loadBook(tr, book);
  return b[chapter - 1] ?? [];
}

/** Baixa todos os livros (fica no cache do navegador para uso offline). */
export async function downloadAll(tr: TranslationId, onProgress?: (done: number, total: number) => void): Promise<void> {
  const total = 66;
  for (let i = 0; i < total; i++) {
    await loadBook(tr, i);
    onProgress?.(i + 1, total);
  }
}
