
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean; 
  createdAt?: number;
  views?: number;
  isPromo?: boolean;
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
  cpf?: string;
  birthDate?: string;
  cep?: string;
  city?: string;
  street?: string;
  number?: string;
  district?: string;
  complement?: string;
  password?: string;
  isAdmin: boolean;
  isVendor?: boolean;
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
  shopName?: string;
  minOrderValue?: number;
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
  userCpf?: string;
  userBirthDate?: string;
  userCep?: string;
  userCity?: string;
  userStreet?: string;
  userNumber?: string;
  userDistrict?: string;
  userComplement?: string;
  
  // Dropshipping support
  shippingTarget: 'user' | 'end_customer';
  
  items: CartItem[];
  total: number;
  discount?: number; 
  shippingCost?: number; 
  shippingMethod?: string;
  wantsInvoice?: boolean; 
  wantsInsurance?: boolean; 
  invoicePdf?: string;
  status: OrderStatus;
  createdAt: number;
  deliveredAt?: number;
  trackingCode?: string;
  sellerId?: string;
  history: { status: OrderStatus; timestamp: number }[];
}

export const MOCK_PRODUCTS: Product[] = [];
