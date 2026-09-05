/* ====================================================================
   ATÍPICOS FRIOS — catalogo.js
   Renderiza as seções de produtos e controla o carrinho do pedido.
   Categorias foram removidas: cada produto escolhe diretamente em
   quais seções aparece (catálogo, ofertas, novidades e destaques).
   ==================================================================== */

const IMAGEM_PRODUTO_PADRAO = 'images/em-breve.png';
const CHAVE_CARRINHO = 'atipicosfrios_carrinho_v1';
const WHATSAPP_NUMBER = "5581994259307";

const ESTADO_CATALOGO = {
  busca: '',
  apenasDisponiveis: false,
};

let ULTIMA_CONTAGEM_CARRINHO = null;
let CARRINHO = carregarCarrinho();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof ProdutosStore === 'undefined' && typeof PRODUTOS === 'undefined') return;

  renderizarTudo();
  configurarBuscaProdutos();
  configurarFiltroDisponibilidade();
  configurarCarrinho();
  renderizarCarrinho();

  window.addEventListener('produtos:atualizados', () => {
    limparCarrinhoInvalido();
    renderizarTudo();
    renderizarCarrinho();
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

function buscarProduto(id) {
  return obterProdutos().find((p) => String(p.id) === String(id)) || null;
}

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function imagemProduto(produto) {
  return produto.imagem || IMAGEM_PRODUTO_PADRAO;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarPreco(produto) {
  if (produto.preco === null || produto.preco === undefined || produto.preco === '') {
    return '<span class="preco-atual">Consulte preço</span>';
  }
  const atual = formatarMoeda(produto.preco).replace('R$', 'R$\u00a0');
  if (produto.precoAntigo) {
    const antigo = formatarMoeda(produto.precoAntigo).replace('R$', 'R$\u00a0');
    return `<span class="preco-antigo">${antigo}</span> <span class="preco-atual">${atual}</span>`;
  }
  return `<span class="preco-atual">${atual}</span>`;
}

function produtoCorrespondeBusca(produto, busca) {
  const termo = busca.trim().toLowerCase();
  if (!termo) return true;
  return String(produto.nome || '').toLowerCase().includes(termo)
    || String(produto.descricao || '').toLowerCase().includes(termo);
}

function configurarFallbackImagens() {
  document.querySelectorAll('img[data-produto-img]').forEach((img) => {
    img.onerror = () => {
      if (!img.src.endsWith('/images/em-breve.png')) {
        img.src = IMAGEM_PRODUTO_PADRAO;
      }
    };
  });
}

function renderizarTudo() {
  renderizarOfertas();
  renderizarNovidades();
  renderizarDestaques();
  renderizarCatalogo();
  configurarFallbackImagens();
}

function botaoAdicionar(produto, classeExtra = '') {
  if (!produto.disponivel) return '<span class="produto-indisponivel-selo">Indisponível</span>';
  return `<button class="btn-adicionar-pedido ${classeExtra}" type="button" data-adicionar-produto="${escaparHtml(produto.id)}">Adicionar ao pedido</button>`;
}

/* ---------------------------------------------------------------
   Catálogo principal
--------------------------------------------------------------- */
function renderizarCatalogo() {
  const grade = document.getElementById('gradeProdutos');
  const semResultados = document.getElementById('semResultados');
  if (!grade) return;

  let lista = obterProdutos()
    .filter((p) => p.catalogo !== false)
    .filter((p) => produtoCorrespondeBusca(p, ESTADO_CATALOGO.busca));

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
    <article class="produto ${p.disponivel ? '' : 'indisponivel'}">
      <div class="produto-icone"><img data-produto-img src="${escaparHtml(imagemProduto(p))}" alt="${escaparHtml(p.nome)}" loading="lazy"></div>
      <div class="produto-etiquetas">
        ${p.novo ? '<span class="cartao-oferta-tag">Novo</span>' : ''}
        ${p.oferta ? '<span class="cartao-oferta-tag vermelha">Oferta</span>' : ''}
      </div>
      <h3>${escaparHtml(p.nome)}</h3>
      <p>${escaparHtml(p.descricao || '')}</p>
      <div class="produto-rodape">
        <span class="produto-preco">${formatarPreco(p)}${p.preco !== null && p.preco !== undefined ? ` <small>/ ${escaparHtml(p.unidade || 'un.')}</small>` : ''}</span>
        ${botaoAdicionar(p)}
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Ofertas da semana
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
      <div class="cartao-oferta-img"><img data-produto-img src="${escaparHtml(imagemProduto(p))}" alt="${escaparHtml(p.nome)}" loading="lazy"></div>
      <div class="cartao-oferta-corpo">
        <span class="cartao-oferta-tag vermelha">Oferta da semana</span>
        <h3>${escaparHtml(p.nome)}</h3>
        <p>${escaparHtml(p.descricao || '')}</p>
        <div class="preco">${formatarPreco(p)}${p.preco !== null && p.preco !== undefined ? `<small>/ ${escaparHtml(p.unidade || 'un.')}</small>` : '<small>confira na loja</small>'}</div>
        ${botaoAdicionar(p, 'btn-adicionar-bloco')}
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Chegou na Atípicos
--------------------------------------------------------------- */
function renderizarNovidades() {
  const grade = document.getElementById('novidadesGrid');
  if (!grade) return;

  const lista = obterProdutos().filter((p) => p.novo && p.disponivel);
  if (!lista.length) {
    grade.innerHTML = '<p class="secao-vazia">Nenhuma novidade cadastrada no momento.</p>';
    return;
  }

  grade.innerHTML = lista.map((p) => `
    <article class="novidade">
      <div class="novidade-img"><img data-produto-img src="${escaparHtml(imagemProduto(p))}" alt="${escaparHtml(p.nome)}" loading="lazy"></div>
      <div class="novidade-corpo">
        <span class="faixa">Novo por aqui</span>
        <h3>${escaparHtml(p.nome)}</h3>
        <p>${escaparHtml(p.descricao || '')}</p>
        ${botaoAdicionar(p, 'btn-adicionar-compacto')}
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Produtos em destaque
--------------------------------------------------------------- */
function renderizarDestaques() {
  const grade = document.getElementById('gradeDestaques');
  if (!grade) return;

  const lista = obterProdutos().filter((p) => p.destaque && p.disponivel);
  if (!lista.length) {
    grade.innerHTML = '<p class="secao-vazia">Nenhum produto em destaque no momento.</p>';
    return;
  }

  grade.innerHTML = lista.map((p) => `
    <article class="destaque">
      <img data-produto-img src="${escaparHtml(imagemProduto(p))}" alt="${escaparHtml(p.nome)}" loading="lazy">
      <span class="destaque-selo">${p.oferta ? 'Oferta' : 'Destaque'}</span>
      <div class="destaque-legenda">
        <h3>${escaparHtml(p.nome)}</h3>
        <span>${escaparHtml(p.descricao || '')}</span>
        ${botaoAdicionar(p, 'btn-adicionar-destaque')}
      </div>
    </article>
  `).join('');
}

/* ---------------------------------------------------------------
   Busca e disponibilidade
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
      configurarFallbackImagens();
    }, 180);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      ESTADO_CATALOGO.busca = '';
      renderizarCatalogo();
      configurarFallbackImagens();
    }
  });
}

function configurarFiltroDisponibilidade() {
  const checkbox = document.getElementById('filtroDisponivel');
  if (!checkbox) return;
  checkbox.addEventListener('change', () => {
    ESTADO_CATALOGO.apenasDisponiveis = checkbox.checked;
    renderizarCatalogo();
    configurarFallbackImagens();
  });
}

/* ===================================================================
   CARRINHO / RESUMO DO PEDIDO
=================================================================== */
function carregarCarrinho() {
  try {
    const salvo = localStorage.getItem(CHAVE_CARRINHO);
    const parsed = salvo ? JSON.parse(salvo) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function salvarCarrinho() {
  try {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(CARRINHO));
  } catch (e) {
    console.warn('Não foi possível salvar o carrinho.', e);
  }
}

function limparCarrinhoInvalido() {
  let mudou = false;
  Object.keys(CARRINHO).forEach((id) => {
    const p = buscarProduto(id);
    if (!p || !p.disponivel) {
      delete CARRINHO[id];
      mudou = true;
    }
  });
  if (mudou) salvarCarrinho();
}

function adicionarAoPedido(id) {
  const produto = buscarProduto(id);
  if (!produto || !produto.disponivel) return;
  const chave = String(id);
  CARRINHO[chave] = Math.min(99, Number(CARRINHO[chave] || 0) + 1);
  salvarCarrinho();
  renderizarCarrinho();
}

function alterarQuantidade(id, delta) {
  const chave = String(id);
  const atual = Number(CARRINHO[chave] || 0);
  const nova = Math.min(99, atual + delta);
  if (nova <= 0) delete CARRINHO[chave];
  else CARRINHO[chave] = nova;
  salvarCarrinho();
  renderizarCarrinho();
}

function removerDoPedido(id) {
  delete CARRINHO[String(id)];
  salvarCarrinho();
  renderizarCarrinho();
}

function itensCarrinho() {
  return Object.entries(CARRINHO)
    .map(([id, quantidade]) => ({ produto: buscarProduto(id), quantidade: Number(quantidade) || 0 }))
    .filter((item) => item.produto && item.produto.disponivel && item.quantidade > 0);
}

function obterResumoCarrinho() {
  const itens = itensCarrinho().map(({ produto, quantidade }) => {
    const temPreco = produto.preco !== null && produto.preco !== undefined && produto.preco !== '';
    const precoUnitario = temPreco ? Number(produto.preco) : null;
    const subtotal = precoUnitario === null ? null : precoUnitario * quantidade;
    return { produto, quantidade, precoUnitario, subtotal };
  });

  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const temSemPreco = itens.some((item) => item.precoUnitario === null);
  const total = itens.reduce((soma, item) => soma + (item.subtotal ?? 0), 0);

  return { itens, quantidadeTotal, temSemPreco, total };
}

function renderizarCarrinho() {
  const itensEl = document.getElementById('carrinhoItens');
  const totalEl = document.getElementById('carrinhoTotal');
  const contagemEl = document.getElementById('carrinhoContagem');
  const avisoEl = document.getElementById('carrinhoAvisoPreco');
  const finalizarBtn = document.getElementById('finalizarWhatsapp');
  if (!itensEl || !totalEl || !contagemEl) return;

  limparCarrinhoInvalido();
  const { itens, quantidadeTotal, temSemPreco, total } = obterResumoCarrinho();

  const contagemMudou = ULTIMA_CONTAGEM_CARRINHO !== null && ULTIMA_CONTAGEM_CARRINHO !== quantidadeTotal;
  contagemEl.textContent = String(quantidadeTotal);
  contagemEl.hidden = quantidadeTotal === 0;
  ULTIMA_CONTAGEM_CARRINHO = quantidadeTotal;
  if (contagemMudou && quantidadeTotal > 0) animarContadorCarrinho();
  totalEl.textContent = formatarMoeda(total) + (temSemPreco ? '*' : '');
  if (avisoEl) avisoEl.hidden = !temSemPreco;
  if (finalizarBtn) finalizarBtn.disabled = false;

  if (!itens.length) {
    itensEl.innerHTML = `
      <div class="carrinho-vazio">
        <div class="carrinho-vazio-icone">🛒</div>
        <strong>Seu pedido está vazio</strong>
        <p>Adicione os produtos que você quiser e o total aparecerá aqui.</p>
      </div>`;
    return;
  }

  itensEl.innerHTML = itens.map(({ produto: p, quantidade, precoUnitario, subtotal }) => {
    return `
      <article class="carrinho-item">
        <img data-produto-img src="${escaparHtml(imagemProduto(p))}" alt="${escaparHtml(p.nome)}">
        <div class="carrinho-item-info">
          <strong>${escaparHtml(p.nome)}</strong>
          <span>${precoUnitario === null ? 'Preço a confirmar' : `${formatarMoeda(precoUnitario)} / ${escaparHtml(p.unidade || 'un.')}`}</span>
          <div class="carrinho-item-baixo">
            <div class="controle-quantidade" aria-label="Quantidade de ${escaparHtml(p.nome)}">
              <button type="button" data-carrinho-diminuir="${escaparHtml(p.id)}" aria-label="Diminuir quantidade">−</button>
              <span>${quantidade}</span>
              <button type="button" data-carrinho-aumentar="${escaparHtml(p.id)}" aria-label="Aumentar quantidade">+</button>
            </div>
            <strong class="carrinho-subtotal">${subtotal === null ? 'A confirmar' : formatarMoeda(subtotal)}</strong>
          </div>
          <button class="carrinho-remover" type="button" data-carrinho-remover="${escaparHtml(p.id)}">Remover</button>
        </div>
      </article>`;
  }).join('');

  configurarFallbackImagens();
}

function configurarCarrinho() {
  const overlay = document.getElementById('carrinhoOverlay');
  const abrirBtn = document.getElementById('abrirCarrinho');
  const fecharBtn = document.getElementById('fecharCarrinho');
  const finalizarBtn = document.getElementById('finalizarWhatsapp');

  document.addEventListener('click', (e) => {
    const adicionar = e.target.closest('[data-adicionar-produto]');
    if (adicionar) {
      adicionarAoPedido(adicionar.getAttribute('data-adicionar-produto'));
      mostrarFeedbackAdicionado(adicionar);
      return;
    }

    const aumentar = e.target.closest('[data-carrinho-aumentar]');
    if (aumentar) {
      alterarQuantidade(aumentar.getAttribute('data-carrinho-aumentar'), 1);
      return;
    }

    const diminuir = e.target.closest('[data-carrinho-diminuir]');
    if (diminuir) {
      alterarQuantidade(diminuir.getAttribute('data-carrinho-diminuir'), -1);
      return;
    }

    const remover = e.target.closest('[data-carrinho-remover]');
    if (remover) {
      removerDoPedido(remover.getAttribute('data-carrinho-remover'));
    }
  });

  abrirBtn?.addEventListener('click', abrirCarrinho);
  fecharBtn?.addEventListener('click', fecharCarrinho);
  finalizarBtn?.addEventListener('click', finalizarPedidoWhatsapp);

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) fecharCarrinho();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('aberto')) fecharCarrinho();
  });
}

function abrirCarrinho() {
  const overlay = document.getElementById('carrinhoOverlay');
  if (!overlay) return;
  renderizarCarrinho();
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
  const overlay = document.getElementById('carrinhoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function mostrarFeedbackAdicionado(botao) {
  if (!botao) return;
  const textoOriginal = botao.dataset.textoOriginal || botao.textContent.trim();
  botao.dataset.textoOriginal = textoOriginal;
  clearTimeout(botao._feedbackTimer);
  botao.textContent = '✓ Adicionado';
  botao.classList.add('adicionado-feedback');

  botao._feedbackTimer = setTimeout(() => {
    if (!botao.isConnected) return;
    botao.textContent = textoOriginal;
    botao.classList.remove('adicionado-feedback');
  }, 800);
}

function animarContadorCarrinho() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const contador = document.getElementById('carrinhoContagem');
  if (!contador || contador.hidden) return;
  contador.classList.remove('pop');
  void contador.offsetWidth;
  contador.classList.add('pop');
  setTimeout(() => contador.classList.remove('pop'), 260);
}

function montarMensagemWhatsapp() {
  const { itens, temSemPreco, total } = obterResumoCarrinho();
  const linhas = [
    'Olá! Gostaria de fazer este pedido:',
    '',
  ];

  itens.forEach(({ produto, quantidade, subtotal }) => {
    if (subtotal === null) {
      linhas.push(`• ${quantidade}x ${produto.nome} — preço a confirmar`);
      return;
    }

    linhas.push(`• ${quantidade}x ${produto.nome} — ${formatarMoeda(subtotal)}`);
  });

  linhas.push('');
  linhas.push(`Total: ${formatarMoeda(total)}${temSemPreco ? '*' : ''}`);

  if (temSemPreco) {
    linhas.push('');
    linhas.push('* Alguns itens estão sem preço cadastrado e serão confirmados no WhatsApp.');
  }

  const retiradaNoLocal = document.getElementById('retiradaNoLocal')?.checked === true;
  if (retiradaNoLocal) {
    linhas.push('');
    linhas.push('Forma de recebimento: Retirada no local');
  }

  return linhas.join('\n');
}

function finalizarPedidoWhatsapp() {
  const { itens } = obterResumoCarrinho();
  if (!itens.length) {
    alert('Seu carrinho está vazio.');
    return;
  }

  const message = montarMensagemWhatsapp();
  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank");
}
