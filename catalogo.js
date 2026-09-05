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
  if (typeof ProdutosStore === 'undefined' && typeof PRODUTOS === 'undefined') return;

  renderizarOfertas();
  renderizarNovidades();
  renderizarDestaques();
  renderizarCatalogo();

  configurarBuscaProdutos();
  configurarFiltroCategoriaCatalogo();
  configurarFiltroDisponibilidade();
  configurarCategoriasParaCatalogo();

  // Atualiza links de WhatsApp nos cards após script.js aplicar config
  window.addEventListener('produtos:atualizados', () => {
    renderizarOfertas();
    renderizarNovidades();
    renderizarDestaques();
    renderizarCatalogo();
    reaplicarLinksCards();
  });
});

/* ---------------------------------------------------------------
   Utilitários
--------------------------------------------------------------- */

function obterProdutos() {
  if (typeof ProdutosStore !== 'undefined') return ProdutosStore.listar();
  if (typeof PRODUTOS !== 'undefined') return PRODUTOS;
  return [];
}

function slugCategoria(categoria) {
  return (categoria || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatarPreco(produto) {
  if (produto.preco === null || produto.preco === undefined) {
    return '<span class="preco-atual">Consulte preço</span>';
  }
  const atual = `R$\u00a0${produto.preco.toFixed(2).replace('.', ',')}`;
  if (produto.precoAntigo) {
    const antigo = `R$\u00a0${produto.precoAntigo.toFixed(2).replace('.', ',')}`;
    return `<span class="preco-antigo">${antigo}</span> <span class="preco-atual">${atual}</span>`;
  }
  return `<span class="preco-atual">${atual}</span>`;
}

function produtoCorresponde(produto, { categoria, busca }) {
  const categoriaOk = categoria === 'todos' || slugCategoria(produto.categoria) === categoria;
  const buscaOk = produto.nome.toLowerCase().includes(busca.trim().toLowerCase())
    || (produto.descricao || '').toLowerCase().includes(busca.trim().toLowerCase());
  return categoriaOk && buscaOk;
}

function urlWhatsapp() {
  if (typeof BUSINESS_CONFIG !== 'undefined') {
    return BUSINESS_CONFIG.whatsappPedido || BUSINESS_CONFIG.whatsappGrupoOfertas || '#';
  }
  return '#';
}

function atributosLink(url) {
  if (!url || url === '#') return 'href="#"';
  return `href="${url}" target="_blank" rel="noopener noreferrer"`;
}

/* ---------------------------------------------------------------
   Re-aplica links de WhatsApp nos cards já renderizados
   (chamado após aplicarConfiguracoes em script.js)
--------------------------------------------------------------- */
function reaplicarLinksCards() {
  const wa = urlWhatsapp();
  document.querySelectorAll('.card-pedir-link').forEach((el) => {
    if (wa && wa !== '#') {
      el.setAttribute('href', wa);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/* ---------------------------------------------------------------
   Catálogo principal (#gradeProdutos)
--------------------------------------------------------------- */
function renderizarCatalogo() {
  const grade = document.getElementById('gradeProdutos');
  const semResultados = document.getElementById('semResultados');
  if (!grade) return;

  let lista = obterProdutos().filter((p) => produtoCorresponde(p, ESTADO_CATALOGO));
  if (ESTADO_CATALOGO.apenasDisponiveis) {
    lista = lista.filter((p) => p.disponivel);
  }

  if (!lista.length) {
    grade.innerHTML = '';
    if (semResultados) semResultados.style.display = 'block';
    return;
  }
  if (semResultados) semResultados.style.display = 'none';

  const wa = urlWhatsapp();

  grade.innerHTML = lista.map((p) => `
    <article class="produto ${p.disponivel ? '' : 'indisponivel'}" data-categoria="${slugCategoria(p.categoria)}">
      <div class="produto-icone"><img src="${p.imagem}" alt="${p.nome}" loading="lazy"></div>
      <div class="produto-etiquetas">
        ${p.novo ? '<span class="cartao-oferta-tag">Novo</span>' : ''}
        ${p.oferta ? '<span class="cartao-oferta-tag vermelha">Oferta</span>' : ''}
      </div>
      <h3>${p.nome}</h3>
      <p>${p.descricao}</p>
      <div class="produto-rodape">
        <span class="produto-preco">${formatarPreco(p)}${p.preco !== null && p.preco !== undefined ? ` <small>/ ${p.unidade}</small>` : ''}</span>
        ${p.disponivel
          ? `<a class="card-pedir-link" ${atributosLink(wa)}>Pedir →</a>`
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

  const lista = obterProdutos().filter((p) => p.oferta && p.disponivel);

  if (!lista.length) {
    trilho.innerHTML = '<p style="padding:20px;color:var(--osso-fraco)">Nenhuma oferta no momento.</p>';
    return;
  }

  trilho.innerHTML = lista.map((p) => `
    <article class="cartao-oferta">
      <div class="cartao-oferta-img"><img src="${p.imagem}" alt="${p.nome}" loading="lazy"></div>
      <div class="cartao-oferta-corpo">
        <span class="cartao-oferta-tag">${p.categoria}</span>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <div class="preco">${formatarPreco(p)}${p.preco !== null && p.preco !== undefined ? `<small>/ ${p.unidade}</small>` : '<small>confira na loja</small>'}</div>
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

  const lista = obterProdutos().filter((p) => p.novo);

  if (!lista.length) {
    grade.innerHTML = '';
    return;
  }

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

  const lista = obterProdutos().filter((p) => p.destaque);

  if (!lista.length) {
    grade.innerHTML = '';
    return;
  }

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

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      ESTADO_CATALOGO.busca = input.value;
      renderizarCatalogo();
      // Scroll suave até o catálogo em mobile
      if (window.innerWidth < 720 && input.value.length > 1) {
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  });

  // Limpa busca ao pressionar Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      ESTADO_CATALOGO.busca = '';
      renderizarCatalogo();
    }
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

      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
