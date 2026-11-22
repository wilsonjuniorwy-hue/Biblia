# Licenças dos textos

| Tradução | Sigla | Situação | Origem do arquivo |
|---|---|---|---|
| Tradução Brasileira | TB | Domínio público | https://github.com/damarals/biblias (TB.json) |
| Almeida Revista e Corrigida, ed. 1911 | ARC | Domínio público | https://github.com/damarals/biblias (ALM1911.json) |
| Bíblia Livre (2018) | BLIVRE | **CC BY 4.0** (exige atribuição) | https://ebible.org/porbr2018/ (USFM), convertido por `scripts/import-usfm.mjs` |

O repositório damarals/biblias é MIT e marca TB e ARC 1911 como domínio público.

## Bíblia Livre (BLIVRE) — atribuição obrigatória

Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio e Marco Teles, 2018.
Licença Creative Commons Atribuição 4.0 (https://creativecommons.org/licenses/by/4.0/deed.pt-br).
Fonte: https://ebible.org/porbr2018/copyright.htm

Foram feitas alterações (correção de erros de digitação, espaçamento, pontuação e palavras repetidas por engano; remoção das
"assinaturas" das cartas, como "Escrita de Roma…"). Elas estão listadas em `data-source/fixes.json` e nas regras de
`scripts/build-bible.mjs`. Os autores originais não endossam essas alterações. A atribuição também aparece na tela
Mais › Licenças e créditos do app e deve ser mantida.

**Não incluir** traduções protegidas (NVI, NAA, NTLH, ARA, ARC 1995, ACF 1994, etc.) sem licença da editora.
A "ARC 1995" da SBB **não** é a mesma coisa que a edição de 1911 usada aqui.

Antes de publicar, vale confirmar a situação de cada texto com a fonte original.

## Áudios dos devocionais e música de fundo

### Narração dos devocionais
- **Voz neural:** Leitura sintetizada com voz feminina suave e empática em português do Brasil (`pt-BR-ThalitaMultilingualNeural`), gerada com o Microsoft Edge TTS (provedor `edge` do script) para os devocionais originais do aplicativo.

### Trilhas musicais instrumentais de fundo
- **Faixas:**
  - *Quiet Devotion* (instrumental suave em piano/cordas ambient)
  - *Quiet Contemplation* (instrumental meditativo em piano)
  - *Devem ser assim* (instrumental calmo para reflexão)
- **Autor / Criação:** Wagner Junior (wagner1junior1) via Suno AI.
- **Licença:** Criação original instrumental com direitos comerciais liberados para uso integrado no aplicativo Farol de Fé.

### Pendências antes de publicar na Play Store
- **Voz:** os áudios atuais foram gerados com o provedor `edge` (edge-tts, serviço de leitura do navegador Edge, sem chave). Para uso comercial, regerar com o **Microsoft Azure Speech oficial** (`TTS_PROVIDER=azure`, com chave no `.env`) e conferir os termos do serviço.
- **Música:** as faixas foram criadas no Suno. Confirmar que o plano usado na criação (pago) permitia uso comercial e guardar o comprovante.
