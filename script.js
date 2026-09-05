/* ====================================================================
   ATÍPICOS FRIOS — script.js
   JavaScript puro, sem dependências.
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracoes();
  configurarMenuMobile();
  configurarCarrossel();
  configurarAnoRodape();
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
        return cfg.whatsappPedido || cfg.whatsappGrupoOfertas || '#';
      case 'whatsappGrupoOfertas':
        return cfg.whatsappGrupoOfertas || '#';
      case 'instagram':
        return cfg.instagram || '#';
      case 'ifoodUrl':
        return cfg.ifoodUrl || '#';
      case 'mapaLinkExterno':
        return cfg.mapaLinkExterno || '#';
      default:
        return '#';
    }
  };

  document.querySelectorAll('[data-link]').forEach((el) => {
    const chave = el.getAttribute('data-link');
    const url = linkPara(chave);
    if (url && url !== '#') {
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }
  });

  document.querySelectorAll('[data-text]').forEach((el) => {
    const chave = el.getAttribute('data-text');
    if (cfg[chave]) el.textContent = cfg[chave];
  });

  // Botão do iFood só aparece se houver link configurado
  const botaoIfood = document.getElementById('botaoIfood');
  if (botaoIfood) {
    botaoIfood.style.display = cfg.ifoodUrl ? 'inline-flex' : 'none';
  }

  // Endereço
  const enderecoTexto = document.getElementById('enderecoTexto');
  if (enderecoTexto) {
    const e = cfg.endereco || {};
    const partes = [e.rua, e.bairro, `${e.cidade || 'Gravatá'} – ${e.estado || 'PE'}`, e.cep]
      .filter((p) => p && p.trim() !== '');
    enderecoTexto.textContent = partes.length > 1
      ? partes.join(', ')
      : `${e.cidade || 'Gravatá'} – ${e.estado || 'PE'} (endereço completo em breve)`;
  }

  // Telefone
  const telefoneTexto = document.getElementById('telefoneTexto');
  if (telefoneTexto) {
    telefoneTexto.textContent = cfg.telefone && cfg.telefone.trim() !== ''
      ? cfg.telefone
      : 'Em breve — chame no WhatsApp';
  }

  // Mapa
  const mapaLoja = document.getElementById('mapaLoja');
  if (mapaLoja && cfg.mapaEmbedUrl) {
    mapaLoja.src = cfg.mapaEmbedUrl;
  }

  // Horários
  montarHorarios(cfg.horarios || {});
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
    const destaque = chave === hojeChave ? ' hoje' : '';
    return { chave, texto: `${nomes[chave]}: ${valor}`, destaque };
  });

  if (listaHorarios) {
    listaHorarios.innerHTML = linhas
      .map((l) => `<div class="${l.destaque}"><span>${nomes[l.chave]}</span><span>${horarios[l.chave] && horarios[l.chave].trim() !== '' ? horarios[l.chave] : 'Fechado'}</span></div>`)
      .join('');
  }

  if (footerHorarios) {
    footerHorarios.innerHTML = linhas
      .slice(1, 6) // seg a sex, resumido no rodapé
      .map((l) => `<li>${l.texto}</li>`)
      .join('');
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
  };

  botao.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', String(aberto));
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', fechar));
}

/* ---------------------------------------------------------------
   Carrossel de ofertas (setas de navegação no desktop)
--------------------------------------------------------------- */
function configurarCarrossel() {
  const trilho = document.getElementById('trilhoOfertas');
  const setaEsq = document.getElementById('setaEsq');
  const setaDir = document.getElementById('setaDir');
  if (!trilho || !setaEsq || !setaDir) return;

  const distancia = 230;
  setaEsq.addEventListener('click', () => trilho.scrollBy({ left: -distancia, behavior: 'smooth' }));
  setaDir.addEventListener('click', () => trilho.scrollBy({ left: distancia, behavior: 'smooth' }));
}

/* ---------------------------------------------------------------
   Ano atual no rodapé
--------------------------------------------------------------- */
function configurarAnoRodape() {
  const ano = document.getElementById('anoAtual');
  if (ano) ano.textContent = new Date().getFullYear();
}
