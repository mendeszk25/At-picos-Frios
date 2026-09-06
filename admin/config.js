/*
  ====================================================================
  CONFIGURAÇÕES DA LOJA — ATÍPICOS FRIOS
  ====================================================================
  Edite apenas o objeto CONFIG abaixo para atualizar o site.
  Não é necessário mexer em nenhum outro arquivo.

  Campos com "" (vazio) ainda não têm informação confirmada —
  preencha assim que tiver o dado oficial da loja.
  ====================================================================
*/

const CONFIG = {
  whatsapp: "",           // Ex.: "https://wa.me/5581999999999"
  ifood: "",              // Ex.: "https://www.ifood.com.br/delivery/..."
  instagram: "https://www.instagram.com/atipicosfrios/",
  endereco: "",           // Ex.: "Rua Example, 123 – Gravatá, PE"
  horario: "",            // Ex.: "Seg–Sex: 07h–19h | Sáb: 07h–17h"

};

/* ====================================================================
   CONFIGURAÇÕES DETALHADAS (alimentam o restante do site)
   ==================================================================== */
const BUSINESS_CONFIG = {

  // Identidade
  nome: "Atípicos Frios",
  slogan: "Sabor que une, qualidade que faz a diferença",
  cidade: "Gravatá – PE",

  // Contato
  telefone: CONFIG.whatsapp ? CONFIG.whatsapp.replace('https://wa.me/55', '') : "",
  whatsappPedido: CONFIG.whatsapp || "",
  whatsappGrupoOfertas: "https://chat.whatsapp.com/CsxujaYZeei1YS45ipOG",

  // Endereço
  endereco: {
    rua: CONFIG.endereco || "",
    bairro: "",
    cidade: "Gravatá",
    estado: "PE",
    cep: "",
  },

  // Mapa da localização enviada pelo cliente
  mapaEmbedUrl: "https://www.google.com/maps?q=R.%20Quinze%20de%20Novembro%2C%20720%20-%20Nossa%20Senhora%20das%20Gra%C3%A7as%2C%20Gravat%C3%A1%20-%20PE%2C%2055642-550&z=18&output=embed",
  mapaLinkExterno: "https://maps.app.goo.gl/yqav9G48ntngmjQ38",

  // Delivery / iFood
  ifoodUrl: CONFIG.ifood || "",
  fazDelivery: true,

  // Redes sociais
  instagram: CONFIG.instagram || "",
  instagramHandle: "@atipicosfrios",

  // Horário de funcionamento
  horarios: {
    segunda: "07:00 – 19:00",
    terca: "07:00 – 19:00",
    quarta: "07:00 – 19:00",
    quinta: "07:00 – 19:00",
    sexta: "07:00 – 19:00",
    sabado: "07:00 – 17:00",
    domingo: "",
  },

};
