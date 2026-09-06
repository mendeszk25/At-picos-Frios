# Atípicos Frios — painel administrativo gratuito e sem e-mail

Esta versão remove a dependência de Cloud Functions do Firebase para o login do
painel. O Firebase continua sendo usado **somente para Hosting estático**, que
pode permanecer no plano Spark sem cartão. O backend privado foi movido para um
projeto Supabase Free.

## O que foi corrigido

- O formulário continua pedindo **somente a senha**; não existe campo de e-mail.
- A senha não aparece em HTML, JavaScript, localStorage, `supabase-config.js` nem
  em respostas da API.
- A Edge Function recebe a senha somente no POST de login por HTTPS e compara
  PBKDF2-SHA256 com hash + salt guardados em **Secrets do Supabase**.
- O navegador recebe apenas um token de sessão aleatório. O servidor guarda
  somente o SHA-256 desse token e a data de expiração.
- A sessão dura até 8 horas, fica somente em `sessionStorage` da aba e é apagada
  no logout. O logout também remove a sessão do banco.
- Cadastro, edição, exclusão, importação e upload de imagens passam pela Edge
  Function e exigem sessão válida no servidor.
- A tabela de produtos tem RLS e permite apenas leitura pública. Não existe
  policy pública de escrita.
- Uploads aceitam somente JPEG/PNG/WebP de até 1,5 MB e também exigem sessão.
- Login possui limitação de tentativas por origem + limite global de proteção.
- Mensagens agora diferenciam: senha incorreta, excesso de tentativas, sessão
  expirada, backend não configurado, serviço indisponível e internet offline.

## Por que aparecia “Falha de conexão”

O fluxo anterior dependia de `verificarSenhaAdmin`, uma Cloud Function do
Firebase. A publicação de Cloud Functions exige o plano Blaze/Cloud Billing.
Como este projeto não deve cadastrar cartão nem habilitar faturamento, a função
não podia ser publicada pelo caminho pretendido. O cliente agrupava várias
falhas da função/rede em uma mensagem genérica de conexão, escondendo a causa.

Nesta versão, `firebase.json` contém somente Hosting. Não é necessário ativar
Cloud Functions, Cloud Build, Artifact Registry, Firebase Auth, Firestore ou
Firebase Storage para o painel novo.

## Arquitetura desta versão

### Público

`public/` contém apenas o site, `supabase-config.js` e `backend-client.js`.
A URL do projeto e a publishable/anon key do Supabase são chaves públicas por
natureza e podem ficar no navegador, desde que RLS esteja configurado.

### Privado

Nunca publique a pasta `supabase/` como site estático. A Edge Function usa os
Secrets padrão do projeto para acessar o banco com privilégio de servidor e os
seguintes Secrets próprios:

- `ATIPICOS_ADMIN_PASSWORD_HASH`
- `ATIPICOS_ADMIN_PASSWORD_SALT`
- `ATIPICOS_ADMIN_PASSWORD_ITERATIONS`
- `ATIPICOS_RATE_PEPPER`

O utilitário de configuração gera esses valores localmente e os envia direto ao
Supabase. Ele não grava a senha/hash/salt nos arquivos do projeto.

## Passos gratuitos para colocar no ar

### 1. Criar um projeto Supabase Free

Crie um projeto novo/dedicado no plano **Free**. Não faça upgrade para Pro e não
adicione recurso pago.

### 2. Criar banco, RLS e bucket

No Supabase Dashboard, abra o SQL Editor e execute todo o arquivo:

`supabase/migrations/202609060001_atipicos.sql`

A migration cria as tabelas, sessões, rate limit, RLS, bucket `produtos` e também
insere o catálogo inicial sem sobrescrever IDs existentes.

### 3. Obter Project Ref e chave pública

No Dashboard do projeto, copie:

- o **Project Ref**;
- a **Publishable key** (ou a `anon` key legada, se seu projeto ainda mostrar esse formato).

Depois rode:

```bash
node tools/configurar-publico.cjs
```

Informe o Project Ref e a chave pública quando o terminal pedir. Esse comando
atualiza `supabase-config.js`. Essa chave é pública; não use secret key nem
`service_role` nesse arquivo.

### 4. Entrar no Supabase CLI

```bash
npx supabase login
```

### 5. Configurar a senha de administração

Rode:

```bash
node tools/configurar-senha-supabase.cjs --project-ref SEU_PROJECT_REF
```

Digite a senha administrativa pedida pelo proprietário quando o terminal
solicitar e confirme. A entrada fica oculta. O utilitário usa PBKDF2-SHA256 com
600.000 iterações, salt aleatório de 32 bytes e um pepper separado para o rate
limit. Um arquivo temporário com permissão 0600 é criado apenas durante o envio
e removido em seguida.

### 6. Publicar a Edge Function sem Docker

```bash
npx supabase functions deploy admin-api --project-ref SEU_PROJECT_REF --use-api
```

`supabase/config.toml` já marca `admin-api` com `verify_jwt = false`, porque o
endpoint de login precisa ser alcançável antes de existir uma sessão Supabase.
A própria função valida a chave pública, a senha, o rate limit e a sessão opaca.
As rotas de escrita nunca confiam apenas nesse `verify_jwt = false`.

### 7. Build e testes

```bash
npm run build
npm test
```

### 8. Publicar somente o Hosting do Firebase

O Firebase agora serve só os arquivos estáticos:

```bash
firebase login
firebase deploy --only hosting --project atipico-frios
```

Não rode `firebase deploy --only functions`, não ative Cloud Build e não vincule
Cloud Billing para este fluxo.

## Como testar depois do deploy

1. Abra o site e clique em “Adicionar produtos”.
2. Digite uma senha errada: deve aparecer **“Senha incorreta”**.
3. Digite a senha correta: o painel deve abrir.
4. Cadastre/edite um produto e recarregue a loja para confirmar persistência.
5. Clique em “Sair”: voltar ao `/admin/` deve exigir login novamente.
6. No DevTools, tente chamar `POST /functions/v1/admin-api/products` usando apenas
   a chave pública, sem `x-atipicos-session`: deve retornar HTTP 401.
7. Tente `POST`/`PATCH`/`DELETE` diretamente em `/rest/v1/atipicos_produtos` com a
   chave pública: RLS/grants devem bloquear a escrita.

## Testes incluídos nesta entrega

`npm test` verifica localmente:

- PBKDF2 aceita a senha correta e rejeita a incorreta com segredo de teste;
- token de sessão é aleatório e somente seu hash é persistível;
- validação de produtos/imagens;
- todas as rotas de mutação da Edge Function exigem `exigirSessao`;
- RLS permite leitura pública e não cria escrita pública;
- logout limpa a sessão do navegador;
- alteração pelo cliente sem sessão é bloqueada antes da chamada;
- `public/` não contém os Secrets do backend nem a senha administrativa.

Esses testes não substituem o teste online da Edge Function. Esta entrega **não
pode afirmar que o login já funciona na internet** enquanto você não criar o
projeto Supabase, aplicar a migration, configurar os Secrets, publicar a função e
preencher a configuração pública.

## Limites gratuitos relevantes (verifique novamente antes de produção)

Na documentação consultada em 06/09/2026, o Supabase Free inclui 2 projetos
ativos, 500 MB de banco, 1 GB de Storage, 500.000 invocações de Edge Functions e
cotas de egress; projetos Free podem pausar após inatividade. Ao exceder cotas do
Free, a documentação descreve restrições de serviço em vez de cobrança automática
como overage do plano pago.

O Firebase Hosting Spark pode continuar sem método de pagamento. Consulte sempre
as páginas oficiais de pricing antes de mudar de plano.

Referências:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-faq
- https://supabase.com/docs/guides/functions/pricing
- https://supabase.com/docs/guides/functions/secrets
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/functions
