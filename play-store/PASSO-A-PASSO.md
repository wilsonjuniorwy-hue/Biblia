# Passo a passo: publicar o Farol de Fé na Google Play

O app é um PWA (o site) empacotado como **TWA** (app Android que abre o site em tela cheia, sem barra do navegador).
O arquivo `.aab` é gerado na pasta irmã `Biblia-android/` (fora do repositório, porque tem a chave de assinatura).

## O que já está pronto
- Site no ar: https://biblia-blush-nu.vercel.app
- Política de privacidade: https://biblia-blush-nu.vercel.app/privacidade.html
- Verificação do app (Digital Asset Links): https://biblia-blush-nu.vercel.app/.well-known/assetlinks.json
- Nome do pacote: `br.com.faroldefe.biblia`
- Ficha da loja, ícone, imagem de destaque e capturas: pasta `play-store/` (veja `FICHA-DA-LOJA.md`)
- Chave de envio (upload key) e senhas: `Biblia-android/` (**faça cópia de segurança fora do computador**)

## 1) Criar o app no Play Console
1. Play Console → **Criar app** → nome **Bíblia - Farol de Fé**, idioma Português (Brasil), tipo App, **Gratuito**.
2. Aceite as declarações e crie.

## 2) Enviar o AAB (teste interno primeiro)
1. **Testar e lançar → Teste → Teste interno → Criar nova versão.**
2. Em "Assinatura de apps pelo Google Play", **aceite o Play App Signing** (recomendado; é o mesmo que você usa nos outros apps).
3. Envie o arquivo `Biblia-android/app-release-bundle.aab`.
4. Em "Testadores", crie uma lista com o seu e-mail e o de 2 ou 3 pessoas. Salve e publique o teste interno.

## 3) Liberar a abertura em tela cheia (passo mais importante)
O app só abre sem a barra do navegador se o site confirmar que o app é dele.
1. Play Console → **Configuração → Integridade do app (Assinatura de apps)**.
2. Copie o **"Certificado da chave de assinatura do app" → SHA-256**.
3. Peça para o Claude: "adicione este SHA-256 ao assetlinks.json" (ou edite `public/.well-known/assetlinks.json`, acrescentando a impressão digital na lista `sha256_cert_fingerprints`, **mantendo a que já existe**).
4. Faça o deploy (commit e push). Confira abrindo o endereço do `assetlinks.json` no navegador.
5. Reinstale o app pelo teste interno e abra: não deve aparecer barra de endereço.

## 4) Preencher a ficha (Painel do app → Configurar)
Copie os textos de `FICHA-DA-LOJA.md`:
- Política de privacidade, acesso ao app, anúncios, classificação de conteúdo, público-alvo, segurança dos dados, categoria.
- Ficha principal: descrição curta e completa, ícone 512, imagem de destaque, capturas.

## 5) Produção
1. Com o teste interno funcionando, **Produção → Criar nova versão** e envie o mesmo AAB (ou promova a versão do teste).
2. Liberação gradual (por exemplo, 20%) na primeira vez.
3. Envie para análise. A primeira revisão costuma levar de 1 a 7 dias.

## Atualizações
- **Conteúdo do app (devocionais, Bíblia, telas):** é só publicar o site (commit e push). O app Android carrega o site ao vivo, então **não precisa de nova versão na loja**.
- **Nova versão do AAB** só é necessária para mudar nome, ícone, cores da barra, pacote ou requisitos de Android da Google. Nesse caso aumente `appVersionCode` em `Biblia-android/twa-manifest.json` e gere de novo.

## Atenção (pendências de licença antes de publicar)
- A voz dos áudios atuais foi gerada com o `edge-tts`, serviço não oficial; confirme se pode usar comercialmente ou regenere com um serviço oficial.
- Guarde a comprovação de que o plano do Suno usado nas músicas permitia uso comercial.
