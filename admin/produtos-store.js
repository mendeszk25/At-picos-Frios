/* Catálogo compartilhado no Supabase. localStorage é somente fonte de migração. */
const ProdutosStore = (() => {
  const api = window.AtipicosBackend;
  const ouvintes = new Set();
  const padrao = 'images/em-breve.webp';
  let cache = typeof PRODUTOS === 'undefined' ? [] : structuredClone(PRODUTOS);
  let pronto = false;
  let atualizacaoEmCurso = null;
  let assinaturaCache = JSON.stringify(cache);

  function publicar() {
    ouvintes.forEach((fn) => fn());
    window.dispatchEvent(new CustomEvent('produtos:atualizados'));
  }

  function normalizar(p) {
    const dados = {
      nome: String(p.nome || '').trim(),
      descricao: String(p.descricao || '').trim(),
      unidade: String(p.unidade || 'un.').trim(),
      imagem: p.imagem || padrao,
      preco: p.preco === '' || p.preco == null ? null : Number(p.preco),
      precoAntigo: p.precoAntigo === '' || p.precoAntigo == null ? null : Number(p.precoAntigo),
      catalogo: p.catalogo !== false,
      novo: !!p.novo,
      oferta: !!p.oferta,
      destaque: !!p.destaque,
      disponivel: p.disponivel !== false,
    };
    if (!dados.nome || dados.nome.length > 160 || dados.descricao.length > 1000 || !dados.unidade || dados.unidade.length > 40 ||
        [dados.preco, dados.precoAntigo].some((valor) => valor !== null && (!Number.isFinite(valor) || valor < 0 || valor > 1000000))) {
      throw api.erro('product/invalid-data');
    }
    if (typeof dados.imagem !== 'string' || dados.imagem.length > 2048 ||
        !/^(https:\/\/[^ <>]+|images\/[a-zA-Z0-9_./-]+)$/.test(dados.imagem)) {
      throw api.erro('product/invalid-image');
    }
    return dados;
  }

  function recarregar() {
    if (atualizacaoEmCurso) return atualizacaoEmCurso;

    atualizacaoEmCurso = (async () => {
      const remotos = await api.listarProdutosPublicos();
      remotos.sort((a, b) => String(a.id).localeCompare(String(b.id), 'pt-BR', { numeric: true }));

      const novaAssinatura = JSON.stringify(remotos);
      const mudou = novaAssinatura !== assinaturaCache;
      cache = remotos;
      assinaturaCache = novaAssinatura;
      pronto = true;

      // Polling não deve reconstruir todas as grades quando nada mudou.
      if (mudou) publicar();
      return mudou;
    })().finally(() => {
      atualizacaoEmCurso = null;
    });

    return atualizacaoEmCurso;
  }

  const carregamento = recarregar();
  carregamento.catch((e) => {
    pronto = false;
    window.dispatchEvent(new CustomEvent('produtos:erro', { detail: e }));
  });

  // Mantém a loja aberta refletindo mudanças administrativas sem exigir reload.
  // Falhas silenciosas aqui não derrubam o catálogo embutido/fonte já carregada.
  setInterval(() => {
    if (document.visibilityState === 'visible') recarregar().catch(() => {});
  }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recarregar().catch(() => {});
  });

  async function gravar(acao) {
    if (!pronto) throw api.erro('product/not-ready');
    if (!navigator.onLine) throw api.erro('network/offline');
    // As rotas de mutação já validam a sessão no servidor; evitar um GET
    // /session antes de cada operação remove uma ida de rede redundante.
    const resultado = await acao();

    // Se uma leitura começou antes da mutação, espere-a terminar e faça uma
    // nova leitura para garantir que a tabela reflita a gravação recém-feita.
    if (atualizacaoEmCurso) {
      try { await atualizacaoEmCurso; } catch (_) { /* a nova leitura abaixo decide o estado final */ }
    }
    await recarregar();
    return resultado;
  }

  return {
    listar: () => structuredClone(cache),
    buscarPorId: (id) => structuredClone(cache.find((p) => String(p.id) === String(id)) || null),
    aoAtualizar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    carregamento,
    imagemPadrao: padrao,
    recarregar,
    criar(dados) {
      const produto = normalizar(dados);
      return gravar(() => api.criarProduto(produto));
    },
    atualizar(id, mudancas) {
      const atual = cache.find((p) => String(p.id) === String(id));
      if (!atual) return Promise.reject(api.erro('product/not-found'));
      const produto = normalizar({ ...atual, ...mudancas });
      return gravar(() => api.atualizarProduto(String(id), produto));
    },
    remover(id) {
      return gravar(() => api.removerProduto(String(id)));
    },
    async importarLegado() {
      let lista;
      const salvo = localStorage.getItem('atipicosfrios_produtos_v1');
      try {
        lista = salvo ? JSON.parse(salvo) : (typeof PRODUTOS === 'undefined' ? [] : PRODUTOS);
      } catch (_) {
        throw api.erro('product/invalid-data');
      }
      if (!Array.isArray(lista) || !lista.length) throw api.erro('product/empty-import');
      if (lista.length > 400) throw api.erro('product/invalid-data');
      const produtos = [];
      for (const p of lista) {
        const dados = { ...p };
        if (/^data:image\/(png|jpeg|webp);base64,/.test(dados.imagem || '')) {
          const blob = await (await fetch(dados.imagem)).blob();
          dados.imagem = await api.enviarImagem(blob);
        }
        produtos.push({ id: String(p.id), dados: normalizar(dados) });
      }
      return gravar(() => api.importarProdutos(produtos));
    },
  };
})();
