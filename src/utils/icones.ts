import type { ImageSourcePropType } from 'react-native';

export const BANCOS_POPULARES = [
  'Abc Brasil',
  'Ailos',
  'Asaas IP S A',
  'Banco Arbi',
  'Banco Bmg',
  'Banco Bmp',
  'Banco BS2',
  'Banco BV',
  'Banco da Amazonia',
  'Banco Daycoval',
  'Banco de Brasilia',
  'Banco do Brasil',
  'Banco do Estado do Espirito Santo',
  'Banco do Estado do Para',
  'Banco do Estado do Sergipe',
  'Banco do Nordeste',
  'Banco Industrial do Brasil',
  'Banco Mercantil do Brasil',
  'Banco MUFG',
  'Banco Original',
  'Banco Paulista',
  'Banco Pine',
  'Banco Rendimento',
  'Banco Safra',
  'Banco Sofisa',
  'Banco Topazio',
  'Banco Triangulo',
  'Banco Votorantim',
  'Banese',
  'Banestes',
  'Bank of America',
  'Banpara',
  'Banrisul',
  'BASA',
  'Bees Bank',
  'Bib',
  'BK Bank',
  'BNB',
  'BNP Paribas',
  'Bradesco',
  'BRB',
  'Btg Pactual',
  'BV',
  'C6 Bank',
  'Caixa Economica Federal',
  'Capitual',
  'Conta Simples',
  'Contbank',
  'Cora',
  'Credisis',
  'Cresol',
  'Duepay',
  'Efi Bank',
  'Grafeno',
  'Ifood Pago',
  'Infinitepay',
  'Inter',
  'IP4Y',
  'Itau',
  'Iugo',
  'Lets Bank',
  'Linker',
  'Magalupay',
  'Mercado Pago',
  'Mercantil do Brasil',
  'Modobank',
  'MUFG',
  'Multiplo Bank',
  'Neon',
  'Nubank',
  'Omie Cash',
  'Omni',
  'Pagbank',
  'Paycash',
  'Picpay',
  'Pinbank',
  'Quality Digital Bank',
  'Recargapay',
  'Santander',
  'Sicoob',
  'Sicredi',
  'Sisprime',
  'Squid Solucoes Financeiras',
  'Starbank',
  'Stone',
  'Sulcredi',
  'Transfera',
  'Tribanco',
  'Unicred',
  'Uniprime',
  'XP',
] as const;

export const BANDEIRAS_CARTAO_POPULARES = [
  'Alipay',
  'American Express',
  'Diners',
  'Discover',
  'Elo',
  'Generic Card',
  'Hiper',
  'Hipercard',
  'JCB',
  'Maestro',
  'Mastercard',
  'MIR',
  'PayPal',
  'UnionPay',
  'Visa',
] as const;

const FONTES_ICONES_BANCOS: Record<string, () => ImageSourcePropType> = {
  'abc-brasil': () => require('../../assets/images/bancos/abc-brasil.png'),
  'ailos': () => require('../../assets/images/bancos/ailos.png'),
  'asaas-ip-s-a': () => require('../../assets/images/bancos/asaas-ip-s-a.png'),
  'banco-arbi': () => require('../../assets/images/bancos/banco-arbi.png'),
  'banco-bmg': () => require('../../assets/images/bancos/banco-bmg.png'),
  'banco-bmp': () => require('../../assets/images/bancos/banco-bmp.png'),
  'banco-bs2': () => require('../../assets/images/bancos/banco-bs2.png'),
  'banco-bv': () => require('../../assets/images/bancos/banco-bv.png'),
  'banco-da-amazonia': () => require('../../assets/images/bancos/banco-da-amazonia.png'),
  'banco-daycoval': () => require('../../assets/images/bancos/banco-daycoval.png'),
  'banco-de-brasilia': () => require('../../assets/images/bancos/banco-de-brasilia.png'),
  'banco-do-brasil': () => require('../../assets/images/bancos/banco-do-brasil.png'),
  'banco-do-estado-do-espirito-santo': () => require('../../assets/images/bancos/banco-do-estado-do-espirito-santo.png'),
  'banco-do-estado-do-para': () => require('../../assets/images/bancos/banco-do-estado-do-para.png'),
  'banco-do-estado-do-sergipe': () => require('../../assets/images/bancos/banco-do-estado-do-sergipe.png'),
  'banco-do-nordeste': () => require('../../assets/images/bancos/banco-do-nordeste.png'),
  'banco-industrial-do-brasil': () => require('../../assets/images/bancos/banco-industrial-do-brasil.png'),
  'banco-mercantil-do-brasil': () => require('../../assets/images/bancos/banco-mercantil-do-brasil.png'),
  'banco-mufg': () => require('../../assets/images/bancos/banco-mufg.png'),
  'banco-original': () => require('../../assets/images/bancos/banco-original.png'),
  'banco-paulista': () => require('../../assets/images/bancos/banco-paulista.png'),
  'banco-pine': () => require('../../assets/images/bancos/banco-pine.png'),
  'banco-rendimento': () => require('../../assets/images/bancos/banco-rendimento.png'),
  'banco-safra': () => require('../../assets/images/bancos/banco-safra.png'),
  'banco-sofisa': () => require('../../assets/images/bancos/banco-sofisa.png'),
  'banco-topazio': () => require('../../assets/images/bancos/banco-topazio.png'),
  'banco-triangulo': () => require('../../assets/images/bancos/banco-triangulo.png'),
  'banco-votorantim': () => require('../../assets/images/bancos/banco-votorantim.png'),
  'banese': () => require('../../assets/images/bancos/banese.png'),
  'banestes': () => require('../../assets/images/bancos/banestes.png'),
  'bank-of-america': () => require('../../assets/images/bancos/bank-of-america.png'),
  'banpara': () => require('../../assets/images/bancos/banpara.png'),
  'banrisul': () => require('../../assets/images/bancos/banrisul.png'),
  'basa': () => require('../../assets/images/bancos/basa.png'),
  'bees-bank': () => require('../../assets/images/bancos/bees-bank.png'),
  'bib': () => require('../../assets/images/bancos/bib.png'),
  'bk-bank': () => require('../../assets/images/bancos/bk-bank.png'),
  'bnb': () => require('../../assets/images/bancos/bnb.png'),
  'bnp-paribas': () => require('../../assets/images/bancos/bnp-paribas.png'),
  'bradesco': () => require('../../assets/images/bancos/bradesco.png'),
  'brb': () => require('../../assets/images/bancos/brb.png'),
  'btg-pactual': () => require('../../assets/images/bancos/btg-pactual.png'),
  'bv': () => require('../../assets/images/bancos/bv.png'),
  'c6-bank': () => require('../../assets/images/bancos/c6-bank.png'),
  'caixa-economica-federal': () => require('../../assets/images/bancos/caixa-economica-federal.png'),
  'capitual': () => require('../../assets/images/bancos/capitual.png'),
  'conta-simples': () => require('../../assets/images/bancos/conta-simples.png'),
  'contbank': () => require('../../assets/images/bancos/contbank.png'),
  'cora': () => require('../../assets/images/bancos/cora.png'),
  'credisis': () => require('../../assets/images/bancos/credisis.png'),
  'cresol': () => require('../../assets/images/bancos/cresol.png'),
  'duepay': () => require('../../assets/images/bancos/duepay.png'),
  'efi-bank': () => require('../../assets/images/bancos/efi-bank.png'),
  'grafeno': () => require('../../assets/images/bancos/grafeno.png'),
  'ifood-pago': () => require('../../assets/images/bancos/ifood-pago.png'),
  'infinitepay': () => require('../../assets/images/bancos/infinitepay.png'),
  'inter': () => require('../../assets/images/bancos/inter.png'),
  'ip4y': () => require('../../assets/images/bancos/ip4y.png'),
  'itau': () => require('../../assets/images/bancos/itau.png'),
  'iugo': () => require('../../assets/images/bancos/iugo.png'),
  'lets-bank': () => require('../../assets/images/bancos/lets-bank.png'),
  'linker': () => require('../../assets/images/bancos/linker.png'),
  'magalupay': () => require('../../assets/images/bancos/magalupay.png'),
  'mercado-pago': () => require('../../assets/images/bancos/mercado-pago.png'),
  'mercantil-do-brasil': () => require('../../assets/images/bancos/mercantil-do-brasil.png'),
  'modobank': () => require('../../assets/images/bancos/modobank.png'),
  'mufg': () => require('../../assets/images/bancos/mufg.png'),
  'multiplo-bank': () => require('../../assets/images/bancos/multiplo-bank.png'),
  'neon': () => require('../../assets/images/bancos/neon.png'),
  'nubank': () => require('../../assets/images/bancos/nubank.png'),
  'omie-cash': () => require('../../assets/images/bancos/omie-cash.png'),
  'omni': () => require('../../assets/images/bancos/omni.png'),
  'pagbank': () => require('../../assets/images/bancos/pagbank.png'),
  'paycash': () => require('../../assets/images/bancos/paycash.png'),
  'picpay': () => require('../../assets/images/bancos/picpay.png'),
  'pinbank': () => require('../../assets/images/bancos/pinbank.png'),
  'quality-digital-bank': () => require('../../assets/images/bancos/quality-digital-bank.png'),
  'recargapay': () => require('../../assets/images/bancos/recargapay.png'),
  'santander': () => require('../../assets/images/bancos/santander.png'),
  'sicoob': () => require('../../assets/images/bancos/sicoob.png'),
  'sicredi': () => require('../../assets/images/bancos/sicredi.png'),
  'sisprime': () => require('../../assets/images/bancos/sisprime.png'),
  'squid-solucoes-financeiras': () => require('../../assets/images/bancos/squid-solucoes-financeiras.png'),
  'starbank': () => require('../../assets/images/bancos/starbank.png'),
  'stone': () => require('../../assets/images/bancos/stone.png'),
  'sulcredi': () => require('../../assets/images/bancos/sulcredi.png'),
  'transfera': () => require('../../assets/images/bancos/transfera.png'),
  'tribanco': () => require('../../assets/images/bancos/tribanco.png'),
  'unicred': () => require('../../assets/images/bancos/unicred.png'),
  'uniprime': () => require('../../assets/images/bancos/uniprime.png'),
  'xp': () => require('../../assets/images/bancos/xp.png'),
};

const FONTES_ICONES_BANDEIRAS: Record<string, () => ImageSourcePropType> = {
  'alipay': () => require('../../assets/images/bandeiras-cartoes/alipay.png'),
  'american-express': () => require('../../assets/images/bandeiras-cartoes/american-express.png'),
  'diners': () => require('../../assets/images/bandeiras-cartoes/diners.png'),
  'discover': () => require('../../assets/images/bandeiras-cartoes/discover.png'),
  'elo': () => require('../../assets/images/bandeiras-cartoes/elo.png'),
  'generic-card': () => require('../../assets/images/bandeiras-cartoes/generic-card.png'),
  'hiper': () => require('../../assets/images/bandeiras-cartoes/hiper.png'),
  'hipercard': () => require('../../assets/images/bandeiras-cartoes/hipercard.png'),
  'jcb': () => require('../../assets/images/bandeiras-cartoes/jcb.png'),
  'maestro': () => require('../../assets/images/bandeiras-cartoes/maestro.png'),
  'mastercard': () => require('../../assets/images/bandeiras-cartoes/mastercard.png'),
  'mir': () => require('../../assets/images/bandeiras-cartoes/mir.png'),
  'paypal': () => require('../../assets/images/bandeiras-cartoes/paypal.png'),
  'unionpay': () => require('../../assets/images/bandeiras-cartoes/unionpay.png'),
  'visa': () => require('../../assets/images/bandeiras-cartoes/visa.png'),
};

const ALIAS_CHAVES_BANCOS: Record<string, string> = {
  bb: 'banco-do-brasil',
  'banco-do-brasil-sa': 'banco-do-brasil',
  'banco-do-nordeste': 'banco-do-nordeste-do-brasil-s-a',
  'banco-da-amazonia': 'banco-da-amazonia-s-a',
  'banco-de-brasilia': 'brb-banco-de-brasilia',
  'banco-mercantil-do-brasil': 'banco-mercantil-do-brasil-s-a',
  'banco-bs2': 'banco-bs2-s-a',
  'banco-btg-pactual': 'banco-btg-pacutal',
  'btg-pactual': 'banco-btg-pacutal',
  btg: 'banco-btg-pacutal',
  'banco-c6': 'banco-c6-s-a',
  'banco-inter-empresas': 'banco-inter-s-a',
  'banco-mufg': 'mufg',
  'conta-simples': 'conta-simples-solucoes-em-pagamentos',
  cora: 'cora-sociedade-credito-direto-s-a',
  'banco-triangulo': 'banco-triangulo-tribanco',
  tribanco: 'banco-triangulo-tribanco',
  xp: 'xp-investimentos',
  'bnp-paribas': 'bnp-paripas',
  'brb-banco-de-brasilia': 'brb',
};

const ALIAS_CHAVES_BANDEIRAS: Record<string, string> = {
  amex: 'american-express',
};

function normalizarChaveIcone(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['`]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function obterChaveBanco(banco: string): string {
  const normalizado = normalizarChaveIcone((banco || '').trim());
  const chaveAlias = ALIAS_CHAVES_BANCOS[normalizado] ?? normalizado;
  if (FONTES_ICONES_BANCOS[chaveAlias]) return chaveAlias;

  const semPrefixoBanco = chaveAlias.replace(/^banco-/, '');
  const candidatos = [
    chaveAlias,
    semPrefixoBanco,
    `banco-${semPrefixoBanco}`,
    `${chaveAlias}-s-a`,
    `${semPrefixoBanco}-s-a`,
    `banco-${semPrefixoBanco}-s-a`,
  ];
  for (const candidato of candidatos) {
    if (FONTES_ICONES_BANCOS[candidato]) return candidato;
  }

  if (chaveAlias.includes('santander')) return 'santander';
  if (chaveAlias.includes('bradesco')) return 'bradesco';
  if (chaveAlias.includes('itau')) return 'itau';
  if (chaveAlias.includes('nubank')) return 'nubank';
  if (chaveAlias.includes('inter')) return 'inter';
  if (chaveAlias.includes('mercado-pago')) return 'mercado-pago';
  if (chaveAlias.includes('pagbank')) return 'pagbank';
  if (chaveAlias.includes('picpay')) return 'picpay';
  if (chaveAlias.includes('caixa')) return 'caixa-economica-federal';
  if (chaveAlias.includes('sicoob')) return 'sicoob';
  if (chaveAlias.includes('sicredi')) return 'sicredi';
  if (chaveAlias.includes('banrisul')) return 'banrisul';
  if (chaveAlias.includes('brb')) return 'brb';
  if (chaveAlias.includes('safra')) return 'banco-safra';
  if (chaveAlias.includes('bs2')) return 'banco-bs2-s-a';
  if (chaveAlias.includes('votorantim')) return 'banco-votorantim';
  if (chaveAlias.includes('daycoval')) return 'banco-daycoval';
  if (chaveAlias.includes('sofisa')) return 'banco-sofisa';
  if (chaveAlias.includes('pine')) return 'banco-pine';
  if (chaveAlias.includes('rendimento')) return 'banco-rendimento';
  if (chaveAlias.includes('mufg')) return 'mufg';
  if (chaveAlias.includes('xp')) return 'xp-investimentos';
  if (chaveAlias.includes('conta-simples')) return 'conta-simples-solucoes-em-pagamentos';
  if (chaveAlias.includes('cora')) return 'cora-sociedade-credito-direto-s-a';
  if (chaveAlias.includes('nordeste')) return 'banco-do-nordeste-do-brasil-s-a';
  if (chaveAlias.includes('amazonia')) return 'banco-da-amazonia-s-a';

  return chaveAlias;
}

function obterChaveBandeiraCartao(bandeira: string): string {
  const normalizado = normalizarChaveIcone((bandeira || '').trim());
  return ALIAS_CHAVES_BANDEIRAS[normalizado] ?? normalizado;
}

function formatarNomeBancoPorChave(chave: string): string {
  const palavrasMinusculas = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em']);
  const siglas = new Map<string, string>([
    ['sa', 'S.A.'],
    ['s', 'S'],
    ['a', 'A'],
    ['brb', 'BRB'],
    ['xp', 'XP'],
    ['c6', 'C6'],
    ['bb', 'BB'],
    ['bk', 'BK'],
    ['ip', 'IP'],
  ]);

  return chave
    .split('-')
    .map((parte, indice) => {
      if (siglas.has(parte)) return siglas.get(parte) as string;
      if (indice > 0 && palavrasMinusculas.has(parte)) return parte;
      return parte.charAt(0).toUpperCase() + parte.slice(1);
    })
    .join(' ');
}

export function obterOpcoesBancos(): string[] {
  const opcoes = new Map<string, string>();

  for (const banco of BANCOS_POPULARES) {
    opcoes.set(obterChaveBanco(banco), banco);
  }

  const chavesComImagem = Object.keys(FONTES_ICONES_BANCOS).sort((a, b) => a.localeCompare(b));
  for (const chave of chavesComImagem) {
    if (!opcoes.has(chave)) {
      opcoes.set(chave, formatarNomeBancoPorChave(chave));
    }
  }

  return [...opcoes.values()];
}

function formatarNomeBandeiraPorChave(chave: string): string {
  const siglas = new Map<string, string>([
    ['jcb', 'JCB'],
    ['mir', 'MIR'],
  ]);

  return chave
    .split('-')
    .map((parte) => {
      if (siglas.has(parte)) return siglas.get(parte) as string;
      if (parte === 'paypal') return 'PayPal';
      if (parte === 'unionpay') return 'UnionPay';
      return parte.charAt(0).toUpperCase() + parte.slice(1);
    })
    .join(' ');
}

export function obterOpcoesBandeirasCartao(): string[] {
  const opcoes = new Map<string, string>();

  for (const bandeira of BANDEIRAS_CARTAO_POPULARES) {
    opcoes.set(obterChaveBandeiraCartao(bandeira), bandeira);
  }

  const chavesComImagem = Object.keys(FONTES_ICONES_BANDEIRAS).sort((a, b) => a.localeCompare(b));
  for (const chave of chavesComImagem) {
    if (!opcoes.has(chave)) {
      opcoes.set(chave, formatarNomeBandeiraPorChave(chave));
    }
  }

  return [...opcoes.values()];
}

export function obterBandeiraIdioma(idioma: string): string {
  const codigo = (idioma || '').toLowerCase();
  if (codigo.startsWith('pt')) return '\uD83C\uDDE7\uD83C\uDDF7';
  if (codigo.startsWith('en')) return '\uD83C\uDDFA\uD83C\uDDF8';
  if (codigo.startsWith('es')) return '\uD83C\uDDEA\uD83C\uDDF8';
  return '\uD83C\uDF10';
}

export function obterImagemBanco(banco: string): ImageSourcePropType | undefined {
  const chave = obterChaveBanco(banco);
  const resolverFonte = FONTES_ICONES_BANCOS[chave];
  if (!resolverFonte) return undefined;
  try {
    return resolverFonte();
  } catch {
    return undefined;
  }
}

export function obterImagemBandeiraCartao(bandeira: string): ImageSourcePropType | undefined {
  const chave = obterChaveBandeiraCartao(bandeira);
  const resolverFonte = FONTES_ICONES_BANDEIRAS[chave];
  if (!resolverFonte) return undefined;
  try {
    return resolverFonte();
  } catch {
    return undefined;
  }
}

export function obterIconeBandeiraCartao(bandeira: string): string {
  const valor = (bandeira || '').trim().toLowerCase();
  if (valor.includes('visa')) return '\uD83D\uDD35';
  if (valor.includes('master')) return '\uD83D\uDFE0';
  if (valor.includes('elo')) return '\uD83D\uDFE3';
  if (valor.includes('amex') || valor.includes('american')) return '\uD83D\uDFE6';
  if (valor.includes('hiper')) return '\uD83D\uDD34';
  if (valor.includes('discover')) return '\uD83D\uDFE1';
  if (valor.includes('diners')) return '\u26AB';
  if (valor.includes('cabal')) return '\uD83D\uDFE5';
  if (valor.includes('jcb')) return '\uD83D\uDFE9';
  if (valor.includes('unionpay')) return '\uD83D\uDFE2';
  if (valor.includes('maestro')) return '\u26AA';
  if (valor.includes('alelo')) return '\uD83D\uDFE9';
  if (valor.includes('vr')) return '\uD83D\uDFE2';
  if (valor.includes('ticket')) return '\uD83D\uDFE8';
  if (valor.includes('sodexo')) return '\uD83D\uDFE6';
  return '\uD83D\uDCB3';
}

export function obterIconeBanco(banco: string): string {
  const valor = (banco || '').trim().toLowerCase();
  if (valor.includes('itau')) return '\uD83D\uDFE7';
  if (valor.includes('nubank')) return '\uD83D\uDFEA';
  if (valor.includes('inter')) return '\uD83D\uDFE0';
  if (valor.includes('c6')) return '\u26AB';
  if (valor.includes('btg')) return '\uD83D\uDD35';
  if (valor.includes('santander')) return '\uD83D\uDD34';
  if (valor.includes('bradesco')) return '\uD83D\uDD34';
  if (valor.includes('caixa')) return '\uD83D\uDFE6';
  if (valor.includes('banco do brasil') || valor === 'bb') return '\uD83D\uDFE1';
  if (valor.includes('picpay')) return '\uD83D\uDFE9';
  if (valor.includes('mercado pago')) return '\uD83D\uDD35';
  if (valor.includes('pagbank')) return '\uD83D\uDFE2';
  if (valor.includes('neon')) return '\uD83D\uDFE6';
  if (valor.includes('will')) return '\uD83D\uDFE1';
  if (valor.includes('pan')) return '\uD83D\uDFE6';
  if (valor.includes('bmg')) return '\uD83D\uDFE0';
  if (valor.includes('bv')) return '\uD83D\uDFE0';
  if (valor.includes('original')) return '\uD83D\uDFE9';
  if (valor.includes('next')) return '\uD83D\uDFE9';
  if (valor.includes('sicoob')) return '\uD83D\uDFE2';
  if (valor.includes('sicredi')) return '\uD83D\uDFE2';
  if (valor.includes('banrisul')) return '\uD83D\uDD34';
  if (valor.includes('safra')) return '\uD83D\uDFE6';
  if (valor.includes('bs2')) return '\uD83D\uDFEA';
  if (valor.includes('xp')) return '\u26AA';
  if (valor.includes('genial')) return '\uD83D\uDFE3';
  if (valor.includes('wise')) return '\uD83D\uDFE9';
  if (valor.includes('revolut')) return '\u26AB';
  if (valor.includes('nomad')) return '\uD83D\uDFE8';
  if (valor.includes('paypal')) return '\uD83D\uDD35';
  if (valor.includes('99pay')) return '\uD83D\uDFE1';
  if (valor.includes('superdigital')) return '\uD83D\uDFE5';
  if (valor.includes('cora')) return '\uD83D\uDFEA';
  if (valor.includes('conta simples')) return '\uD83D\uDFE2';
  if (valor.includes('stone')) return '\uD83D\uDFE9';
  return '\uD83C\uDFE6';
}


