# Atípicos Frios

Site institucional e catálogo digital desenvolvido para a Atípicos Frios, com foco em apresentar a loja, divulgar produtos e ofertas, facilitar o contato pelo WhatsApp e permitir o gerenciamento do catálogo através de um painel administrativo.

O projeto foi desenvolvido com atenção à responsividade, desempenho, experiência do usuário e facilidade de manutenção.

## Sobre o projeto

A proposta do site é oferecer uma presença digital moderna para a Atípicos Frios, permitindo que clientes conheçam melhor a loja, visualizem produtos disponíveis, acompanhem ofertas e entrem em contato de forma rápida.

Além da área pública, o projeto possui um painel administrativo próprio para gerenciamento dos produtos exibidos no catálogo.

O site foi pensado principalmente para funcionar bem em dispositivos móveis, já que grande parte dos acessos de clientes acontece pelo celular.

## Funcionalidades

### Site público

* Página inicial responsiva
* Apresentação da Atípicos Frios
* Catálogo de produtos
* Produtos em destaque
* Área de ofertas
* Categorias de produtos
* Navegação entre seções
* Menu responsivo para dispositivos móveis
* Scrollspy para destacar a seção atual na navbar
* Botões de contato pelo WhatsApp
* Layout adaptado para desktop, tablet e celular
* Animações e transições
* Imagens otimizadas
* Carregamento otimizado de conteúdo
* SEO básico
* Open Graph para compartilhamento
* Favicon personalizado

## Catálogo de produtos

O catálogo foi desenvolvido para permitir que os produtos sejam atualizados sem necessidade de alterar manualmente o HTML principal do site.

Os produtos podem possuir informações como:

* nome;
* descrição;
* preço;
* preço promocional;
* categoria;
* imagem;
* destaque;
* disponibilidade;
* promoção.

O frontend consulta os produtos cadastrados e gera os cards automaticamente.

## Painel administrativo

O projeto possui uma área administrativa separada da página principal.

Através dela é possível gerenciar o catálogo da loja.

Entre as funções disponíveis estão:

* adicionar produtos;
* editar produtos;
* remover produtos;
* alterar preços;
* cadastrar promoções;
* alterar imagens;
* controlar informações exibidas no catálogo;
* encerrar a sessão administrativa.

O acesso ao painel é protegido por autenticação.

## Segurança

A senha administrativa não fica armazenada diretamente no frontend.

O sistema utiliza uma Edge Function no Supabase para realizar a validação no servidor.

Entre as medidas implementadas estão:

* senha não exposta no HTML ou JavaScript;
* autenticação realizada no backend;
* hash seguro da senha;
* sessões temporárias;
* armazenamento da sessão apenas durante a navegação;
* proteção das operações de escrita;
* Row Level Security no Supabase;
* limitação de tentativas de login;
* validação de uploads;
* bloqueio de alterações sem uma sessão administrativa válida.

A chave pública do Supabase utilizada pelo navegador não concede permissão administrativa diretamente ao banco.

## Tecnologias utilizadas

O projeto utiliza principalmente:

* HTML5
* CSS3
* JavaScript
* Supabase
* Supabase Database
* Supabase Storage
* Supabase Edge Functions
* Firebase Hosting
* Node.js

O projeto não depende de frameworks frontend como React, Vue ou Angular.

## Estrutura do projeto

```text
Atipicos/
│
├── admin/
│   ├── index.html
│   ├── admin.css
│   ├── admin.js
│   ├── config.js
│   └── produtos-store.js
│
├── images/
│
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── config.toml
│
├── tests/
│   └── security.test.mjs
│
├── tools/
│   ├── build.cjs
│   ├── configurar-publico.cjs
│   └── configurar-senha-supabase.cjs
│
├── index.html
├── style.css
├── script.js
├── catalogo.js
├── produtos.js
├── backend-client.js
├── supabase-config.js
├── firebase.json
├── package.json
└── README.md
```

## Responsividade

O site foi desenvolvido para funcionar em diferentes tamanhos de tela.

Foram considerados dispositivos como:

* smartphones;
* tablets;
* notebooks;
* monitores desktop.

A interface utiliza recursos como Flexbox, Grid, unidades relativas e media queries para adaptar o conteúdo de acordo com o tamanho da tela.

## Otimizações de desempenho

O projeto recebeu otimizações para reduzir o tempo de carregamento e melhorar a experiência principalmente em dispositivos móveis.

Entre elas:

* conversão de imagens para WebP;
* lazy loading em imagens fora da área inicial;
* carregamento assíncrono de imagens;
* preload de recursos críticos;
* redução de JavaScript executado durante o scroll;
* otimização do scrollspy;
* redução de renderizações desnecessárias do catálogo;
* redução de requisições repetidas;
* cache para arquivos estáticos;
* otimização do carregamento de fontes;
* definição das dimensões de imagens para reduzir layout shift;
* tratamento de falhas de conexão.

## Core Web Vitals

A estrutura do projeto foi otimizada considerando principalmente:

* LCP — Largest Contentful Paint
* CLS — Cumulative Layout Shift
* INP — Interaction to Next Paint

O objetivo é manter o carregamento inicial rápido e as interações responsivas mesmo em dispositivos menos potentes.

## Backend

O backend administrativo utiliza Supabase.

O Supabase é responsável por:

* armazenamento dos produtos;
* controle das sessões administrativas;
* proteção das operações de escrita;
* armazenamento das imagens enviadas pelo painel;
* execução da Edge Function administrativa.

A página pública possui apenas permissão para leitura das informações necessárias.

## Hospedagem

O frontend é publicado através do Firebase Hosting.

O Firebase é utilizado apenas para servir os arquivos estáticos do site.

O backend administrativo funciona separadamente através do Supabase.

Arquitetura simplificada:

```text
Cliente
   |
   v
Firebase Hosting
   |
   v
Site Atípicos Frios
   |
   v
Supabase
   |
   ├── Database
   ├── Storage
   └── Edge Function
```

## Instalação

Clone o repositório:

```bash
git clone https://github.com/mendeszk25/At-picos-Frios.git
```

Entre na pasta:

```bash
cd At-picos-Frios
```

## Build

O projeto possui um script responsável por preparar os arquivos que serão publicados.

Execute:

```bash
npm run build
```

O resultado será gerado na pasta:

```text
public/
```

Essa é a pasta utilizada pelo Firebase Hosting.

## Testes

O projeto possui testes voltados principalmente para a segurança do painel administrativo.

Execute:

```bash
npm test
```

Os testes verificam pontos como:

* autenticação;
* validação da senha;
* sessões;
* proteção das rotas administrativas;
* permissões do banco;
* validação de produtos;
* validação de imagens;
* logout;
* exposição de informações sensíveis.

## Deploy

Para gerar os arquivos finais:

```bash
npm run build
```

Para publicar o frontend no Firebase Hosting:

```bash
firebase deploy --only hosting --project atipico-frios
```

Para publicar a Edge Function administrativa:

```bash
npx supabase functions deploy admin-api --project-ref SEU_PROJECT_REF --use-api
```

## WhatsApp

O site possui integração direta com o WhatsApp da Atípicos Frios.

Os botões de pedido direcionam o cliente para a conversa da loja, facilitando o contato sem exigir um sistema próprio de checkout.

## Objetivos do projeto

Este projeto foi desenvolvido com foco em:

* criar presença digital para a Atípicos Frios;
* facilitar o acesso dos clientes ao catálogo;
* destacar produtos e promoções;
* facilitar pedidos pelo WhatsApp;
* permitir atualização simples do catálogo;
* oferecer uma experiência profissional em dispositivos móveis;
* manter baixos os custos de infraestrutura;
* oferecer uma base que possa crescer futuramente.

## Possíveis melhorias futuras

Algumas funcionalidades que podem ser adicionadas futuramente:

* busca avançada de produtos;
* filtros adicionais;
* favoritos;
* sistema de pedidos;
* carrinho integrado ao WhatsApp;
* histórico de alterações administrativas;
* dashboard com estatísticas;
* controle de estoque;
* analytics;
* domínio personalizado;
* integração com redes sociais.

## Status

Projeto funcional e em desenvolvimento contínuo.

O site possui:

* interface pública;
* catálogo de produtos;
* integração com WhatsApp;
* painel administrativo;
* backend utilizando Supabase;
* sistema de autenticação administrativa;
* Firebase Hosting;
* otimizações para mobile e desempenho.

## Autor

Desenvolvido por Davi Gabriel.

GitHub: [mendeszk25](https://github.com/mendeszk25)

## Licença

Este projeto foi desenvolvido para a Atípicos Frios.

O uso de nome, identidade visual, logotipo, imagens e demais materiais relacionados à empresa deve respeitar os direitos de seus respectivos proprietários.
