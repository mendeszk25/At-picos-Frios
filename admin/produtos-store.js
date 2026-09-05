/* ====================================================================
   ATÍPICOS FRIOS — produtos-store.js
   Camada única de acesso aos produtos (localStorage hoje; API no futuro).
   ==================================================================== */

const ProdutosStore = (function () {
  const CHAVE = 'atipicosfrios_produtos_v1';
  const CHAVE_SEQ = 'atipicosfrios_produtos_seq_v1';
  const IMAGEM_PADRAO = 'images/em-breve.png';

  // Imagens antigas do protótipo que devem ser substituídas pelo placeholder.
  const IMAGENS_ANTIGAS = new Set([
    'images/queijo_coalho.png', 'images/kit_churrasco.png', 'images/frios_bandeja.png',
    'images/morangos.png', 'images/file_peito.png', 'images/oferta_dia.png',
    'images/molho_italac.png', 'images/biscoito_marilan.png', 'images/natural_gurt.png',
    'images/acai.png'
  ]);

  let cache = [];
  const ouvintes = new Set();

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizarProduto(p = {}) {
    let imagem = p.imagem || IMAGEM_PADRAO;
    if (IMAGENS_ANTIGAS.has(imagem)) imagem = IMAGEM_PADRAO;

    // Retorna apenas os campos atualmente suportados, removendo de vez
    // propriedades antigas que não fazem mais parte do cadastro.
    return {
      id: p.id ?? null,
      nome: p.nome || '',
      descricao: p.descricao || '',
      preco: p.preco === '' || p.preco === undefined ? null : p.preco,
      precoAntigo: p.precoAntigo === '' || p.precoAntigo === undefined ? null : p.precoAntigo,
      unidade: p.unidade || 'un.',
      imagem,
      // Produtos antigos não possuíam "catalogo"; nesse caso mantemos visíveis.
      catalogo: p.catalogo !== false,
      novo: !!p.novo,
      oferta: !!p.oferta,
      destaque: !!p.destaque,
      disponivel: p.disponivel !== false,
    };
  }

  function normalizarLista(lista) {
    return (Array.isArray(lista) ? lista : []).map(normalizarProduto);
  }

  function lerBruto() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return normalizarLista(JSON.parse(salvo));
    } catch (e) {
      console.error('ProdutosStore: erro ao ler localStorage', e);
    }
    return normalizarLista(typeof PRODUTOS !== 'undefined' ? clonar(PRODUTOS) : []);
  }

  function salvarBruto(lista) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch (e) {
      console.error('ProdutosStore: erro ao salvar localStorage', e);
      alert('Não foi possível salvar. O armazenamento do navegador pode estar cheio (imagens muito grandes).');
    }
  }

  function proximoId() {
    let seq = parseInt(localStorage.getItem(CHAVE_SEQ) || '0', 10);
    const maiorAtual = cache.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    seq = Math.max(seq, maiorAtual) + 1;
    localStorage.setItem(CHAVE_SEQ, String(seq));
    return seq;
  }

  function publicar() {
    window.PRODUTOS = cache;
    ouvintes.forEach((fn) => {
      try { fn(cache); } catch (e) { console.error(e); }
    });
    window.dispatchEvent(new CustomEvent('produtos:atualizados', { detail: cache }));
  }

  function init() {
    cache = lerBruto();
    // Persiste a migração: remove campos antigos e troca as imagens antigas.
    salvarBruto(cache);
    publicar();
  }

  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE) {
      cache = lerBruto();
      publicar();
    }
  });

  const api = {
    listar() {
      return cache;
    },

    buscarPorId(id) {
      return cache.find((p) => String(p.id) === String(id)) || null;
    },

    criar(dados) {
      const produto = normalizarProduto(Object.assign({ id: proximoId() }, dados));
      cache = [...cache, produto];
      salvarBruto(cache);
      publicar();
      return produto;
    },

    atualizar(id, mudancas) {
      let atualizado = null;
      cache = cache.map((p) => {
        if (String(p.id) !== String(id)) return p;
        atualizado = normalizarProduto(Object.assign({}, p, mudancas, { id: p.id }));
        return atualizado;
      });
      salvarBruto(cache);
      publicar();
      return atualizado;
    },

    remover(id) {
      cache = cache.filter((p) => String(p.id) !== String(id));
      salvarBruto(cache);
      publicar();
    },

    restaurarPadrao() {
      cache = normalizarLista(typeof PRODUTOS !== 'undefined' ? clonar(PRODUTOS) : []);
      salvarBruto(cache);
      publicar();
    },

    aoAtualizar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },

    imagemPadrao: IMAGEM_PADRAO,
  };

  init();
  return api;
})();
