export const CHECKOUT_URL = "https://lastlink.com/p/C894C9A94/checkout-payment/";

export type Question = {
  id: string;
  title: string;
  eyebrow?: string;
  options: string[];
};

export const QUESTIONS: Question[] = [
  {
    id: "situacao",
    title: "Hoje, qual dessas situações mais combina com você?",
    options: [
      "Quero começar a vender perfumes, mas ainda não comecei",
      "Já pesquisei sobre perfumes árabes, mas não sei por onde começar",
      "Já vendo alguns produtos e quero adicionar perfumes árabes",
      "Já trabalho com perfumes e quero encontrar fornecedores melhores",
    ],
  },
  {
    id: "bloqueio",
    title: "O que mais está te impedindo de começar hoje?",
    options: [
      "Não sei onde encontrar fornecedores confiáveis",
      "Tenho medo de comprar produtos falsificados",
      "Não sei quais perfumes têm mais saída",
      "Acho que preciso de muito dinheiro para começar",
      "Não sei como conseguir os primeiros clientes",
    ],
  },
  {
    id: "investimento",
    title: "Quanto você imaginava que precisaria investir para começar a vender perfumes?",
    options: [
      "Menos de R$500",
      "Entre R$500 e R$1.000",
      "Entre R$1.000 e R$3.000",
      "Mais de R$3.000",
      "Não faço ideia",
    ],
  },
  {
    id: "canal",
    title: "Onde você gostaria de vender seus perfumes?",
    options: [
      "WhatsApp",
      "Instagram",
      "Mercado Livre / Shopee",
      "Para amigos, conhecidos e colegas de trabalho",
      "Loja física",
      "Quero vender em vários canais",
    ],
  },
  {
    id: "meta",
    eyebrow: "Você está quase lá...",
    title: "Qual seria sua principal meta vendendo perfumes árabes?",
    options: [
      "Fazer uma renda extra todo mês",
      "Criar meu próprio negócio",
      "Complementar minha renda atual",
      "Viver exclusivamente das vendas",
      "Adicionar uma nova linha de produtos ao meu negócio",
    ],
  },
  {
    id: "facilidade",
    title:
      "Se você tivesse acesso aos contatos de fornecedores já organizados, isso facilitaria seu começo?",
    options: [
      "Sim, muito",
      "Com certeza, essa é minha maior dificuldade",
      "Sim, porque economizaria muito tempo pesquisando",
      "Já tenho fornecedor, mas gostaria de conhecer outros",
    ],
  },
  {
    id: "criterio",
    title: "O que seria mais importante para você ao escolher um fornecedor?",
    options: [
      "Preço baixo para ter uma boa margem",
      "Produtos originais e procedência confiável",
      "Variedade de perfumes",
      "Possibilidade de começar comprando poucas unidades",
      "Entrega rápida",
    ],
  },
  {
    id: "prazo",
    title:
      "Se você descobrisse uma forma mais simples de começar, quando gostaria de colocar isso em prática?",
    options: [
      "Ainda esta semana",
      "Nos próximos 15 dias",
      "Dentro de 1 mês",
      "Estou apenas pesquisando por enquanto",
    ],
  },
];

/** Índice da pergunta após a qual entra a tela de quebra de padrão. */
export const BREAK_AFTER_INDEX = 4;

export type Answers = Record<string, string>;

/** Texto personalizado no resultado, baseado no principal bloqueio. */
export function personalizedInsight(answers: Answers): string {
  switch (answers["bloqueio"]) {
    case "Não sei onde encontrar fornecedores confiáveis":
      return "Sua principal dificuldade hoje é encontrar fornecedores — exatamente uma das etapas que este material pretende simplificar.";
    case "Tenho medo de comprar produtos falsificados":
      return "Sua principal preocupação é procedência. Por isso, pesquisar e avaliar corretamente cada fornecedor antes da compra é fundamental.";
    case "Acho que preciso de muito dinheiro para começar":
      return "Você acredita que precisa de um investimento alto para começar. Porém, uma estratégia inicial pode ser começar menor e validar a demanda antes de aumentar o estoque.";
    case "Não sei quais perfumes têm mais saída":
      return "Sua dúvida principal é sobre quais perfumes escolher. Entender o que já tem procura evita dinheiro parado em produtos errados.";
    case "Não sei como conseguir os primeiros clientes":
      return "Sua dúvida principal é sobre as primeiras vendas. Começar pelos canais que você já usa costuma ser o caminho mais simples.";
    default:
      return "Pelas suas respostas, organizar a etapa de fornecedores é o passo que mais pode simplificar o seu começo.";
  }
}

export function channelLine(answers: Answers): string {
  const canal = answers["canal"];
  if (!canal) return "Você pode começar utilizando canais que já possui, como WhatsApp e Instagram";
  if (canal === "Quero vender em vários canais")
    return "Você pretende vender em vários canais ao mesmo tempo — começar por um deles costuma ser mais simples";
  if (canal === "Loja física")
    return "Você pretende vender em loja física, e a escolha do fornecedor pesa ainda mais nesse formato";
  return `Você pode começar utilizando um canal que já conhece: ${canal}`;
}
