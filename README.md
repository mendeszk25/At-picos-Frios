# Atípicos Frios

Site da **Atípicos Frios**, uma loja de produtos alimentícios localizada em **Gravatá–PE**.

O projeto tem como objetivo apresentar os produtos, ofertas e novidades da loja de forma moderna, organizada e responsiva, mantendo a identidade visual utilizada pela empresa em suas redes sociais.

## Sobre o projeto

A proposta é transformar a identidade visual promocional da Atípicos Frios em uma experiência digital mais organizada.

O site funciona como um catálogo online, permitindo que os clientes:

- Visualizem os produtos disponíveis
- Pesquisem produtos
- Filtrem produtos por categoria
- Confiram as ofertas da semana
- Visualizem produtos recém-chegados
- Encontrem produtos em destaque
- Acessem o Instagram
- Entrem em contato pelo WhatsApp
- Realizem pedidos através do iFood

## Funcionalidades

### Catálogo de produtos

Os produtos são organizados por categorias e exibidos em cards contendo:

- Nome
- Imagem
- Descrição
- Preço
- Unidade
- Categoria
- Disponibilidade

### Busca e filtros

O catálogo possui pesquisa por nome e filtros por categoria, permitindo encontrar produtos de forma rápida.

### Ofertas da semana

Produtos marcados como oferta são exibidos automaticamente em uma seção específica para destacar as promoções da loja.

### Novidades

Produtos marcados como novos aparecem automaticamente na seção "Chegou na Atípicos".

Essa funcionalidade permite destacar produtos que chegaram recentemente à loja.

### Produtos em destaque

Produtos selecionados podem ser marcados como destaque e exibidos na página inicial.

### Painel administrativo

O projeto possui uma área administrativa para gerenciamento dos produtos.

É possível:

- Adicionar produtos
- Editar produtos
- Excluir produtos
- Alterar preços
- Alterar imagens
- Alterar categorias
- Marcar produtos como novos
- Marcar produtos como ofertas
- Marcar produtos como destaque
- Ativar ou desativar produtos

Inicialmente, os dados podem ser armazenados utilizando `localStorage`, deixando a estrutura preparada para uma futura integração com backend e banco de dados.

## Responsividade

O site foi desenvolvido para funcionar em diferentes tamanhos de tela:

- Smartphones
- Tablets
- Notebooks
- Desktops

A experiência mobile é uma das prioridades do projeto, considerando que muitos usuários podem acessar o site através do Instagram ou WhatsApp.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- LocalStorage

O projeto utiliza JavaScript puro, sem frameworks desnecessários, mantendo a aplicação leve e fácil de modificar.

## Estrutura do projeto

```text
Atipicos-Frios/
│
├── index.html
├── style.css
├── script.js
│
├── images/
│   └── ...
│
├── products/
│   └── ...
│
└── admin/
    ├── index.html
    ├── admin.css
    └── admin.js
