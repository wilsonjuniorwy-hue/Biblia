import type { VerseRef } from './topics';

/**
 * Devocionais (conteúdo original do app). A leitura bíblica NÃO é copiada aqui:
 * guardamos só a referência e o texto vem da tradução escolhida pela pessoa.
 */
export interface Devotional {
  id: string;
  title: string;
  /** Passagem que será lida (livro 0-based, como em BOOKS). */
  ref: VerseRef;
  /** Reflexão, um parágrafo por item. */
  paragraphs: string[];
  /** Pergunta para pensar ao longo do dia. */
  question: string;
  /** Oração final. */
  prayer: string;
}

export const DEVOTIONALS: Devotional[] = [
  {
    id: 'pastor-sl23',
    title: 'O Senhor é o meu Pastor',
    ref: { book: 18, chapter: 23, from: 1, to: 6 },
    paragraphs: [
      'Davi conhecia de perto o ofício de pastor. Antes de ser rei, passou anos no campo cuidando de ovelhas, e quem faz isso aprende rápido como elas são: frágeis, assustadiças, incapazes de achar água sozinhas ou de se defender de um lobo. Uma ovelha depende por inteiro de quem a conduz. Quando Davi escreve “O Senhor é o meu pastor”, ele não está se elogiando. Está admitindo, sem vergonha, que precisa de cuidado, e dizendo em quem confia para recebê-lo.',
      'A frase seguinte, “nada me faltará”, merece cuidado. Ela não promete uma vida sem dificuldades, nem que teremos tudo o que desejamos. Diz algo mais profundo: debaixo do cuidado do Pastor, nada de essencial nos será negado. Os pastos verdes e as águas quietas falam de descanso e de provisão. E repare quem faz o quê: é o Pastor quem faz a ovelha deitar, quem a leva, quem a guia. Muitas vezes não sabemos parar sozinhos. Há descansos que não são preguiça, são presentes de Deus.',
      'Então chega o vale da sombra da morte, e o salmo não finge que ele não existe. Existem dias de dor, de perda, de medo, de diagnósticos e de silêncios difíceis. Mas observe uma mudança no texto. Até o versículo 3, Davi fala sobre o Senhor: “ele me faz deitar, ele me guia”. A partir do versículo 4, passa a falar com o Senhor: “tu estás comigo”. É justamente no vale que o salmo deixa de ser uma descrição e vira uma conversa. O Pastor não promete nos poupar do vale; promete atravessá-lo ao nosso lado. A vara e o cajado, usados para proteger e para dirigir, lembram que ninguém ali caminha sem guia.',
      'O final do salmo abre a cena. Há uma mesa preparada à vista dos adversários, a cabeça ungida, o cálice transbordando. E, em vez de sermos perseguidos pelos problemas, somos seguidos pelo bem e pela bondade, todos os dias, até chegarmos à casa do Senhor. O Pastor do início é o anfitrião do fim: quem cuida de nós no caminho também nos espera em casa.',
      'Talvez hoje você esteja num pasto verde, agradecido. Talvez esteja no vale. Nos dois lugares o convite é o mesmo: reconhecer quem é o Pastor e deixar-se conduzir. Você não precisa ter todas as respostas, basta confiar em quem conhece o caminho. Reserve alguns minutos hoje, escolha uma preocupação que vem pesando e entregue-a em oração. Se ela voltar durante o dia, repita baixinho a frase do versículo 4: “tu estás comigo”.',
    ],
    question: 'Em que parte da sua vida você tem tentado ser o próprio pastor, carregando sozinho algo que poderia entregar ao cuidado de Deus?',
    prayer: 'Senhor, tu és o meu Pastor. Reconheço que sozinho eu me canso, me assusto e me perco. Conduz-me hoje aos lugares de descanso e dá-me coragem nos vales. Quando o medo vier, lembra-me de que tu estás comigo. Ensina-me a confiar no teu cuidado e a seguir a tua voz, um passo de cada vez. Amém.',
  },
];

/** Devocional do dia: percorre a lista em ciclo (dayIndex = dia do ano). */
export function devotionalOfTheDay(dayIndex: number): Devotional {
  return DEVOTIONALS[((dayIndex % DEVOTIONALS.length) + DEVOTIONALS.length) % DEVOTIONALS.length];
}

/** Minutos aproximados de leitura (≈ 180 palavras por minuto), mínimo 1. */
export function devotionalMinutes(d: Devotional): number {
  const words = [d.title, ...d.paragraphs, d.question, d.prayer].join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}
