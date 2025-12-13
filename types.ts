
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean; // New field for stock/visibility toggle
  createdAt?: number; // Timestamp for sorting new items
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
  createdAt?: number; // Added for "New Client" logic
}

export interface Story {
  id: string;
  imageUrl: string; // Acts as mediaUrl (base64)
  type: 'image' | 'video';
  caption: string;
  createdAt: number;
  expiresAt: number;
  productId?: string;
  views?: string[]; // Array of User IDs who viewed
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

export interface Category {
  id: string;
  name: string;
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
  
  // Address Details
  userCep?: string;
  userCity?: string;
  userStreet?: string;
  userNumber?: string;
  userDistrict?: string;

  items: CartItem[];
  total: number;
  discount?: number; // New field for discount
  shippingCost?: number; // Optional shipping cost
  shippingMethod?: string; // e.g., 'Motoboy', 'Correios'
  
  // Fees
  wantsInvoice?: boolean; // 6%
  wantsInsurance?: boolean; // 3%

  status: OrderStatus;
  createdAt: number;
  trackingCode?: string;
  history: { status: OrderStatus; timestamp: number }[];
}

// Inicialmente vazio para você cadastrar
export const MOCK_PRODUCTS: Product[] = [];
