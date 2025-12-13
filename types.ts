
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean; // New field for stock/visibility toggle
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  username?: string; // For admin
  phone?: string; // For customers
  cep?: string;
  city?: string;
  password?: string;
  isAdmin: boolean;
  savedCart?: CartItem[];
}

export interface Story {
  id: string;
  imageUrl: string; // Acts as mediaUrl (base64)
  type: 'image' | 'video';
  caption: string;
  createdAt: number;
  expiresAt: number;
  productId?: string;
}

export interface ShopSettings {
  aboutUs: string;
  shippingPolicy: string;
  warrantyPolicy: string;
  feesPolicy: string;
  contactNumber: string; // WhatsApp
  // PIX Config
  pixKey: string;
  pixName: string;
  pixBank: string;
}

export type OrderStatus = 
  | 'orcamento' 
  | 'realizado' 
  | 'pagamento_pendente' 
  | 'preparacao' 
  | 'transporte' 
  | 'entregue' 
  | 'devolucao'
  | 'cancelado';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userCep?: string; // Store address snapshot
  userCity?: string; // Store address snapshot
  items: CartItem[];
  total: number;
  discount?: number; // New field for discount
  shippingCost?: number; // Optional shipping cost
  shippingMethod?: string; // e.g., 'Motoboy', 'Correios'
  status: OrderStatus;
  createdAt: number;
  trackingCode?: string;
  history: { status: OrderStatus; timestamp: number }[];
}

export const CATEGORIES = [
  "Novidades",
  "Cozinha",
  "Casa e Limpeza",
  "Eletrônicos",
  "Acessórios Celular",
  "Beleza e Saúde",
  "Ferramentas",
  "Brinquedos",
  "Iluminação"
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Garrafa Térmica Digital 500ml',
    price: 35.00,
    description: 'Mantém quente ou frio por 12h. Led digital na tampa com temperatura.',
    image: 'https://images.tcdn.com.br/img/img_prod/747395/garrafa_termica_inteligente_sensor_temperatura_led_500ml_inox_1055_1_2f128509706798089456950275816996.jpg',
    category: 'Cozinha',
    available: true
  },
  {
    id: '2',
    name: 'Mini Processador Elétrico USB',
    price: 45.00,
    description: 'Triture alho, cebola e vegetais em segundos. Recarregável.',
    image: 'https://m.media-amazon.com/images/I/61r-G-uSgSL._AC_SX679_.jpg',
    category: 'Cozinha',
    available: true
  },
  {
    id: '3',
    name: 'Fone Bluetooth i12 TWS Touch',
    price: 39.90,
    description: 'Sem fio, touch, compatível com Android e iOS.',
    image: 'https://m.media-amazon.com/images/I/51w+1a6xK+L._AC_SX522_.jpg',
    category: 'Eletrônicos',
    available: true
  },
  {
    id: '4',
    name: 'Ring Light de Mesa 16cm + Tripé',
    price: 25.00,
    description: 'Iluminação perfeita para selfies e vídeos. 3 tons de luz.',
    image: 'https://m.media-amazon.com/images/I/61y8y6zQeAL._AC_SX522_.jpg',
    category: 'Acessórios Celular',
    available: true
  },
  {
    id: '5',
    name: 'Kit Ferramentas Maleta 46 Peças',
    price: 65.00,
    description: 'Jogo de soquetes e chaves catraca em aço cromo.',
    image: 'https://m.media-amazon.com/images/I/71Xy-3+6cBL._AC_SX679_.jpg',
    category: 'Ferramentas',
    available: true
  },
  {
    id: '6',
    name: 'Caixa de Som Portátil Resistente à Água',
    price: 55.00,
    description: 'Som potente, bluetooth, entrada pen drive e cartão.',
    image: 'https://m.media-amazon.com/images/I/81+M8D-iHML._AC_SX425_.jpg',
    category: 'Eletrônicos',
    available: true
  },
  {
    id: '7',
    name: 'Smartwatch D20 Monitor Cardíaco',
    price: 49.99,
    description: 'Notificações de redes sociais, monitor de esportes e sono.',
    image: 'https://m.media-amazon.com/images/I/51G+3+pT-lL._AC_SX522_.jpg',
    category: 'Eletrônicos',
    available: true
  },
  {
    id: '8',
    name: 'Máquina Dragon Profissional Vintage',
    price: 35.00,
    description: 'Para cabelo e barba. Design dourado dragão, bateria recarregável.',
    image: 'https://m.media-amazon.com/images/I/61I2-2y+KKL._AC_SX522_.jpg',
    category: 'Beleza e Saúde',
    available: true
  },
  {
    id: '9',
    name: 'Copo Térmico Tipo Stanley 473ml',
    price: 55.00,
    description: 'Com tampa e abridor. Mantém gelado por 4 horas.',
    image: 'https://m.media-amazon.com/images/I/61x+o7+w6lL._AC_SX679_.jpg',
    category: 'Cozinha',
    available: true
  },
  {
    id: '10',
    name: 'Mop Giratório Fit com Balde',
    price: 69.90,
    description: 'Limpeza prática sem sujar as mãos. Centrifuga e seca.',
    image: 'https://m.media-amazon.com/images/I/61S-y9wG-bL._AC_SX679_.jpg',
    category: 'Casa e Limpeza',
    available: true
  },
  {
    id: '11',
    name: 'Fita LED RGB 5 Metros com Controle',
    price: 29.90,
    description: '16 cores, efeitos de luz, fácil instalação autoadesiva.',
    image: 'https://m.media-amazon.com/images/I/71s8+y6+gFL._AC_SX679_.jpg',
    category: 'Iluminação',
    available: true
  },
  {
    id: '12',
    name: 'Tripé Flexível Polvo para Celular',
    price: 15.00,
    description: 'Agarra em qualquer lugar. Ideal para fotos criativas.',
    image: 'https://m.media-amazon.com/images/I/61+y+w+x+L._AC_SX679_.jpg',
    category: 'Acessórios Celular',
    available: true
  },
  {
    id: '13',
    name: 'Garrafa Motivacional 2 Litros',
    price: 25.00,
    description: 'Com horários e frases motivacionais. Canudo de silicone.',
    image: 'https://m.media-amazon.com/images/I/61J+y+w+x+L._AC_SX679_.jpg',
    category: 'Beleza e Saúde',
    available: true
  },
  {
    id: '14',
    name: 'Umidificador de Ar Ultrassônico Madeira',
    price: 45.00,
    description: 'Difusor de aromas com LED 7 cores. Bivolt.',
    image: 'https://m.media-amazon.com/images/I/61+y+w+x+L._AC_SX679_.jpg',
    category: 'Casa e Limpeza',
    available: true
  }
];