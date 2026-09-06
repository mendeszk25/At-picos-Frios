/* ====================================================================
   ATÍPICOS FRIOS — admin.js
   Painel de produtos com seleção das seções de exibição.
   ==================================================================== */

const ESTADO_ADMIN = {
  busca: '',
  status: 'todos',
  edicaoId: null,
  exclusaoId: null,
};

const IMAGEM_PADRAO_ADMIN = 'images/em-breve.png';

document.addEventListener('DOMContentLoaded', () => {
  renderizarTabela();
  configurarBusca();
  configurarFiltros();
  configurarModalProduto();
  configurarModalExclusao();
  configurarSaidaAdmin();

  ProdutosStore.aoAtualizar(() => renderizarTabela());
});

function configurarSaidaAdmin() {
  const btn = document.getElementById('btnSairAdmin');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.location.href = '../index.html';
  });
}

function slug(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function escaparAtributo(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatarPrecoAdmin(produto) {
  if (produto.preco === null || produto.preco === undefined || produto.preco === '') {
    return '<span class="linha-preco-vazio">Consulte preço</span>';
  }
  const atual = `R$${Number(produto.preco).toFixed(2).replace('.', ',')}`;
  let html = `<span class="linha-preco">${atual}</span>`;
  if (produto.precoAntigo) {
    html += `<span class="linha-preco-antigo">R$${Number(produto.precoAntigo).toFixed(2).replace('.', ',')}</span>`;
  }
  return html;
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('toastAdmin');
  toast.textContent = mensagem;
  toast.classList.add('mostrar');
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => toast.classList.remove('mostrar'), 2200);
}

function produtosFiltrados() {
  return ProdutosStore.listar().filter((p) => {
    const buscaOk = slug(p.nome).includes(slug(ESTADO_ADMIN.busca));
    const statusOk = ESTADO_ADMIN.status === 'todos'
      || (ESTADO_ADMIN.status === 'ativo' && p.disponivel)
      || (ESTADO_ADMIN.status === 'inativo' && !p.disponivel);
    return buscaOk && statusOk;
  });
}

function tagsSecoes(p) {
  return [
    p.catalogo !== false ? '<span class="etiqueta etiqueta-catalogo">Loja</span>' : '',
    p.novo ? '<span class="etiqueta etiqueta-novo">Chegou</span>' : '',
    p.oferta ? '<span class="etiqueta etiqueta-oferta">Oferta</span>' : '',
    p.destaque ? '<span class="etiqueta etiqueta-destaque">Destaque</span>' : '',
  ].join('');
}

function caminhoImagemAdmin(imagem) {
  const valor = imagem || IMAGEM_PADRAO_ADMIN;
  if (/^(data:|https?:\/\/|blob:|\/|\.\.\/)/i.test(valor)) return valor;
  return valor.startsWith('images/') ? `../${valor}` : valor;
}

function renderizarTabela() {
  const corpo = document.getElementById('corpoTabelaAdmin');
  const vazio = document.getElementById('tabelaVaziaAdmin');
  const resumo = document.getElementById('resumoAdmin');
  const lista = produtosFiltrados();
  const total = ProdutosStore.listar().length;

  resumo.textContent = `${lista.length} de ${total} produto${total === 1 ? '' : 's'} exibido${lista.length === 1 ? '' : 's'}`;

  if (!lista.length) {
    corpo.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  corpo.innerHTML = lista.map((p) => `
    <tr class="${p.disponivel ? '' : 'inativo'}" data-id="${p.id}">
      <td class="col-img">
        <div class="linha-thumb">
          <img src="${escaparAtributo(caminhoImagemAdmin(p.imagem))}" alt="" data-admin-img>
        </div>
      </td>
      <td>
        <div class="linha-produto-nome">${escaparHtml(p.nome)}</div>
        <div class="linha-produto-desc">${escaparHtml(p.descricao || '')}</div>
      </td>
      <td>${formatarPrecoAdmin(p)}</td>
      <td><div class="tags-etiquetas">${tagsSecoes(p) || '<span class="linha-preco-vazio">Nenhuma seção</span>'}</div></td>
      <td>
        <label class="interruptor" title="Ativar/Desativar produto">
          <input type="checkbox" class="chk-status" data-id="${p.id}" ${p.disponivel ? 'checked' : ''}>
          <span class="interruptor-trilho"></span>
        </label>
        <span class="status-legenda">${p.disponivel ? 'Ativo' : 'Inativo'}</span>
      </td>
      <td class="col-acoes">
        <div class="acoes-linha">
          <button class="btn-icone btn-editar" data-id="${p.id}" title="Editar produto">✎</button>
          <button class="btn-icone perigo btn-excluir" data-id="${p.id}" data-nome="${escaparAtributo(p.nome)}" title="Excluir produto">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  corpo.querySelectorAll('[data-admin-img]').forEach((img) => {
    img.onerror = () => { img.src = '../images/em-breve.png'; };
  });

  corpo.querySelectorAll('.chk-status').forEach((chk) => {
    chk.addEventListener('change', () => {
      ProdutosStore.atualizar(chk.dataset.id, { disponivel: chk.checked });
      mostrarToast(chk.checked ? 'Produto ativado.' : 'Produto desativado.');
    });
  });

  corpo.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.id));
  });

  corpo.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalExclusao(btn.dataset.id, btn.dataset.nome));
  });
}

function configurarBusca() {
  document.getElementById('buscaAdmin').addEventListener('input', (e) => {
    ESTADO_ADMIN.busca = e.target.value;
    renderizarTabela();
  });
}

function configurarFiltros() {
  document.getElementById('filtroStatusAdmin').addEventListener('change', (e) => {
    ESTADO_ADMIN.status = e.target.value;
    renderizarTabela();
  });
}

function configurarModalProduto() {
  const fundo = document.getElementById('modalFundo');
  const form = document.getElementById('formProduto');

  document.getElementById('btnNovoProduto').addEventListener('click', abrirModalCriacao);
  document.getElementById('btnFecharModal').addEventListener('click', fecharModalProduto);
  document.getElementById('btnCancelarModal').addEventListener('click', fecharModalProduto);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fecharModalProduto(); });

  document.getElementById('campoImagemArquivo').addEventListener('change', tratarUploadImagem);
  document.getElementById('campoImagemUrl').addEventListener('input', (e) => atualizarPreviewImagem(e.target.value));
  form.addEventListener('submit', salvarProduto);
}

function abrirModalCriacao() {
  ESTADO_ADMIN.edicaoId = null;
  document.getElementById('modalTitulo').textContent = 'Novo produto';
  document.getElementById('formProduto').reset();
  document.getElementById('campoId').value = '';
  document.getElementById('campoCatalogo').checked = true;
  document.getElementById('campoDisponivel').checked = true;
  atualizarPreviewImagem('');
  abrirModal('modalFundo');
}

function abrirModalEdicao(id) {
  const p = ProdutosStore.buscarPorId(id);
  if (!p) return;

  ESTADO_ADMIN.edicaoId = id;
  document.getElementById('modalTitulo').textContent = 'Editar produto';
  document.getElementById('campoId').value = p.id;
  document.getElementById('campoNome').value = p.nome || '';
  document.getElementById('campoUnidade').value = p.unidade || '';
  document.getElementById('campoDescricao').value = p.descricao || '';
  document.getElementById('campoPreco').value = p.preco ?? '';
  document.getElementById('campoPrecoAntigo').value = p.precoAntigo ?? '';
  document.getElementById('campoImagemUrl').value = p.imagem === IMAGEM_PADRAO_ADMIN ? '' : (p.imagem || '');
  document.getElementById('campoCatalogo').checked = p.catalogo !== false;
  document.getElementById('campoNovo').checked = !!p.novo;
  document.getElementById('campoOferta').checked = !!p.oferta;
  document.getElementById('campoDestaque').checked = !!p.destaque;
  document.getElementById('campoDisponivel').checked = !!p.disponivel;
  atualizarPreviewImagem(p.imagem || '');

  abrirModal('modalFundo');
}

function fecharModalProduto() {
  fecharModal('modalFundo');
}

function tratarUploadImagem(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  if (arquivo.size > 1.5 * 1024 * 1024) {
    alert('Essa imagem é muito grande para salvar no navegador. Prefira uma imagem de até ~1,5MB, ou use o campo de URL/caminho.');
    e.target.value = '';
    return;
  }

  const leitor = new FileReader();
  leitor.onload = () => {
    const dataUrl = leitor.result;
    document.getElementById('campoImagemUrl').value = dataUrl;
    atualizarPreviewImagem(dataUrl);
  };
  leitor.readAsDataURL(arquivo);
}

function atualizarPreviewImagem(valor) {
  const preview = document.getElementById('previewImagem');
  let src = valor || IMAGEM_PADRAO_ADMIN;
  if (!/^(data:|https?:\/\/|blob:|\/|\.\.\/)/i.test(src) && src.startsWith('images/')) {
    src = '../' + src;
  }
  preview.src = src;
  preview.style.display = 'block';
  preview.onerror = () => {
    preview.onerror = null;
    preview.src = '../images/em-breve.png';
  };
}

function salvarProduto(e) {
  e.preventDefault();

  const precoTexto = document.getElementById('campoPreco').value;
  const precoAntigoTexto = document.getElementById('campoPrecoAntigo').value;
  const imagemInformada = document.getElementById('campoImagemUrl').value.trim();

  const dados = {
    nome: document.getElementById('campoNome').value.trim(),
    unidade: document.getElementById('campoUnidade').value.trim() || 'un.',
    descricao: document.getElementById('campoDescricao').value.trim(),
    preco: precoTexto === '' ? null : parseFloat(precoTexto),
    precoAntigo: precoAntigoTexto === '' ? null : parseFloat(precoAntigoTexto),
    imagem: imagemInformada || IMAGEM_PADRAO_ADMIN,
    catalogo: document.getElementById('campoCatalogo').checked,
    novo: document.getElementById('campoNovo').checked,
    oferta: document.getElementById('campoOferta').checked,
    destaque: document.getElementById('campoDestaque').checked,
    disponivel: document.getElementById('campoDisponivel').checked,
  };

  if (!dados.nome) {
    alert('Preencha ao menos o nome do produto.');
    return;
  }

  if (!dados.catalogo && !dados.novo && !dados.oferta && !dados.destaque) {
    const continuar = confirm('Você não selecionou nenhuma seção. O produto ficará salvo no painel, mas não aparecerá em nenhuma área da loja. Deseja continuar?');
    if (!continuar) return;
  }

  if (ESTADO_ADMIN.edicaoId) {
    ProdutosStore.atualizar(ESTADO_ADMIN.edicaoId, dados);
    mostrarToast('Produto atualizado com sucesso.');
  } else {
    ProdutosStore.criar(dados);
    mostrarToast('Produto adicionado com sucesso.');
  }

  fecharModalProduto();
}

function configurarModalExclusao() {
  const fundo = document.getElementById('modalExcluirFundo');
  document.getElementById('btnFecharModalExcluir').addEventListener('click', fecharModalExclusao);
  document.getElementById('btnCancelarExcluir').addEventListener('click', fecharModalExclusao);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fecharModalExclusao(); });

  document.getElementById('btnConfirmarExcluir').addEventListener('click', () => {
    if (ESTADO_ADMIN.exclusaoId != null) {
      ProdutosStore.remover(ESTADO_ADMIN.exclusaoId);
      mostrarToast('Produto excluído.');
    }
    fecharModalExclusao();
  });
}

function abrirModalExclusao(id, nome) {
  ESTADO_ADMIN.exclusaoId = id;
  document.getElementById('nomeProdutoExcluir').textContent = nome;
  abrirModal('modalExcluirFundo');
}

function fecharModalExclusao() {
  ESTADO_ADMIN.exclusaoId = null;
  fecharModal('modalExcluirFundo');
}

function abrirModal(idFundo) {
  document.getElementById(idFundo).classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModal(idFundo) {
  document.getElementById(idFundo).classList.remove('aberto');
  document.body.style.overflow = '';
}
