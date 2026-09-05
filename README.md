# 🧊 Atípicos Frios

Site oficial da **Atípicos Frios**, uma loja de produtos alimentícios localizada em **Gravatá–PE**.

O projeto foi desenvolvido com foco em apresentar os produtos, ofertas e novidades da loja de forma moderna, organizada e responsiva, mantendo a identidade visual presente nas redes sociais da empresa.

---

## 📸 Sobre o projeto

A proposta do projeto é transformar a identidade visual promocional da Atípicos Frios em uma experiência digital mais organizada.

O site funciona como um catálogo online, permitindo que os clientes:

- 🛒 Visualizem os produtos disponíveis
- 🔎 Pesquisem produtos
- 🏷️ Naveguem por categorias
- 🔥 Confiram ofertas da semana
- 🆕 Descubram produtos novos
- ⭐ Visualizem produtos em destaque
- 📱 Acessem o Instagram da empresa
- 💬 Entrem em contato pelo WhatsApp
- 🛵 Realizem pedidos através do iFood

A identidade visual utiliza como base as características presentes nas publicações da Atípicos Frios, com destaque para tons escuros, amarelo/dourado, vermelho, azul e elementos promocionais.

---

## ✨ Funcionalidades

### 🛍️ Catálogo de produtos

Os produtos são organizados por categorias e exibidos através de cards contendo informações como:

- Nome
- Imagem
- Descrição
- Preço
- Unidade
- Categoria
- Disponibilidade

### 🔎 Busca e filtros

O catálogo possui:

- Pesquisa por nome
- Filtro por categoria
- Exibição dinâmica dos produtos

### 🔥 Ofertas da semana

Produtos marcados como oferta são exibidos automaticamente em uma seção específica para facilitar a visualização das promoções.

### 🆕 Novidades

Produtos marcados como novos aparecem automaticamente na seção **"Chegou na Atípicos"**.

Isso permite destacar produtos recém-chegados à loja.

### ⭐ Produtos em destaque

Produtos selecionados podem ser marcados como destaque e exibidos em uma seção própria na página inicial.

### ⚙️ Painel administrativo

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

Atualmente, os dados podem ser armazenados utilizando `localStorage`, deixando a estrutura preparada para uma futura integração com backend e banco de dados.

### 📱 Responsividade

O site foi desenvolvido para funcionar em diferentes dispositivos:

- 📱 Smartphones
- 📲 Tablets
- 💻 Notebooks
- 🖥️ Desktops

---

## 🛠️ Tecnologias

O projeto utiliza tecnologias web fundamentais:

- HTML5
- CSS3
- JavaScript
- LocalStorage

Não são utilizados frameworks pesados, mantendo o projeto simples, leve e fácil de modificar.

---

## 📁 Estrutura do projeto

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
