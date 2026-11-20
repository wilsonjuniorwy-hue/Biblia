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
