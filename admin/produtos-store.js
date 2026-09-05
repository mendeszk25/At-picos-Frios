/* ====================================================================
   ATÍPICOS FRIOS — produtos-store.js
   ====================================================================
   Camada única de acesso aos dados dos produtos.

   HOJE: guarda tudo no localStorage do navegador.
   AMANHÃ: quando a loja tiver um backend/API, basta reescrever as
   5 funções marcadas "// TODO API" abaixo (ler, salvar) para fazer
   fetch() em vez de mexer no localStorage. Nada mais no site (nem o
   painel /admin, nem a loja) precisa mudar, porque todo mundo usa
   apenas os métodos de ProdutosStore, nunca localStorage direto.

   Carregar SEMPRE depois de produtos.js (que define o array PRODUTOS
   usado como "carga inicial" na primeira vez que o site roda) e
   ANTES de catalogo.js / admin.js.
   ==================================================================== */

const ProdutosStore = (function () {
  const CHAVE = 'atipicosfrios_produtos_v1';
  const CHAVE_SEQ = 'atipicosfrios_produtos_seq_v1';

  let cache = [];
  const ouvintes = new Set();

  /* ---------------------------------------------------------------
     Leitura / escrita bruta (é só isso que muda no dia da API)
  --------------------------------------------------------------- */
  function lerBruto() {
    // TODO API: substituir por `return await fetch('/api/produtos').then(r => r.json())`
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (e) {
      console.error('ProdutosStore: erro ao ler localStorage', e);
    }
    // Primeira vez: usa a lista inicial do produtos.js como semente
    return (typeof PRODUTOS !== 'undefined') ? clonar(PRODUTOS) : [];
  }

  function salvarBruto(lista) {
    // TODO API: substituir por `await fetch('/api/produtos', { method:'PUT', body: JSON.stringify(lista) })`
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

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ---------------------------------------------------------------
     Sincronização: mantém window.PRODUTOS e avisa quem escuta
  --------------------------------------------------------------- */
  function publicar() {
    window.PRODUTOS = cache;
    ouvintes.forEach((fn) => {
      try { fn(cache); } catch (e) { console.error(e); }
    });
    window.dispatchEvent(new CustomEvent('produtos:atualizados', { detail: cache }));
    rerenderizarLojaSeExistir();
  }

  // Se as funções de renderização do catalogo.js já existirem nesta
  // página (ou seja, estamos na loja, não no admin), redesenha tudo
  // sozinho sempre que os produtos mudarem — sem precisar dar F5.
  function rerenderizarLojaSeExistir() {
    ['renderizarOfertas', 'renderizarNovidades', 'renderizarDestaques', 'renderizarCatalogo']
      .forEach((nomeFn) => {
        if (typeof window[nomeFn] === 'function') {
          try { window[nomeFn](); } catch (e) { /* catalogo.js pode ainda não ter rodado a 1ª vez */ }
        }
      });
  }

  function init() {
    cache = lerBruto();
    publicar();
  }

  // Reflete automaticamente em outras abas/páginas abertas (ex.: loja
  // aberta enquanto o admin altera algo em outra aba)
  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE) {
      cache = lerBruto();
      publicar();
    }
  });

  /* ---------------------------------------------------------------
     API pública usada pelo painel admin e pela loja
  --------------------------------------------------------------- */
  const api = {
    /** Lista todos os produtos (array já pronto para uso). */
    listar() {
      return cache;
    },

    /** Busca um produto pelo id. */
    buscarPorId(id) {
      return cache.find((p) => String(p.id) === String(id)) || null;
    },

    /** Lista de categorias já usadas nos produtos, sem repetir. */
    listarCategorias() {
      return [...new Set(cache.map((p) => p.categoria).filter(Boolean))].sort();
    },

    /** Cria um novo produto. Retorna o produto criado (com id). */
    criar(dados) {
      const produto = Object.assign({
        id: null,
        nome: '',
        categoria: '',
        descricao: '',
        preco: null,
        precoAntigo: null,
        unidade: 'un.',
        imagem: '',
        novo: false,
        oferta: false,
        destaque: false,
        disponivel: true,
      }, dados);
      produto.id = dados.id ?? proximoId();
      cache = [...cache, produto];
      salvarBruto(cache);
      publicar();
      return produto;
    },

    /** Atualiza campos de um produto existente (merge parcial). */
    atualizar(id, mudancas) {
      let atualizado = null;
      cache = cache.map((p) => {
        if (String(p.id) === String(id)) {
          atualizado = Object.assign({}, p, mudancas);
          return atualizado;
        }
        return p;
      });
      salvarBruto(cache);
      publicar();
      return atualizado;
    },

    /** Remove um produto pelo id. */
    remover(id) {
      cache = cache.filter((p) => String(p.id) !== String(id));
      salvarBruto(cache);
      publicar();
    },

    /** Restaura a lista original de produtos.js, apagando alterações. */
    restaurarPadrao() {
      cache = (typeof PRODUTOS !== 'undefined') ? clonar(PRODUTOS) : [];
      salvarBruto(cache);
      publicar();
    },

    /** Escuta mudanças (mesma aba). Retorna função para cancelar. */
    aoAtualizar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
  };

  init();
  return api;
})();
