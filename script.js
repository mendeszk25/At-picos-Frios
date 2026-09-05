/* ====================================================================
   ATÍPICOS FRIOS — script.js
   JavaScript puro, sem dependências.
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracoes();
  configurarMenuMobile();
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

  const fechar = () => {
    menu.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const abrir = () => {
    menu.classList.add('aberto');
    botao.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  botao.addEventListener('click', () => {
    const estaAberto = menu.classList.contains('aberto');
    estaAberto ? fechar() : abrir();
  });

  // Fecha ao clicar num link
  menu.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', fechar));

  // Fecha ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });

  // Fecha ao clicar fora do menu (overlay)
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('aberto') && !menu.contains(e.target) && e.target !== botao && !botao.contains(e.target)) {
      fechar();
    }
  });
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

  setaEsq.addEventListener('click', () => trilho.scrollBy({ left: -largaoCard(), behavior: 'smooth' }));
  setaDir.addEventListener('click', () => trilho.scrollBy({ left: largaoCard(), behavior: 'smooth' }));
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
   Observação: como o projeto é 100% estático, esta senha é apenas
   uma barreira simples de interface. Para segurança real, use
   autenticação no backend.
--------------------------------------------------------------- */
function configurarAcessoAdmin() {
  const modal = document.getElementById('modalAdminAcesso');
  const form = document.getElementById('formAdminAcesso');
  const input = document.getElementById('senhaAdmin');
  const erro = document.getElementById('erroAdminAcesso');
  const fecharBtn = document.getElementById('fecharAdminLogin');
  const cancelarBtn = document.getElementById('cancelarAdminLogin');
  const verBtn = document.getElementById('alternarSenhaAdmin');
  const gatilhos = document.querySelectorAll('.admin-access-trigger');
  if (!modal || !form || !input) return;

  const senhaConfigurada = (typeof CONFIG !== 'undefined' && CONFIG.adminSenha)
    ? String(CONFIG.adminSenha)
    : 'atipicos123';

  const abrir = () => {
    // Fecha o menu mobile antes de mostrar a senha.
    const menu = document.getElementById('menuMobile');
    const botaoMenu = document.getElementById('botaoMenu');
    if (menu) menu.classList.remove('aberto');
    if (botaoMenu) botaoMenu.setAttribute('aria-expanded', 'false');

    input.value = '';
    input.type = 'password';
    if (verBtn) verBtn.textContent = 'Mostrar';
    erro.textContent = '';
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 60);
  };

  const fechar = () => {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    erro.textContent = '';
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value === senhaConfigurada) {
      sessionStorage.setItem('atipicos_admin_autorizado', '1');
      window.location.href = 'admin/index.html';
      return;
    }
    erro.textContent = 'Senha incorreta. Tente novamente.';
    input.select();
  });

  // Quem entra pelo link do rodapé ou tenta abrir /admin sem sessão
  // volta para a Home com ?admin=1. Nesse caso o modal abre sozinho.
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') {
    abrir();
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
  if (reduzirMovimento) return;

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
        el.classList.remove('scroll-reveal', 'reveal-up', 'reveal-left', 'reveal-right', 'reveal-fade', 'is-visible');
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

    el.classList.add('scroll-reveal', `reveal-${tipo}`);
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.style.setProperty('--reveal-duration', `${duracao}ms`);
    observer.observe(el);
  };

  const prepararCabecalhos = (raiz = document) => {
    raiz.querySelectorAll('.secao .faixa').forEach((el) => preparar(el, 'up', 0, 620));
    raiz.querySelectorAll('.secao .secao-titulo').forEach((el) => preparar(el, 'up', 55, 720));
    raiz.querySelectorAll('.secao .secao-sub').forEach((el) => preparar(el, 'up', 105, 720));
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
    prepararGrupo('#trilhoOfertas', '.cartao-oferta', 'up', 80, 5);
    prepararGrupo('#gradeCategorias', '.categoria', 'up', 70, 5);
    prepararGrupo('#gradeProdutos', '.produto', 'up', 65, 5);
    prepararGrupo('#novidadesGrid', '.novidade', 'up', 80, 4);
    prepararGrupo('#gradeDestaques', '.destaque', 'up', 80, 4);
    prepararGrupo('.grade-insta', '.insta-item', 'up', 65, 5);

    // Blocos maiores recebem direções discretamente diferentes.
    document.querySelectorAll('.sobre-img').forEach((el) => preparar(el, 'left', 0, 820));
    document.querySelectorAll('.sobre-conteudo').forEach((el) => preparar(el, 'right', 90, 820));
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

  const mutationObserver = new MutationObserver(() => {
    // Agrupa várias mutações do mesmo render em um único frame.
    requestAnimationFrame(prepararConteudo);
  });

  alvosDinamicos.forEach((seletor) => {
    const alvo = document.querySelector(seletor);
    if (alvo) mutationObserver.observe(alvo, { childList: true, subtree: true });
  });
}
