/* ====================================================================
   ATÍPICOS FRIOS — cliente do backend Supabase
   - senha validada somente na Edge Function;
   - sessão opaca por aba em sessionStorage (nunca a senha);
   - CRUD e uploads passam pelo servidor;
   - produtos possuem leitura pública via RLS.
   ==================================================================== */
window.AtipicosBackend = (() => {
  const CHAVE_SESSAO = 'atipicos_admin_session_v2';
  const erro = (code, details) => Object.assign(new Error(code), { code, details });

  function config() {
    const c = window.ATIPICOS_BACKEND_CONFIG || {};
    const url = String(c.supabaseUrl || '').replace(/\/+$/, '');
    const key = String(c.publishableKey || '').trim();
    const placeholder = !url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
      || /SEU_PROJECT_REF/i.test(url) || !key || /COLE_AQUI/i.test(key);
    if (placeholder) throw erro('app/not-configured');
    return { url, key };
  }

  function headersPublicos(extra = {}) {
    const { key } = config();
    const h = { apikey: key, ...extra };
    // Chaves anon JWT legadas também podem ser usadas como Bearer. As novas
    // publishable keys devem ficar somente em `apikey`.
    if (key.split('.').length === 3) h.Authorization = `Bearer ${key}`;
    return h;
  }

  function lerSessao() {
    try {
      const dado = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null');
      if (!dado || typeof dado.token !== 'string' || !Number.isFinite(dado.expiraEm)) return null;
      if (dado.expiraEm <= Date.now()) {
        sessionStorage.removeItem(CHAVE_SESSAO);
        return null;
      }
      return dado;
    } catch (_) {
      sessionStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
  }

  function salvarSessao(token, expiraEm) {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, expiraEm }));
  }

  function limparSessao() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }


  async function fetchComTimeout(recurso, opcoes = {}, timeoutMs = 12000) {
    if (typeof AbortController !== 'function') return fetch(recurso, opcoes);

    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), timeoutMs);
    try {
      return await fetch(recurso, { ...opcoes, signal: controlador.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function interpretarResposta(resposta) {
    let corpo = null;
    try { corpo = await resposta.json(); } catch (_) { /* resposta sem JSON */ }
    if (resposta.ok) return corpo;
    const code = corpo?.code || (resposta.status >= 500 ? 'service/unavailable' : 'request/failed');
    throw erro(code, corpo?.details || corpo);
  }

  async function chamarAdmin(caminho, opcoes = {}, exigeSessao = true) {
    const { url } = config();
    const headers = headersPublicos(opcoes.headers || {});
    if (exigeSessao) {
      const sessao = lerSessao();
      if (!sessao) throw erro('auth/session-expired');
      headers['x-atipicos-session'] = sessao.token;
    }
    let resposta;
    try {
      resposta = await fetchComTimeout(`${url}/functions/v1/admin-api${caminho}`, {
        ...opcoes,
        headers,
        cache: 'no-store',
      });
    } catch (e) {
      if (!navigator.onLine) throw erro('network/offline');
      throw erro('service/unavailable', { cause: e?.message });
    }
    return interpretarResposta(resposta);
  }

  async function entrar(senha) {
    if (typeof senha !== 'string' || !senha.length) throw erro('auth/invalid-password');
    const dados = await chamarAdmin('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ senha }),
    }, false);
    if (typeof dados?.sessao !== 'string' || !Number.isFinite(dados?.expiraEm)) {
      throw erro('service/unavailable');
    }
    // O POST /login já validou a senha no servidor e acabou de criar a sessão.
    // Evita um GET /session redundante aqui; a página do painel valida a sessão
    // novamente ao carregar antes de liberar a interface administrativa.
    salvarSessao(dados.sessao, dados.expiraEm);
    return { expiraEm: dados.expiraEm };
  }

  async function exigirAdmin() {
    const sessao = lerSessao();
    if (!sessao) throw erro('auth/session-expired');
    try {
      const dados = await chamarAdmin('/session', { method: 'GET' }, true);
      if (Number.isFinite(dados?.expiraEm) && dados.expiraEm !== sessao.expiraEm) {
        salvarSessao(sessao.token, dados.expiraEm);
      }
      return { expiraEm: Number(dados?.expiraEm) || sessao.expiraEm };
    } catch (e) {
      if (['auth/session-expired', 'auth/not-authorized'].includes(e.code)) limparSessao();
      throw e;
    }
  }

  async function sair() {
    const sessao = lerSessao();
    try {
      if (sessao) await chamarAdmin('/logout', { method: 'POST' }, true);
    } catch (_) {
      // Mesmo se o servidor estiver fora do ar, sair deve encerrar o acesso
      // nesta aba. A sessão remota restante expira automaticamente em até 8h.
    } finally {
      limparSessao();
    }
  }

  async function listarProdutosPublicos() {
    const { url } = config();
    let resposta;
    try {
      resposta = await fetchComTimeout(`${url}/rest/v1/atipicos_produtos?select=id,dados`, {
        headers: headersPublicos({ Accept: 'application/json' }),
        cache: 'no-store',
      });
    } catch (e) {
      if (!navigator.onLine) throw erro('network/offline');
      throw erro('service/unavailable', { cause: e?.message });
    }
    if (!resposta.ok) {
      if ([404, 406].includes(resposta.status)) throw erro('app/backend-not-configured');
      throw erro(resposta.status >= 500 ? 'service/unavailable' : 'request/failed');
    }
    const linhas = await resposta.json();
    if (!Array.isArray(linhas)) throw erro('service/unavailable');
    return linhas.map((linha) => ({ ...(linha.dados || {}), id: linha.id }));
  }

  async function criarProduto(dados) {
    return chamarAdmin('/products', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dados }),
    });
  }

  async function atualizarProduto(id, dados) {
    return chamarAdmin(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dados }),
    });
  }

  async function removerProduto(id) {
    return chamarAdmin(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function importarProdutos(produtos) {
    return chamarAdmin('/import', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ produtos }),
    });
  }

  async function enviarImagem(arquivo) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) || arquivo.size > 1572864) {
      throw erro('storage/invalid-file');
    }
    const form = new FormData();
    form.append('arquivo', arquivo, arquivo.name || 'produto');
    const resposta = await chamarAdmin('/images', { method: 'POST', body: form });
    if (typeof resposta?.url !== 'string') throw erro('service/unavailable');
    return resposta.url;
  }

  function mensagem(e) {
    const code = e?.code || '';
    if (code === 'auth/password-incorrect') return 'Senha incorreta. Tente novamente.';
    if (code === 'auth/invalid-password') return 'Informe uma senha válida.';
    if (code === 'auth/too-many-attempts') {
      const segundos = Number(e.details?.tentarEmSegundos) || 900;
      const minutos = Math.max(1, Math.min(30, Math.ceil(segundos / 60)));
      return `Muitas tentativas. Aguarde cerca de ${minutos} minuto(s) antes de tentar novamente.`;
    }
    if (code === 'auth/session-expired') return 'Sua sessão expirou. Entre novamente.';
    if (code === 'auth/not-authorized') return 'A sessão não tem autorização para alterar o catálogo.';
    if (['app/not-configured', 'app/backend-not-configured', 'service/not-configured'].includes(code)) {
      return 'Acesso administrativo ainda não configurado. Falta conectar este site ao projeto Supabase e publicar a configuração gratuita do backend.';
    }
    if (code === 'network/offline') return 'Sem conexão com a internet. Reconecte e tente novamente.';
    if (code === 'service/unavailable') return 'Serviço de acesso temporariamente indisponível. A internet pode estar funcionando normalmente; tente novamente em instantes.';
    if (code === 'storage/invalid-file') return 'Escolha uma imagem JPEG, PNG ou WebP de até 1,5 MB.';
    if (code === 'product/invalid-image') return 'Use uma imagem HTTPS, um caminho images/ ou envie um arquivo.';
    if (code === 'product/invalid-data') return 'Confira os dados: nome até 160 caracteres, descrição até 1000 e preços de 0 a 1.000.000.';
    if (code === 'product/not-found') return 'O produto não existe mais. Atualize a página.';
    if (code === 'product/not-ready') return 'Aguarde o carregamento dos produtos antes de alterar o catálogo.';
    if (code === 'product/empty-import') return 'Nenhum produto encontrado para importar.';
    return 'Não foi possível concluir a operação. Verifique a configuração do backend e tente novamente.';
  }

  return {
    erro, entrar, sair, exigirAdmin, mensagem, enviarImagem,
    listarProdutosPublicos, criarProduto, atualizarProduto, removerProduto, importarProdutos,
    _sessao: { ler: lerSessao, limpar: limparSessao },
  };
})();
