# Diretrizes e Regras de Áudio dos Devocionais (Farol de Fé)

Este documento registra as lições aprendidas e as regras obrigatórias para a síntese neural de áudio dos devocionais.

---

## 1. Consistência de Voz (Anti-Mistura Vocal)
- **Problema observado:** Ao trocar de voz (ex.: de Francisca para Thalita), arquivos pré-existentes na pasta `public/audio/devocionais/<id>/` foram mantidos, gerando início do devocional em uma voz e versículos em outra.
- **Regra obrigatória:**
  - O script [`scripts/build-devotional-audio.mjs`](file:///c:/Users/Wagner/Downloads/SISTEMAS/Comercial%202/Biblia/scripts/build-devotional-audio.mjs) compara a chave `voice` no `manifest.json` existente com a variável `VOICE`.
  - Se a voz configurada for diferente da voz registrada no manifesto anterior, o script **força a regeração de todos os trechos** daquele devocional automaticamente, garantindo que 100% dos trechos usem rigorosamente a mesma voz.

---

## 2. Prevenção de Desvio para Inglês em Vozes Multilíngues (Entrada Direta da Prece)
- **Problema observado:** Modelos multilíngues (como `pt-BR-ThalitaMultilingualNeural`) utilizam detecção automática de idioma por sentença. Rótulos curtos com ponto final seco (como `"Oração."`) eram classificados erroneamente como texto em inglês, fazendo o sintetizador falar com sotaque americano ou distorcido.
- **Regra obrigatória (Opção 1 aprovada):**
  - Como o cabeçalho visual da tela já exibe claramente o título "Oração", a narração **entra diretamente no texto da oração** (ex.: *"Senhor, tu és o meu Pastor..."*), sem prefixos mecânicos como "Oração.".
  - Isso elimina 100% qualquer risco de desvio para o inglês e torna a experiência muito mais pessoal, calorosa e intimista.
  - Para rótulos que precisam ser falados (como `"Para pensar:"`), o pré-processador substitui os dois pontos por reticências (`"Para pensar..."`), forçando contexto e entonação em português.

---

## 3. Palavras Bíblicas em Caixa Alta (ALL CAPS)
- **Problema observado:** Versões bíblicas impressas e digitais grafam o Tetragrama como `SENHOR` ou `DEUS` em letras maiúsculas. O sintetizador neural interpreta palavras em maiúsculas contínuas como siglas e tenta soletrar letra por letra (`S-E-N-H-O-R`) ou falha com erro `NoAudioReceived`.
- **Regra obrigatória:**
  - A função `refineDevotionalSpeech(text)` converte automaticamente qualquer palavra bíblica em ALL CAPS com mais de uma letra para TitleCase (ex.: `SENHOR` → `Senhor`, `DEUS` → `Deus`).
  - O texto exibido na tela do aplicativo permanece com a formatação bíblica original intocada; a conversão ocorre estritamente no áudio enviado ao sintetizador.

---

## 4. Codificação UTF-8 no Windows
- **Problema observado:** Passar strings longas com acentuação (`ç`, `ã`, `é`, `ô`) diretamente via argumento de linha de comando (`--text "..."`) no Windows PowerShell ou CMD pode corromper caracteres devido ao charset CP1252.
- **Regra obrigatória:**
  - O script grava o texto tratado em um arquivo temporário codificado estritamente em `utf8` (`outputFile.tmp.txt`) e passa o parâmetro `-f <arquivo>` para o `edge-tts`.
  - O arquivo temporário é excluído imediatamente após o término do processamento daquele trecho.
