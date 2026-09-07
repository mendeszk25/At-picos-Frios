/* ====================================================================
   ATÍPICOS FRIOS — produtos.js
   Carga inicial dos produtos da loja.

   Cada produto pode aparecer em uma ou mais seções:
   - catalogo: Produtos disponíveis na loja
   - oferta: Ofertas da semana
   - novo: Chegou na Atípicos
   - destaque: Produtos em destaque

   O campo "disponivel" controla se o produto está ativo/visível.
   Categorias foram removidas do sistema.
   ==================================================================== */

const PRODUTOS = [
  {
    id: 1,
    nome: "Queijo Coalho Geason Diniz",
    descricao: "Assa com sal, direto na chapa ou churrasqueira.",
    preco: 23.00,
    precoAntigo: null,
    unidade: "barra",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: true,
    disponivel: true
  },
  {
    id: 2,
    nome: "Kit Churrasco Geason Diniz",
    descricao: "Linguiça gourmet, queijo coalho e farofa gourmet.",
    preco: null,
    precoAntigo: null,
    unidade: "kit completo",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: true,
    disponivel: true
  },
  {
    id: 3,
    nome: "Linguiça Gourmet",
    descricao: "De bode e outras opções gourmet, direto da churrasqueira.",
    preco: null,
    precoAntigo: null,
    unidade: "un.",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: false,
    destaque: false,
    disponivel: true
  },
  {
    id: 4,
    nome: "Frios em Bandeja",
    descricao: "Seleção de frios fatiados, prontos para servir.",
    preco: 10.00,
    precoAntigo: null,
    unidade: "bandeja",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: false,
    destaque: false,
    disponivel: true
  },
  {
    id: 5,
    nome: "Bandeja de Frios do Dia",
    descricao: "R$10,00 a bandeja — confira o que chegou hoje.",
    preco: 10.00,
    precoAntigo: null,
    unidade: "bandeja",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 6,
    nome: "Bandejas de Frios Sortidos",
    descricao: "Variedade que encanta, com frescor garantido todo dia.",
    preco: null,
    precoAntigo: null,
    unidade: "bandeja",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: true,
    oferta: false,
    destaque: false,
    disponivel: true
  },
  {
    id: 7,
    nome: "Morangos Congelados Dona Horta",
    descricao: "Ideais para açaí, vitaminas e sobremesas.",
    preco: 10.00,
    precoAntigo: null,
    unidade: "un. · 5 un. por R$47,50",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 8,
    nome: "Filé de Peito Jussara",
    descricao: "Congelado individualmente (IQF), pronto para usar 1 a 1.",
    preco: null,
    precoAntigo: null,
    unidade: "un. (IQF)",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: true,
    disponivel: true
  },
  {
    id: 9,
    nome: "Bebidas Itambé & Fruty Bom",
    descricao: "Coco, uva e sabores selecionados.",
    preco: 10.00,
    precoAntigo: null,
    unidade: "un.",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 10,
    nome: "Molho Pronto Italac",
    descricao: "4 queijos ou branco, prático e saboroso.",
    preco: 4.00,
    precoAntigo: null,
    unidade: "un. · 3 un. por R$10",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 11,
    nome: "Biscoito Marilan Manteiga",
    descricao: "Aquele clássico para o café da tarde.",
    preco: null,
    precoAntigo: null,
    unidade: "pacote · 3 por R$10",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 12,
    nome: "3 Bandejas Natural Gurt",
    descricao: "Sabor morango, cremoso e geladinho.",
    preco: 10.00,
    precoAntigo: null,
    unidade: "as 3 bandejas",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: false,
    oferta: true,
    destaque: false,
    disponivel: true
  },
  {
    id: 13,
    nome: "Açaí Cremoso e Natural",
    descricao: "100% natural, perfeito para refrescar o dia e dividir com a família.",
    preco: null,
    precoAntigo: null,
    unidade: "cuba",
    imagem: "images/em-breve.webp",
    catalogo: true,
    novo: true,
    oferta: false,
    destaque: false,
    disponivel: true
  }
];
