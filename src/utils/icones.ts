export const BANCOS_POPULARES = [
  'Banco do Brasil',
  'Bradesco',
  'Caixa Economica Federal',
  'Itau',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'BTG Pactual',
  'Banco Safra',
  'Sicoob',
  'Sicredi',
  'Banrisul',
  'Banco Original',
  'Next',
  'PicPay Bank',
  'Mercado Pago',
  'PagBank',
  'Neon',
  'Will Bank',
  'Banco PAN',
  'Banco BMG',
  'Banco BV',
  'Banco Daycoval',
  'Banco Votorantim',
  'Banco Modal',
  'Banco Sofisa',
  'Banco Pine',
  'Banco Rendimento',
  'Banco Mercantil do Brasil',
  'Banco Cetelem',
  'Banco BS2',
  'Banco Alfa',
  'Banco Fibra',
  'Banco Topazio',
  'Banco ABC Brasil',
  'Banco Master',
  'Banco Voiter',
  'Banco Agibank',
  'Banco Digio',
  'Banco Omni',
  'Banco Volkswagen',
  'Banco Toyota',
  'Banco Honda',
  'Banco John Deere',
  'Banco CNH Industrial',
  'Banco GM',
  'Banco Mercedes-Benz',
  'Banco Caterpillar',
  'Banco da Amazonia',
  'Banco do Nordeste',
  'BRB',
  'Bancoob',
  'Stone',
  'Ailos',
  'Unicred',
  'Credicoamo',
  'Credisis',
  'Cresol',
  'Asaas Money',
  'XP',
  'Genial Investimentos',
  'Rico',
  'Clear',
  'Orama',
  'Avenue',
  'Nomad',
  'Wise',
  'Revolut',
  'PayPal',
  'RecargaPay',
  '99Pay',
  'Ame Digital',
  'Superdigital',
  'Conta Simples',
  'Cora',
  'PJBank',
  'Banco Inter Empresas',
  'Nubank PJ',
  'Iti',
  'Jeitto',
  'SumUp Bank',
  'InfinitePay',
  'CloudWalk',
  'Creditas',
  'Banco KDB',
  'Banco Tricury',
  'Banco BNI Brasil',
  'Banco Paulista',
  'Banco Guanabara',
  'Banco Luso Brasileiro',
  'Banco Fator',
  'Banco Rabobank',
  'Banco MUFG',
  'Banco Mizuho',
  'Banco Sumitomo Mitsui',
  'Deutsche Bank',
  'Citibank',
  'HSBC',
  'JPMorgan Chase',
  'Bank of America',
  'BNP Paribas',
  'Credit Suisse',
] as const;

export const BANDEIRAS_CARTAO_POPULARES = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Hiper',
  'Cabal',
  'Diners Club',
  'Discover',
  'Aura',
  'JCB',
  'UnionPay',
  'Maestro',
  'Sorocred',
  'Banescard',
  'Alelo',
  'VR',
  'Ticket',
  'Sodexo',
  'Pix Card',
] as const;

export function obterBandeiraIdioma(idioma: string): string {
  const codigo = (idioma || '').toLowerCase();
  if (codigo.startsWith('pt')) return '\uD83C\uDDE7\uD83C\uDDF7';
  if (codigo.startsWith('en')) return '\uD83C\uDDFA\uD83C\uDDF8';
  if (codigo.startsWith('es')) return '\uD83C\uDDEA\uD83C\uDDF8';
  return '\uD83C\uDF10';
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
