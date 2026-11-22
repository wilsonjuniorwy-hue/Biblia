import { parseVerseRef, type VerseRef } from './topics';

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
  {
    id: 'socorro-sl121',
    title: 'De onde vem o meu socorro?',
    ref: parseVerseRef('Sl 121:1-2'),
    paragraphs: [
      'Imagine uma família a caminho de Jerusalém, há mais de dois mil anos. A estrada sobe por montanhas, o sol castiga, o cansaço pesa e há perigos no caminho. Os Salmos 120 a 134 são chamados de cânticos de subida: eram cantados pelos peregrinos enquanto subiam rumo ao templo. O Salmo 121 é um deles, e começa com um gesto simples e humano: alguém levanta os olhos para os montes e pergunta de onde virá o seu socorro.',
      'Repare na honestidade dessa pergunta. O salmista não finge que está forte, nem diz que se vira sozinho. Ele reconhece que precisa de ajuda, e esse é muitas vezes o primeiro passo para recebê-la. Em muitos lugares daquele tempo, os montes eram ainda associados aos altares de deuses falsos, então a pergunta pode também ser lida assim: em quem eu vou confiar quando a subida ficar difícil? Será que a ajuda vem do que parece alto, grande e impressionante?',
      'A resposta vem sem rodeios: o meu socorro vem do Senhor, que fez o céu e a terra. Quem fez as montanhas é maior do que qualquer montanha. Isso muda a escala do problema. Aquilo que hoje parece enorme diante de você, seja uma conta, um diagnóstico, uma decisão ou uma relação quebrada, continua pequeno diante de Quem criou o céu e a terra. O salmo não diminui a dificuldade da subida, mas coloca a dificuldade no seu lugar.',
      'O salmo segue adiante e diz algo que consola de verdade: quem nos guarda não cochila nem dorme. Existe um cuidado que não tira folga. Nas noites em que o seu pensamento não descansa, há Alguém que continua acordado, e não precisa que você fique de vigia. Você pode orar e, mesmo sem ter resolvido nada, entregar o turno da noite.',
      'O salmo também lembra, mais adiante, que o Senhor é a sombra à nossa direita, uma imagem de proteção bem próxima, como alguém que caminha ao seu lado no calor do dia. Ele guarda a saída e a entrada, ou seja, o ir e o vir de cada dia: a ida ao trabalho, a volta para casa, as tarefas comuns. Nada da rotina escapa do olhar dele. Isso faz deste salmo uma boa oração para antes de sair de casa e também para a hora de fechar a porta à noite. O cuidado de Deus não está reservado só às grandes crises: ele acompanha também o ordinário.',
      'Hoje, vale se perguntar para onde você tem levantado os olhos primeiro. Para as redes sociais, para o saldo da conta, para a opinião das pessoas, para a sua própria força? Pedir ajuda a pessoas não é falta de fé, porque Deus costuma cuidar de nós também por meio de gente. Mas a fonte do socorro continua sendo o Senhor. Antes de começar a resolver o dia, levante os olhos em oração e repita devagar: o meu socorro vem do Senhor, que fez o céu e a terra.',
    ],
    question: 'Quando um problema aparece, para onde os seus olhos vão primeiro? O que mudaria se você levantasse os olhos para Deus antes de qualquer outra coisa?',
    prayer: 'Senhor, tu fizeste o céu e a terra e nada é grande demais para ti. Reconheço que preciso de ajuda e que muitas vezes procuro socorro nos lugares errados. Hoje levanto os meus olhos para ti. Guarda os meus passos na subida, descansa o meu coração e ensina-me a confiar que tu não dormes nem te cansas de cuidar de mim. Amém.',
  },
  {
    id: 'paz-fp4',
    title: 'A paz que guarda o coração',
    ref: parseVerseRef('Fp 4:6-7'),
    paragraphs: [
      'O apóstolo Paulo escreveu a carta aos Filipenses estando preso. Ele não estava em um lugar confortável, não sabia como terminaria o seu julgamento e, mesmo assim, a carta inteira respira alegria e confiança. É dessa cela que sai o convite que lemos hoje: não andem ansiosos por coisa alguma. Quem fala assim não está num lugar fácil. Fala de quem aprendeu um caminho para atravessar a preocupação sem ser engolido por ela.',
      'Vale notar o que o texto não diz. Ele não afirma que você não vai sentir ansiedade, nem manda se envergonhar por senti-la. O que ele faz é indicar o que fazer com ela: levar a Deus. E aponta três movimentos. O primeiro é a oração, que é simplesmente conversar com Deus. O segundo é a súplica, que é pedir com clareza, dizendo a Deus o que realmente pesa, sem versão arrumada. O terceiro é a ação de graças, que é lembrar o que Deus já fez.',
      'A gratidão no meio do pedido pode parecer estranha, mas ela tem um efeito importante: muda o ângulo do olhar. A ansiedade vive olhando para o que pode dar errado, no futuro. A gratidão olha para o que Deus já sustentou, no passado. Quando você junta as duas coisas, a lembrança de que Deus foi fiel ontem ajuda a confiar que Ele continua fiel amanhã.',
      'E então vem a promessa: a paz de Deus, que ultrapassa o entendimento, guardará o coração e a mente. A palavra usada para guardar vem do mundo militar e fala de uma sentinela. Isso quer dizer que a paz não é só um sentimento que passa, é uma guarda posta na porta do coração. E note que o texto diz que essa paz excede o entendimento: ela pode chegar mesmo quando você ainda não tem a solução, mesmo quando a situação continua igual.',
      'Há um detalhe bonito logo antes deste trecho: Paulo convida a alegrar-se no Senhor sempre, pede que a gentileza de todos seja conhecida e lembra que o Senhor está perto. A proximidade de Deus é a base do convite. Não oramos para um Deus distante, tentando chamar a atenção dele; oramos a quem já está perto. Por isso a oração pode ser curta, sincera e sem fórmulas. Você não precisa de palavras bonitas, precisa apenas de um coração que se abre e de um Deus que escuta.',
      'Para hoje, uma prática simples: pegue um papel e escreva as três preocupações que mais pesam. Ao lado de cada uma, escreva algo pelo qual você pode agradecer. Depois, ore lendo em voz alta, entregando cada item. E um cuidado importante: se a ansiedade é muito intensa ou constante, buscar ajuda profissional também é uma forma de cuidar de si, e não é falta de fé. Deus cuida de nós também por meio de médicos, psicólogos e de pessoas de confiança.',
    ],
    question: 'Qual é a preocupação que mais tem ocupado a sua mente esta semana, e pelo que você pode agradecer a Deus ao lado dela?',
    prayer: 'Pai, venho a ti com o que me pesa e não quero carregar sozinho. Entrego a ti as minhas preocupações, uma por uma. Agradeço pelo que já fizeste na minha vida e confio que continuarás fiel. Dá-me a tua paz, essa que eu não consigo explicar, e guarda o meu coração e os meus pensamentos hoje. Amém.',
  },
  {
    id: 'aves-mt6',
    title: 'Olhai as aves do céu',
    ref: parseVerseRef('Mt 6:26'),
    paragraphs: [
      'Jesus ensinava ao ar livre, e muita gente que o ouvia vivia com a preocupação de todos os dias: o que vamos comer, como vamos nos vestir, se vai dar para chegar ao fim do mês. Eram pessoas simples, muitas delas pobres. Foi para elas que Ele disse algo que até hoje soa estranho e bonito: olhem para as aves do céu. Ele escolhe um exemplo que está ao alcance dos olhos, porque a lição não precisa de livro, basta levantar a cabeça.',
      'Cuidado com uma leitura apressada. Jesus não está dizendo que ninguém deve trabalhar nem planejar. As aves não ficam paradas esperando que a comida caia no ninho: passam o dia procurando, voando, cuidando dos filhotes. O que Jesus aponta é outra coisa. A ave faz a sua parte, mas não carrega a angústia de quem acha que tudo depende só dela. Trabalhar é uma coisa, viver consumido pela preocupação é outra.',
      'Depois vem a pergunta que muda o jeito de ver: vocês não valem muito mais do que elas? Jesus não está comparando para humilhar, mas para lembrar o nosso valor. Se o Pai cuida das aves, que Ele mesmo criou, como esqueceria os filhos que Ele ama? A conclusão é que a nossa preocupação costuma partir de uma ideia errada sobre quem Deus é: tratamos como distante e distraído quem está atento a cada detalhe.',
      'O próprio texto continua mostrando o limite da ansiedade: ela não acrescenta um único dia à nossa vida. Pensar no problema mil vezes não o resolve; muitas vezes só nos rouba a paz de hoje por causa de um amanhã que ainda não chegou. Jesus propõe uma troca: em vez de viver para as preocupações, buscar primeiro o reino de Deus, confiando que o que realmente precisamos virá junto.',
      'Jesus ainda observa que quem não conhecia o Pai é que corria atrás dessas coisas com tanta aflição. Para quem conhece o Pai, a situação é outra: o Pai celestial sabe do que precisamos antes mesmo de pedirmos. Isso não nos livra de orar pelas nossas necessidades; apenas muda o tom da oração. Em vez de pedir como quem duvida de ser ouvido, pedimos como filhos que falam com um pai que já sabe e se importa.',
      'Hoje, procure uma ave, uma árvore ou o céu, e pare por um minuto. Observe como tudo ao redor continua funcionando sem a sua vigilância. Depois, converse com Deus sobre aquela necessidade que você tem carregado sozinho. Faça o que está ao seu alcance hoje, e deixe o resto nas mãos de quem cuida das aves e também cuida de você.',
    ],
    question: 'Existe alguma preocupação que você tem carregado como se tudo dependesse só de você? O que seria fazer a sua parte e confiar o resto a Deus?',
    prayer: 'Pai, tu cuidas das aves do céu e sei que cuidas de mim. Perdoa-me quando vivo como se estivesse sozinho. Ensina-me a trabalhar com responsabilidade e a descansar na tua provisão. Tira de mim o peso das preocupações que não consigo resolver hoje, e ajuda-me a buscar o teu reino em primeiro lugar. Amém.',
  },
  {
    id: 'nao-temas-is41',
    title: 'Não temas, eu estou contigo',
    ref: parseVerseRef('Is 41:10'),
    paragraphs: [
      'A mensagem do profeta Isaías foi dada a um povo cansado e assustado. O povo de Israel enfrentava ameaças de nações poderosas e sentia que estava sozinho no meio da tempestade. É nesse cenário que Deus fala por meio do profeta uma frase que atravessou os séculos: não temas. A ordem não vem solta, como se bastasse ter força de vontade. Ela vem acompanhada de razões, e é isso que a faz tão forte.',
      'A primeira razão é uma promessa de presença: eu estou contigo. Antes de qualquer solução, Deus oferece companhia. O medo cresce na solidão, e a primeira resposta de Deus é lembrar que não estamos sozinhos. A segunda razão é a relação: eu sou o teu Deus. Ele não se apresenta como um estranho poderoso, mas como o Deus que tem um vínculo com cada um de nós. O medo diz que ninguém está cuidando; Deus responde que Ele está.',
      'Depois vêm três verbos de ação: eu te fortaleço, eu te ajudo, eu te sustento. Perceba que não são promessas de que o problema vai desaparecer. São promessas de que haverá força para enfrentá-lo, ajuda no caminho e sustento para não cair. A mão que sustenta é descrita como a mão direita, a mão da justiça e da fidelidade de Deus. Quando as nossas forças acabam, a sustentação não vem de nós.',
      'O medo é uma emoção humana, e a Bíblia não o trata como pecado. Muitos homens e mulheres de fé sentiram medo. A diferença é para onde eles o levaram. A frase não temas aparece muitas vezes nas Escrituras, e quase sempre vem unida a uma lembrança de quem Deus é e do que Ele está fazendo. O convite é trocar o foco: em vez de olhar só para o tamanho da ameaça, olhar para o tamanho do Deus que está conosco.',
      'Pense também na imagem de uma criança que segura a mão do pai ao atravessar uma rua movimentada. O medo não some de uma vez, mas a mão firme ao redor da sua torna a travessia possível. Essa imagem aparece pouco mais adiante, no mesmo capítulo, quando Deus diz que toma o seu povo pela mão direita e promete ajudar. A coragem nasce da mão que nos segura, e não da força do nosso próprio braço.',
      'Hoje, quando o medo aparecer, tente fazer uma pausa curta e dizer em voz baixa: o Senhor está comigo. Nomeie o medo diante de Deus, sem esconder nada. Depois dê o próximo passo pequeno que estiver ao seu alcance, acreditando que a força para ele vem de quem prometeu fortalecer. A coragem cristã não é a ausência de medo, é caminhar sabendo que não se caminha sozinho.',
    ],
    question: 'Qual é o medo que mais tem falado alto dentro de você ultimamente? O que mudaria se você realmente acreditasse que Deus está com você nele?',
    prayer: 'Senhor, tu conheces os meus medos, mesmo os que não consigo dizer. Obrigado por prometeres estar comigo. Fortalece-me onde estou fraco, ajuda-me onde não sei o que fazer e sustenta-me quando eu quiser desistir. Que a tua presença seja mais forte do que o meu medo hoje. Amém.',
  },
  {
    id: 'confia-pv3',
    title: 'Confia de todo o coração',
    ref: parseVerseRef('Pv 3:5-6'),
    paragraphs: [
      'O livro de Provérbios é como o conselho de um pai a um filho, que quer prepará-lo para a vida. Entre tantos conselhos práticos sobre dinheiro, trabalho e palavras, há dois versículos que resumem o fundamento de tudo: confia no Senhor de todo o coração e não te apoies no teu próprio entendimento. Quem fala assim não quer que o filho deixe de pensar. Quer que ele saiba onde colocar o peso da vida.',
      'Repare em duas palavras. A primeira é todo. Confiar de todo o coração é diferente de confiar mais ou menos, ou de confiar só quando as coisas estão boas. É fácil dizer que confiamos em Deus quando o plano está dando certo. O desafio aparece quando o caminho muda, quando as contas não fecham ou quando a resposta demora. Confiança de verdade é a que continua firme quando não dá para entender.',
      'A segunda ideia é a de não se apoiar no próprio entendimento. Isso não quer dizer abandonar a inteligência, os estudos ou o bom senso. Deus nos deu a mente para ser usada. O que o texto alerta é para o risco de tratar o nosso ponto de vista como a última palavra. Nós vemos uma parte da história; Deus vê o todo. Muitas decisões que pareciam erradas no momento, com o tempo mostraram o cuidado de Deus.',
      'Em seguida vem o convite: em todos os teus caminhos, reconhece-o. Reconhecer Deus é levá-lo para dentro das decisões, e não só para as horas de crise. É orar antes de decidir, procurar a vontade dele na Palavra, escutar conselhos de pessoas sábias e estar disposto a ouvir um não. E a promessa que acompanha é que Ele endireitará as veredas. O texto não garante um caminho sem pedras, mas garante direção para quem se deixa guiar.',
      'Esse conselho também protege contra um erro comum: transformar a fé em simples otimismo, como se bastasse querer muito que tudo desse certo. Confiar no Senhor não é confiar que as coisas sairão como queremos, mas que Ele é bom e sabe o que faz, inclusive quando o resultado é diferente do que pedimos. A confiança descansa no caráter de Deus, e não no resultado que imaginamos. Por isso ela é mais estável do que o otimismo: sobrevive às respostas que não eram as que esperávamos.',
      'Pense hoje em uma decisão que está pendente na sua vida, grande ou pequena. Antes de resolver, pare e converse com Deus sobre ela. Diga o que você pensa, peça sabedoria, abra a Bíblia e, se for o caso, converse com alguém experiente. Depois dê o passo que parecer mais sábio, com o coração em paz, sabendo que o Senhor sabe aonde o caminho leva.',
    ],
    question: 'Qual decisão você está tentando resolver apenas com o seu próprio entendimento? Como você pode levá-la a Deus de forma prática ainda hoje?',
    prayer: 'Senhor, quero confiar em ti de todo o coração, mesmo quando não entendo o caminho. Perdoa-me por tantas vezes decidir sozinho. Reconheço que tu sabes mais do que eu. Dá-me sabedoria nas decisões de hoje, humildade para ouvir bons conselhos e fé para seguir a direção que tu mostrares. Amém.',
  },
  {
    id: 'refugio-sl46',
    title: 'Deus é o nosso refúgio',
    ref: parseVerseRef('Sl 46:1'),
    paragraphs: [
      'O Salmo 46 foi escrito num tempo de grande agitação. O texto fala de terra que se move, montes que caem no mar, águas que rugem e nações em alvoroço. É um retrato de caos, daquelas fases em que parece que nada está no lugar. E é justamente no meio dessa cena que o salmista abre a boca para afirmar com calma: Deus é o nosso refúgio e a nossa fortaleza.',
      'Pense no que é um refúgio. É um lugar para onde você corre quando a tempestade chega, um abrigo onde você se protege. A palavra fortaleza reforça a ideia: um lugar firme que não cede com o vento. O salmista usa duas imagens parecidas para dizer que Deus é mais do que uma ideia agradável: Ele é um lugar real de segurança, para onde podemos ir quando a vida aperta.',
      'O versículo ainda acrescenta uma expressão que consola: socorro bem presente na angústia. Bem presente quer dizer que Deus não está longe, nem demora a ouvir. Ele está à mão, no mesmo lugar em que a angústia aparece. Não precisamos subir uma escada espiritual para alcançar Deus; no meio do desespero, uma oração simples já é um passo para dentro do refúgio.',
      'Mais adiante, o mesmo salmo traz um convite que muita gente conhece: aquietai-vos e sabei que eu sou Deus. Em meio ao barulho, Deus nos chama a parar. Isso não é passividade; é descansar na certeza de que Ele continua no controle quando nós não conseguimos controlar mais nada. Quando a gente entende quem é Deus, o tamanho da tempestade deixa de ter a última palavra.',
      'O salmo repete mais de uma vez uma frase de consolo: o Senhor dos exércitos está conosco, o Deus de Jacó é o nosso refúgio. Jacó foi um homem cheio de falhas, que fugiu, enganou e lutou com Deus numa noite inteira. Chamar o Senhor de Deus de Jacó é lembrar que o refúgio não é reservado a quem tem a vida em ordem. Ele abriga gente imperfeita, que corre para dentro com medo, cansaço e culpa, e encontra a porta aberta.',
      'Hoje, pergunte a si mesmo: quando as coisas ficam difíceis, para onde eu corro? Para a distração, para o isolamento, para a reclamação? Experimente fazer de Deus o primeiro endereço. Reserve dois minutos de silêncio, respire devagar e diga: o Senhor é o meu refúgio. Entre nele antes de a tempestade passar. Você pode descobrir que a paz não chega só depois do fim da crise, mas já no meio dela.',
    ],
    question: 'Quando a angústia aparece, para onde você costuma correr primeiro? O que mudaria em você se Deus fosse o seu primeiro refúgio?',
    prayer: 'Senhor, tu és o meu refúgio e a minha fortaleza, o socorro bem presente na hora da angústia. Quando tudo ao meu redor se agitar, ensina-me a correr para ti. Aquieta o meu coração, lembra-me de quem tu és e dá-me a certeza de que não estou sozinho na tempestade. Amém.',
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
