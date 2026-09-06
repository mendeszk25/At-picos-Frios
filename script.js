/* ====================================================================
   ATÍPICOS FRIOS — script.js
   JavaScript puro, sem dependências.
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracoes();
  configurarMenuMobile();
  configurarScrollSpy();
  configurarCarrossel();
  configurarAnoRodape();
  configurarAcessoAdmin();
  configurarAnimacoesScroll();
});

/* ---------------------------------------------------------------
   Aplica os dados de admin/config.js em todos os elementos com
   [data-link] (vira href) e [data-text] (vira texto).
--------------------------------------------------------------- */
function aplicarConfiguracoes() {
  if (typeof BUSINESS_CONFIG === 'undefined') return;
  const cfg = BUSINESS_CONFIG;

  const linkPara = (chave) => {
    switch (chave) {
      case 'whatsappPedido':
        return cfg.whatsappPedido || cfg.whatsappGrupoOfertas || null;
      case 'whatsappGrupoOfertas':
        return cfg.whatsappGrupoOfertas || null;
      case 'instagram':
        return cfg.instagram || null;
      case 'ifoodUrl':
        return cfg.ifoodUrl || null;
      case 'mapaLinkExterno':
        return cfg.mapaLinkExterno || null;
      default:
        return null;
    }
  };

  document.querySelectorAll('[data-link]').forEach((el) => {
    const chave = el.getAttribute('data-link');
    const url = linkPara(chave);
    if (url) {
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    } else {
      // Sem link configurado: mantém href="#" e impede navegação
      el.setAttribute('href', '#');
      el.addEventListener('click', (e) => {
        if (el.getAttribute('href') === '#') {
          e.preventDefault();
        }
      });
    }
  });

  document.querySelectorAll('[data-text]').forEach((el) => {
    const chave = el.getAttribute('data-text');
    if (cfg[chave]) el.textContent = cfg[chave];
  });

  // Botão do iFood: só aparece se houver link configurado
  document.querySelectorAll('[data-ifood]').forEach((el) => {
    if (cfg.ifoodUrl) {
      el.setAttribute('href', cfg.ifoodUrl);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });

  // Botão iFood legado (#botaoIfood)
  const botaoIfood = document.getElementById('botaoIfood');
  if (botaoIfood) {
    if (cfg.ifoodUrl) {
      botaoIfood.setAttribute('href', cfg.ifoodUrl);
      botaoIfood.setAttribute('target', '_blank');
      botaoIfood.setAttribute('rel', 'noopener noreferrer');
      botaoIfood.style.display = '';
    } else {
      botaoIfood.style.display = 'none';
    }
  }

  // Endereço
  const enderecoTexto = document.getElementById('enderecoTexto');
  if (enderecoTexto) {
    // Prioriza CONFIG.endereco (string simples) se disponível
    if (typeof CONFIG !== 'undefined' && CONFIG.endereco && CONFIG.endereco.trim() !== '') {
      enderecoTexto.textContent = CONFIG.endereco;
    } else {
      const e = cfg.endereco || {};
      const partes = [e.rua, e.bairro, `${e.cidade || 'Gravatá'} – ${e.estado || 'PE'}`, e.cep]
        .filter((p) => p && p.trim() !== '');
      enderecoTexto.textContent = partes.length > 1
        ? partes.join(', ')
        : `Gravatá – PE (endereço completo em breve)`;
    }
  }

  // Telefone
  const telefoneTexto = document.getElementById('telefoneTexto');
  if (telefoneTexto) {
    const telVal = cfg.whatsappPedido;
    telefoneTexto.textContent = telVal && telVal.trim() !== ''
      ? 'Chamar no WhatsApp →'
      : 'Em breve — chame no WhatsApp';
  }

  // Mapa embed
  const mapaLoja = document.getElementById('mapaLoja');
  if (mapaLoja && cfg.mapaEmbedUrl) {
    mapaLoja.src = cfg.mapaEmbedUrl;
  }

  // Horários
  montarHorarios(cfg.horarios || {});

  // Botão WhatsApp flutuante
  const whatsFloat = document.querySelector('.whats-flutuante');
  if (whatsFloat) {
    const waUrl = cfg.whatsappPedido || cfg.whatsappGrupoOfertas;
    if (waUrl) {
      whatsFloat.setAttribute('href', waUrl);
      whatsFloat.setAttribute('target', '_blank');
      whatsFloat.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function montarHorarios(horarios) {
  const nomes = {
    segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
    quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
  };
  const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const hojeChave = diasSemana[new Date().getDay()];

  const listaHorarios = document.getElementById('listaHorarios');
  const footerHorarios = document.getElementById('footerHorarios');

  const linhas = Object.keys(nomes).map((chave) => {
    const valor = horarios[chave] && horarios[chave].trim() !== '' ? horarios[chave] : 'Fechado';
    const ehHoje = chave === hojeChave;
    return { chave, nome: nomes[chave], valor, ehHoje };
  });

  if (listaHorarios) {
    listaHorarios.innerHTML = linhas
      .map((l) => `<div class="${l.ehHoje ? 'hoje' : ''}"><span>${l.nome}</span><span>${l.valor}</span></div>`)
      .join('');
  }

  if (footerHorarios) {
    // Resumo seg–sab no rodapé
    const seg = horarios.segunda || '';
    const sab = horarios.sabado || '';
    const dom = horarios.domingo || '';
    footerHorarios.innerHTML = [
      seg ? `<li>Seg – Sex: ${seg}</li>` : '',
      sab ? `<li>Sábado: ${sab}</li>` : '',
      dom ? `<li>Domingo: ${dom}</li>` : `<li>Domingo: Fechado</li>`,
    ].join('');
  }
}

/* ---------------------------------------------------------------
   Menu mobile
--------------------------------------------------------------- */
function configurarMenuMobile() {
  const botao = document.getElementById('botaoMenu');
  const menu = document.getElementById('menuMobile');
  if (!botao || !menu) return;

  const mobile = window.matchMedia('(max-width: 979px)');
  let overflowAnterior = '';
  const fechar = (devolverFoco = false) => {
    if (!menu.classList.contains('aberto')) return;
    menu.classList.remove('aberto');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-mobile-aberto');
    document.body.style.overflow = overflowAnterior;
    if (devolverFoco) botao.focus();
  };
  const abrir = () => {
    if (!mobile.matches) return;
    overflowAnterior = document.body.style.overflow;
    menu.inert = false;
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('aberto');
    botao.setAttribute('aria-expanded', 'true');
    botao.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-mobile-aberto');
    document.body.style.overflow = 'hidden';
  };
  menu.inert = true;
  botao.addEventListener('click', () => {
    menu.classList.contains('aberto') ? fechar(true) : abrir();
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a, .admin-access-trigger')) fechar();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('aberto')) return;
    if (e.key === 'Escape') fechar(true);
    if (e.key === 'Tab') {
      const itens = [botao, ...menu.querySelectorAll('a[href], button')]
        .filter((el) => el.getClientRects().length);
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    }
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !botao.contains(e.target)) fechar();
  });
  mobile.addEventListener('change', () => { if (!mobile.matches) fechar(); });
}

/* ---------------------------------------------------------------
   Scroll spy da navegação
   - mantém somente um link ativo por menu;
   - acompanha cliques e rolagem manual;
   - considera a altura real da navbar sticky;
   - usa IntersectionObserver e uma linha de referência logo abaixo
     do cabeçalho para evitar trocas cedo ou tarde demais.
--------------------------------------------------------------- */
function configurarScrollSpy() {
  const header = document.querySelector('.header');
  const navDesktop = document.querySelector('.nav-desktop');
  const navMobile = document.querySelector('.nav-mobile');
  const menus = [navDesktop, navMobile].filter(Boolean);

  if (!menus.length) return;

  const resolverAlvo = (hash) => {
    // #topo aponta para <main>, que engloba toda a página. Para o scroll spy,
    // usa somente o hero como região de "Início", sem alterar o href existente.
    if (hash === '#topo') return document.querySelector('.hero');

    try {
      return document.querySelector(hash);
    } catch (_) {
      return null;
    }
  };

  const dadosMenus = menus.map((menu) => {
    const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
    const itens = links
      .map((link) => {
        const hash = link.getAttribute('href');
        const secao = hash && hash !== '#' ? resolverAlvo(hash) : null;
        return secao ? { link, hash, secao } : null;
      })
      .filter(Boolean);

    return { menu, links, itens };
  });

  const definirAtivo = (dados, hash) => {
    dados.links.forEach((link) => {
      const ativo = link.getAttribute('href') === hash;
      link.classList.toggle('ativo', ativo);

      if (ativo) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const ordenarPorPagina = (itens) => [...itens].sort(
    (a, b) => a.secao.getBoundingClientRect().top - b.secao.getBoundingClientRect().top,
  );

  let framePendente = false;

  const atualizar = () => {
    framePendente = false;

    const alturaHeader = header ? header.getBoundingClientRect().height : 0;
    // A linha de leitura fica logo abaixo da navbar, dentro do conteúdo visível.
    const linhaAtiva = alturaHeader + 18;
    const chegouAoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    dadosMenus.forEach((dados) => {
      const itensOrdenados = ordenarPorPagina(dados.itens);
      if (!itensOrdenados.length) return;

      let atual = itensOrdenados[0];

      itensOrdenados.forEach((item) => {
        if (item.secao.getBoundingClientRect().top <= linhaAtiva) {
          atual = item;
        }
      });

      // No fim da página, mantém o último destino do menu selecionado
      // (Contato/Localização no desktop, por exemplo).
      if (chegouAoFim) atual = itensOrdenados[itensOrdenados.length - 1];

      definirAtivo(dados, atual.hash);
    });
  };

  const solicitarAtualizacao = () => {
    if (framePendente) return;
    framePendente = true;
    requestAnimationFrame(atualizar);
  };

  // Atualiza imediatamente ao clicar. Durante o scroll suave, o estado volta
  // a acompanhar naturalmente a seção que cruza a linha abaixo da navbar.
  dadosMenus.forEach((dados) => {
    dados.itens.forEach(({ link, hash }) => {
      link.addEventListener('click', () => definirAtivo(dados, hash));
    });
  });

  const secoesObservadas = new Set(
    dadosMenus.flatMap((dados) => dados.itens.map((item) => item.secao)),
  );

  let observer = null;
  const criarObserver = () => {
    if (!('IntersectionObserver' in window)) return;
    if (observer) observer.disconnect();

    const alturaHeader = Math.ceil(header ? header.getBoundingClientRect().height : 0);
    observer = new IntersectionObserver(solicitarAtualizacao, {
      threshold: [0, 0.01, 0.25, 0.5, 0.75, 1],
      rootMargin: `-${alturaHeader}px 0px -55% 0px`,
    });

    secoesObservadas.forEach((secao) => observer.observe(secao));
  };

  // O listener de scroll complementa o observer em seções muito altas e
  // durante scroll suave, sempre com requestAnimationFrame para evitar custo extra.
  window.addEventListener('scroll', solicitarAtualizacao, { passive: true });
  window.addEventListener('resize', () => {
    criarObserver();
    solicitarAtualizacao();
  }, { passive: true });

  criarObserver();
  atualizar();
}

/* ---------------------------------------------------------------
   Carrossel de ofertas (setas de navegação no desktop)
--------------------------------------------------------------- */
function configurarCarrossel() {
  const trilho = document.getElementById('trilhoOfertas');
  const setaEsq = document.getElementById('setaEsq');
  const setaDir = document.getElementById('setaDir');
  if (!trilho || !setaEsq || !setaDir) return;

  const largaoCard = () => {
    const card = trilho.querySelector('.cartao-oferta');
    return card ? card.offsetWidth + 14 : 230;
  };

  setaEsq.addEventListener('click', () => trilho.scrollBy({ left: -largaoCard(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  setaDir.addEventListener('click', () => trilho.scrollBy({ left: largaoCard(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
}

/* ---------------------------------------------------------------
   Ano atual no rodapé
--------------------------------------------------------------- */
function configurarAnoRodape() {
  const ano = document.getElementById('anoAtual');
  if (ano) ano.textContent = new Date().getFullYear();
}


/* ---------------------------------------------------------------
   Acesso ao painel administrativo
   Senha validada pela Edge Function; sessão e permissões verificadas no servidor.
--------------------------------------------------------------- */
function configurarAcessoAdmin() {
  const modal = document.getElementById('modalAdminAcesso');
  const form = document.getElementById('formAdminAcesso');
  const input = document.getElementById('senhaAdmin');
  const status = document.getElementById('erroAdminAcesso');
  const fecharBtn = document.getElementById('fecharAdminLogin');
  const cancelarBtn = document.getElementById('cancelarAdminLogin');
  const verBtn = document.getElementById('alternarSenhaAdmin');
  const gatilhos = document.querySelectorAll('.admin-access-trigger');
  if (!modal || !form || !input || !status) return;

  const classesStatus = [
    'admin-login-status--loading',
    'admin-login-status--success',
    'admin-login-status--error',
    'admin-login-status--warning',
  ];

  const definirStatus = (tipo = '', mensagem = '') => {
    status.classList.remove(...classesStatus);
    if (tipo) status.classList.add(`admin-login-status--${tipo}`);
    status.textContent = mensagem;
  };

  const tipoFalha = (falha) => {
    const code = falha?.code || '';
    if (['service/unavailable', 'service/not-configured', 'app/not-configured', 'app/backend-not-configured', 'network/offline'].includes(code)) {
      return 'warning';
    }
    return 'error';
  };

  const abrir = () => {
    // Fecha o menu mobile antes de mostrar a senha.
    const menu = document.getElementById('menuMobile');
    const botaoMenu = document.getElementById('botaoMenu');
    if (menu) menu.classList.remove('aberto');
    if (botaoMenu) botaoMenu.setAttribute('aria-expanded', 'false');

    input.value = '';
    input.type = 'password';
    if (verBtn) verBtn.textContent = 'Mostrar';
    definirStatus();
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 60);
  };

  const fechar = () => {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    definirStatus();
    input.value = '';
  };

  gatilhos.forEach((btn) => btn.addEventListener('click', abrir));
  if (fecharBtn) fecharBtn.addEventListener('click', fechar);
  if (cancelarBtn) cancelarBtn.addEventListener('click', fechar);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  if (verBtn) {
    verBtn.addEventListener('click', () => {
      const mostrando = input.type === 'text';
      input.type = mostrando ? 'password' : 'text';
      verBtn.textContent = mostrando ? 'Mostrar' : 'Ocultar';
      input.focus();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('aberto')) fechar();
  });

  let enviando = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;

    // Mantém a validação HTML nativa: nenhum estado "Entrando..." aparece
    // enquanto o formulário estiver inválido/vazio.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    enviando = true;
    const submit = form.querySelector('[type="submit"]');
    const textoOriginalSubmit = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Entrando…';
    definirStatus('loading', 'Entrando…');

    let navegando = false;
    try {
      // Uma única requisição de login. O backend só devolve sucesso depois de
      // validar PBKDF2, rate limit e criar a sessão opaca no servidor.
      await AtipicosBackend.entrar(input.value);
      input.value = '';
      definirStatus('success', 'Acesso confirmado.');
      submit.textContent = 'Abrindo painel…';
      navegando = true;
      window.location.assign('admin/index.html');
    } catch (falha) {
      definirStatus(tipoFalha(falha), AtipicosBackend.mensagem(falha));
      input.value = '';
      input.focus();
    } finally {
      // Em caso de sucesso, não reverte o estado enquanto a navegação já está
      // em andamento. Em caso de erro, libera uma nova tentativa imediatamente.
      if (!navegando) {
        enviando = false;
        submit.disabled = false;
        submit.textContent = textoOriginalSubmit;
      }
    }
  });

  // Quem entra pelo link do rodapé ou tenta abrir /admin sem sessão
  // volta para a Home com ?admin=1. Nesse caso o modal abre sozinho.
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') {
    abrir();
    if (params.get('motivo') === 'sessao') definirStatus('error', 'Sua sessão expirou ou o acesso foi removido. Entre novamente.');
    params.delete('motivo');
    params.delete('admin');
    const resto = params.toString();
    const urlLimpa = window.location.pathname + (resto ? `?${resto}` : '') + window.location.hash;
    window.history.replaceState({}, '', urlLimpa);
  }
}

/* ---------------------------------------------------------------
   Animações de entrada ao rolar a página
   - IntersectionObserver para animar somente quando o conteúdo entra
     na viewport.
   - MutationObserver para também animar cards recriados pelos filtros
     e pelo painel administrativo.
   - Sem dependências externas.
--------------------------------------------------------------- */
function configurarAnimacoesScroll() {
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzirMovimento || !('IntersectionObserver' in window)) return;

  const jaPreparados = new WeakSet();

  const observer = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;

      const el = entrada.target;
      el.classList.add('is-visible');
      observer.unobserve(el);

      // Ao terminar, devolve o elemento ao CSS original. Isso preserva
      // os transforms/hover que os cards já possuíam antes da animação.
      el.addEventListener('animationend', () => {
        el.classList.remove('scroll-reveal', 'reveal-up', 'reveal-left', 'reveal-right', 'reveal-scale', 'reveal-fade', 'is-visible');
        el.style.removeProperty('--reveal-delay');
        el.style.removeProperty('--reveal-duration');
      }, { once: true });
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -55px 0px',
  });

  const preparar = (el, tipo = 'up', delay = 0, duracao = 760) => {
    if (!el || jaPreparados.has(el)) return;
    jaPreparados.add(el);
    if (window.matchMedia('(max-width: 979px)').matches) {
      tipo = tipo === 'fade' ? 'fade' : 'up';
      delay = Math.min(delay, 120);
      duracao = 420;
    }

    el.classList.add('scroll-reveal', `reveal-${tipo}`);
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.style.setProperty('--reveal-duration', `${duracao}ms`);
    observer.observe(el);
  };

  const prepararCabecalhos = (raiz = document) => {
    raiz.querySelectorAll('.secao .faixa').forEach((el) => preparar(el, 'up', 0, 620));
    raiz.querySelectorAll('.secao .secao-titulo').forEach((el) => preparar(el, 'up', 60, 700));
    raiz.querySelectorAll('.secao .secao-sub').forEach((el) => preparar(el, 'up', 120, 700));
  };

  const prepararGrupo = (seletorContainer, seletorItem, tipo = 'up', passo = 80, limite = 5) => {
    document.querySelectorAll(seletorContainer).forEach((container) => {
      container.querySelectorAll(seletorItem).forEach((el, indice) => {
        preparar(el, tipo, Math.min(indice, limite) * passo, 760);
      });
    });
  };

  const prepararConteudo = () => {
    prepararCabecalhos();

    // Cards e grades: pequeno stagger para não entrarem todos juntos.
    prepararGrupo('#trilhoOfertas', '.cartao-oferta', 'up', 60, 5);
    prepararGrupo('#gradeProdutos', '.produto', 'up', 60, 5);
    prepararGrupo('#novidadesGrid', '.novidade', 'up', 60, 4);
    prepararGrupo('#gradeDestaques', '.destaque', 'up', 60, 4);
    prepararGrupo('.grade-insta', '.insta-item', 'up', 60, 5);

    // Blocos maiores recebem direções discretamente diferentes.
    document.querySelectorAll('.sobre-img').forEach((el) => preparar(el, 'scale', 0, 820));
    document.querySelectorAll('.sobre-conteudo').forEach((el) => preparar(el, 'right', 80, 820));
    document.querySelectorAll('.local-mapa').forEach((el) => preparar(el, 'left', 0, 820));
    document.querySelectorAll('.local-cartao').forEach((el) => preparar(el, 'right', 90, 820));
    document.querySelectorAll('.insta-topo').forEach((el) => preparar(el, 'up', 0, 720));
    document.querySelectorAll('.cta-texto').forEach((el) => preparar(el, 'left', 0, 760));
    document.querySelectorAll('.cta-acoes').forEach((el) => preparar(el, 'right', 100, 760));

    // Rodapé: colunas em sequência e fechamento mais discreto.
    document.querySelectorAll('.footer-grid > *').forEach((el, indice) => {
      preparar(el, 'up', Math.min(indice, 4) * 80, 720);
    });
    document.querySelectorAll('.footer-baixo').forEach((el) => preparar(el, 'fade', 100, 700));
  };

  prepararConteudo();

  // Produtos/ofertas são reconstruídos via innerHTML quando o usuário
  // filtra ou quando o estoque é atualizado. Observa somente as áreas
  // relevantes para preparar os novos nós automaticamente.
  const alvosDinamicos = [
    '#trilhoOfertas',
    '#gradeProdutos',
    '#novidadesGrid',
    '#gradeDestaques',
  ];

  let frame = null;
  const mutationObserver = new MutationObserver(() => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      prepararConteudo();
    });
  });

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (!e.matches) return;
    observer.disconnect();
    mutationObserver.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.classList.remove('scroll-reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
      el.style.removeProperty('--reveal-duration');
    });
  });

  alvosDinamicos.forEach((seletor) => {
    const alvo = document.querySelector(seletor);
    if (alvo) mutationObserver.observe(alvo, { childList: true, subtree: true });
  });
}
