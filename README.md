# Lâmpada — Bíblia (PWA)

Leitor da Bíblia completa (TB e ARC 1911, domínio público), com planos de leitura de 1 ano
(sequencial, cronológico e misto), mapa do que já foi lido / falta ler, tópicos para o dia a dia,
busca, favoritos, destaques, notas e backup. Funciona offline; tudo fica no aparelho (IndexedDB).

## Comandos
```
npm install
npm run dev        # desenvolvimento
npm test           # testes (planos, progresso, referências, tópicos)
npm run build      # produção em dist/ (estático: Cloudflare Pages, Netlify, GitHub Pages…)
npm run preview    # servir o build local
npm run data       # regenera public/bible/* a partir de data-source/
npm run icons      # regenera os ícones do PWA a partir de public/favicon.svg
```

## Estrutura
- `src/data/` livros, planos (`plans.ts`), tópicos, carregamento do texto
- `src/db/db.ts` IndexedDB (Dexie): progresso, log de leitura, marcações, configurações, backup
- `src/lib/` datas, sequência (streak), estatísticas, compartilhamento
- `src/pages/` telas · `src/components/` UI compartilhada
- `public/bible/<tr>/<n>.json` texto por livro (carregado sob demanda e guardado em cache)

## Para ligar o Supabase depois
O progresso é um mapa `capítulo → data` (`progress`) + `log` + `marks` + `kv`. O backup (`exportBackup`/`importBackup`
em `src/db/db.ts`) já serializa tudo; é o ponto natural para sincronizar.

## Telas
- `/` Entrada com duas portas: **Igreja** e **Estudos bíblicos**
- `/igreja` Programação, próximos eventos, avisos, contato e PIX. **Edite `src/data/church.ts`** (e troque `demo` para `false`).
  Foto própria: coloque em `public/images/igreja.jpg` e use `image: 'images/igreja.jpg'`.
- `/estudos` Hoje, Bíblia, Plano, Progresso e Mais

## Segurança e dados
- `vercel.json` define uma **Content-Security-Policy estrita** (`connect-src 'self'`, sem scripts de terceiros) e outros cabeçalhos.
  **Ao integrar o Supabase** (ou qualquer API/anúncio externo), acrescente o domínio em `connect-src` (e `script-src`/`img-src` se for o caso).
- Tudo que vem do IndexedDB ou de um backup passa por `src/lib/sanitize.ts`: valores inválidos viram o padrão e nunca travam o app.
- Se o armazenamento do navegador estiver indisponível (janela privada, bloqueio), o app mostra uma explicação em vez de ficar carregando.

## Personalizar (sem mexer no resto do código)
- **Igreja** — `src/data/church.ts`: nome, horários, eventos, avisos, mensagem da semana, ministérios, contato, PIX, boletim e fotos.
  O cartão **"Ao vivo agora"** liga sozinho no horário de cada reunião (`liveMinutes`); preencha `liveUrl` para o botão de transmissão.
  Fotos: coloque em `public/images/` e liste em `photos`. Troque `demo` para `false` ao publicar.
- **Introdução dos livros** — `src/data/bookIntros.ts` (autor, época, tema, resumo).
- **Planos** — `src/data/plans.ts` (3 da Bíblia inteira e 4 curtos: Salmos 30 dias, Provérbios 31, Evangelhos 30, NT 90).
