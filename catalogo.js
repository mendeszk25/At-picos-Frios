/* ====================================================================
   ATÍPICOS FRIOS — catalogo.js
   Gera os cards de produto a partir de PRODUTOS (produtos.js) e
   implementa busca, filtro por categoria e disponibilidade.
   ==================================================================== */

const ESTADO_CATALOGO = {
  categoria: 'todos',
  busca: '',
  apenasDisponiveis: false,
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof PRODUTOS === 'undefined') return;

  renderizarOfertas();
  renderizarNovidades();
  renderizarDestaques();
  renderizarCatalogo();

  configurarBuscaProdutos();
  configurarFiltroCategoriaCatalogo();
  configurarFiltroDisponibilidade();
  configurarCategoriasParaCatalogo();
});

/* ---------------------------------------------------------------
   Utilitários
--------------------------------------------------------------- */
function slugCategoria(categoria) {
  return (categoria || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatarPreco(produto) {
  if (produto.preco === null || produto.preco === undefined) {
    return '<span class="preco-atual">Consulte preço</span>';
  }
  const atual = `R$${produto.preco.toFixed(2).replace('.', ',')}`;
  if (produto.precoAntigo) {
    const antigo = `R$${produto.precoAntigo.toFixed(2).replace('.', ',')}`;
    return `<span class="preco-antigo">${antigo}</span> <span class="preco-atual">${atual}</span>`;
  }
  return `<span class="preco-atual">${atual}</span>`;
}

function produtoCorresponde(produto, { categoria, busca }) {
  const categoriaOk = categoria === 'todos' || slugCategoria(produto.categoria) === categoria;
  const buscaOk = produto.nome.toLowerCase().includes(busca.trim().toLowerCase());
  return categoriaOk && buscaOk;
}

/* ---------------------------------------------------------------
   Catálogo principal (#gradeProdutos)
--------------------------------------------------------------- */
function renderizarCatalogo() {
  const grade = document.getElementById('gradeProdutos');
  const semResultados = document.getElementById('semResultados');
  if (!grade) return;

  let lista = PRODUTOS.filter((p) => produtoCorresponde(p, ESTADO_CATALOGO));
  if (ESTADO_CATALOGO.apenasDisponiveis) {
    lista = lista.filter((p) => p.disponivel);
  }

  if (!lista.length) {
    grade.innerHTML = '';
    if (semResultados) semResultados.style.display = 'block';
    return;
  }
  if (semResultados) semResultados.style.display = 'none';

  grade.innerHTML = lista.map((p) => `
    <article class="produto ${p.disponivel ? '' : 'indisponivel'}" data-categoria="${slugCategoria(p.categoria)}">
      <div class="produto-icone"><img src="${p.imagem}" alt="${p.nome}" loading="lazy"></div>
      ${p.novo ? '<span class="cartao-oferta-tag">Novo</span>' : ''}
      ${p.oferta ? '<span class="cartao-oferta-tag vermelha">Oferta</span>' : ''}
      <h3>${p.nome}</h3>
      <p>${p.descricao}</p>
      <div class="produto-rodape">
        <span>${formatarPreco(p)}${p.preco !== null ? ` <small>/ ${p.unidade}</small>` : ''}</span>
        ${p.disponivel
          ? '<a href="#" data-link="whatsappPedido">Pedir →</a>'
          : '<span class="produto-indisponivel-selo">Indisponível</span>'}
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Ofertas da semana (#trilhoOfertas)
--------------------------------------------------------------- */
function renderizarOfertas() {
  const trilho = document.getElementById('trilhoOfertas');
  if (!trilho) return;

  const lista = PRODUTOS.filter((p) => p.oferta && p.disponivel);

  trilho.innerHTML = lista.map((p) => `
    <article class="cartao-oferta">
      <div class="cartao-oferta-img"><img src="${p.imagem}" alt="${p.nome}" loading="lazy"></div>
      <div class="cartao-oferta-corpo">
        <span class="cartao-oferta-tag">${p.categoria}</span>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <div class="preco">${formatarPreco(p)}${p.preco !== null ? `<small>/ ${p.unidade}</small>` : '<small>confira na loja</small>'}</div>
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Chegou na Atípicos (novo = true)
--------------------------------------------------------------- */
function renderizarNovidades() {
  const grade = document.getElementById('novidadesGrid');
  if (!grade) return;

  const lista = PRODUTOS.filter((p) => p.novo);

  grade.innerHTML = lista.map((p) => `
    <article class="novidade">
      <div class="novidade-img"><img src="${p.imagem}" alt="${p.nome}" loading="lazy"></div>
      <div class="novidade-corpo">
        <span class="faixa">Novo por aqui</span>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Produtos em destaque (destaque = true)
--------------------------------------------------------------- */
function renderizarDestaques() {
  const grade = document.getElementById('gradeDestaques');
  if (!grade) return;

  const lista = PRODUTOS.filter((p) => p.destaque);

  grade.innerHTML = lista.map((p) => `
    <article class="destaque">
      <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
      <span class="destaque-selo">${p.oferta ? 'Oferta' : 'Destaque'}</span>
      <div class="destaque-legenda">
        <h3>${p.nome}</h3>
        <span>${p.descricao}</span>
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Busca por nome
--------------------------------------------------------------- */
function configurarBuscaProdutos() {
  const input = document.getElementById('buscaProduto');
  if (!input) return;
  input.addEventListener('input', () => {
    ESTADO_CATALOGO.busca = input.value;
    renderizarCatalogo();
  });
}

/* ---------------------------------------------------------------
   Filtro por categoria (botões .filtro-btn já existentes)
--------------------------------------------------------------- */
function configurarFiltroCategoriaCatalogo() {
  const botoes = document.querySelectorAll('.filtro-btn');
  if (!botoes.length) return;

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      botoes.forEach((b) => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      ESTADO_CATALOGO.categoria = botao.getAttribute('data-filtro');
      renderizarCatalogo();
    });
  });
}

/* ---------------------------------------------------------------
   Filtro de disponibilidade
--------------------------------------------------------------- */
function configurarFiltroDisponibilidade() {
  const checkbox = document.getElementById('filtroDisponivel');
  if (!checkbox) return;
  checkbox.addEventListener('change', () => {
    ESTADO_CATALOGO.apenasDisponiveis = checkbox.checked;
    renderizarCatalogo();
  });
}

/* ---------------------------------------------------------------
   Categorias em destaque -> aplicam filtro e rolam até o catálogo
--------------------------------------------------------------- */
function configurarCategoriasParaCatalogo() {
  const categorias = document.querySelectorAll('#gradeCategorias .categoria');
  categorias.forEach((botao) => {
    botao.addEventListener('click', () => {
      const alvo = botao.getAttribute('data-categoria');
      const filtroCorrespondente = document.querySelector(`.filtro-btn[data-filtro="${alvo}"]`);
      if (filtroCorrespondente) filtroCorrespondente.click();

      categorias.forEach((c) => c.classList.remove('ativa'));
      botao.classList.add('ativa');

      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
