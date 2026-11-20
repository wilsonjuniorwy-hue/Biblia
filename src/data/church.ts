/**
 * Conteúdo da área "Igreja". EDITE ESTE ARQUIVO com os dados reais da sua igreja
 * e faça o deploy de novo. Troque `demo` para false para esconder o aviso de exemplo.
 *
 * Imagem própria (opcional): coloque a foto em `public/images/igreja.jpg` e use
 * image: 'images/igreja.jpg' (sem barra no começo).
 */
export interface ServiceItem { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; time: string; title: string; note?: string } // day: 0 = domingo
export interface Notice { title: string; text: string }
export interface ChurchEvent { title: string; date: string; time?: string; place?: string; text?: string } // date: AAAA-MM-DD

export interface Ministry { name: string; text: string }
export interface Devotional { title: string; text: string; verse?: string; author?: string }
export interface Photo { src: string; caption?: string }

export interface Church {
  /** Quantos minutos o "Ao vivo agora" fica ligado a partir do horário de cada reunião. */
  liveMinutes: number;
  /** Mensagem da semana (null esconde o cartão). */
  devotional: Devotional | null;
  /** Link do boletim em PDF (vazio esconde o botão). */
  bulletinUrl: string;
  /** Fotos colocadas em public/images/ (ex.: 'images/culto1.jpg'). Vazio esconde a galeria. */
  photos: Photo[];
  ministries: Ministry[];
  /** Mostra o cartão "Pedido de oração" (envia por WhatsApp). */
  prayerRequests: boolean;
  demo: boolean;
  name: string;
  tagline: string;
  welcome: string;
  image: string | null;
  schedule: ServiceItem[];
  notices: Notice[];
  events: ChurchEvent[];
  address: string;
  mapsUrl: string;
  phone: string;
  whatsapp: string; // só dígitos com DDI, ex.: 5511999999999
  email: string;
  instagram: string;
  youtube: string;
  liveUrl: string;
  pix: { key: string; holder: string; note: string };
}

export const CHURCH: Church = {
  liveMinutes: 100,
  devotional: {
    title: 'Descanso para a semana',
    verse: 'Salmos 46:10',
    text: 'No meio da correria, Deus nos convida a parar. Reserve alguns minutos hoje para silenciar, agradecer e entregar a semana nas mãos dele.',
    author: 'Equipe pastoral',
  },
  bulletinUrl: '',
  photos: [],
  ministries: [
    { name: 'Louvor', text: 'Música e adoração nos cultos. Ensaios às quintas.' },
    { name: 'Jovens', text: 'Encontros, estudos e comunhão para a juventude.' },
    { name: 'Crianças', text: 'Ensino bíblico e cuidado para os pequenos durante os cultos.' },
    { name: 'Ação social', text: 'Cestas básicas, visitas e apoio às famílias da comunidade.' },
  ],
  prayerRequests: true,
  demo: true,
  name: 'Sua Igreja Aqui',
  tagline: 'Uma família para chamar de sua',
  welcome: 'Que alegria ter você com a gente! Aqui você acompanha os cultos, os avisos e os próximos eventos da igreja.',
  image: null,
  schedule: [
    { day: 0, time: '09:00', title: 'Escola Bíblica Dominical', note: 'Classes para todas as idades' },
    { day: 0, time: '19:00', title: 'Culto de Celebração' },
    { day: 3, time: '19:30', title: 'Culto de Oração e Estudo' },
    { day: 5, time: '20:00', title: 'Culto de Jovens' },
  ],
  notices: [
    { title: 'Campanha de natal', text: 'Estamos arrecadando alimentos não perecíveis para as famílias da comunidade. Entregue na secretaria.' },
    { title: 'Aulas para novos membros', text: 'Começam no mês que vem. Procure a recepção para se inscrever.' },
  ],
  events: [
    { title: 'Ceia do Senhor', date: '2026-12-06', time: '19:00', place: 'Templo principal' },
    { title: 'Cantata de Natal', date: '2026-12-20', time: '19:00', place: 'Templo principal', text: 'Venha com a família. Entrada gratuita.' },
    { title: 'Culto de virada de ano', date: '2026-12-31', time: '22:00', place: 'Templo principal' },
  ],
  address: 'Rua Exemplo, 123 — Centro, Sua Cidade/UF',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+Exemplo+123',
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  email: 'contato@suaigreja.org',
  instagram: 'https://instagram.com/suaigreja',
  youtube: 'https://youtube.com/@suaigreja',
  liveUrl: '',
  pix: { key: 'contato@suaigreja.org', holder: 'Sua Igreja Aqui', note: 'Dízimos e ofertas' },
};
