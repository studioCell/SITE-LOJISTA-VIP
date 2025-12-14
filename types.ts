
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean; 
  createdAt?: number;
  views?: number; // New: Track popularity
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  username?: string; 
  phone?: string; 
  
  // Address Fields
  cep?: string;
  city?: string;
  street?: string;
  number?: string;
  district?: string;
  complement?: string;

  password?: string;
  isAdmin: boolean;
  isVendor?: boolean; // New: Vendor Role
  savedCart?: CartItem[];
  createdAt?: number;
}

export interface Story {
  id: string;
  imageUrl: string; 
  type: 'image' | 'video';
  caption: string;
  createdAt: number;
  expiresAt: number;
  productId?: string;
  views?: string[]; 
}

export interface ShopSettings {
  shopName?: string; // New
  minOrderValue?: number; // New
  aboutUs: string;
  shippingPolicy: string;
  warrantyPolicy: string;
  feesPolicy: string;
  contactNumber: string; 
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
  userComplement?: string; // New: Address Complement

  items: CartItem[];
  total: number;
  discount?: number; 
  shippingCost?: number; 
  shippingMethod?: string; // e.g., 'Motoboy', 'Correios'
  
  // Fees
  wantsInvoice?: boolean; 
  wantsInsurance?: boolean; 

  status: OrderStatus;
  createdAt: number;
  trackingCode?: string;
  sellerId?: string; // New: Track which vendor made the sale
  history: { status: OrderStatus; timestamp: number }[];
}

export const MOCK_PRODUCTS: Product[] = [];
