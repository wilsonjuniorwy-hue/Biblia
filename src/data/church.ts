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

export interface Church {
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
