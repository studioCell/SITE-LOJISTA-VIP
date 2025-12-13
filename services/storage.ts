import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  arrayUnion,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { Product, MOCK_PRODUCTS, Story, User, CartItem, ShopSettings, Order, OrderStatus, Category } from '../types';

// Collections
const PRODUCTS_COL = 'products';
const STORIES_COL = 'stories';
const USERS_COL = 'users';
const SETTINGS_COL = 'settings';
const CATEGORIES_COL = 'categories';
const SETTINGS_DOC_ID = 'general_settings';
const IMAGES_DOC_ID = 'site_images';
const ORDERS_COL = 'orders';

const CURRENT_USER_KEY = 'lojista_vip_current_user'; 

// --- Helpers ---
const handleFirestoreError = (err: any, fallback: any = null) => {
  const msg = err?.message || '';
  if (err?.code === 'unavailable' || msg.includes('offline') || msg.includes('network')) {
    console.debug("Firestore offline/unavailable (using fallback data).");
  } else {
    console.warn("Firestore operation failed (using fallback). Check firebaseConfig.", err);
  }
  return fallback;
};

// --- Real-time Listeners (Subscriptions) ---

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!isFirebaseConfigured) {
    callback(MOCK_PRODUCTS);
    return () => {};
  }

  const q = query(collection(db, PRODUCTS_COL));
  return onSnapshot(q, 
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      callback(products);
    }, 
    (error) => {
      handleFirestoreError(error);
      callback(MOCK_PRODUCTS);
    }
  );
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  if (!isFirebaseConfigured) {
    // Default categories if offline/not configured
    callback([
        { id: '1', name: 'Novidades' },
        { id: '2', name: 'Eletrônicos' },
        { id: '3', name: 'Casa' }
    ]);
    return () => {};
  }

  const q = query(collection(db, CATEGORIES_COL), orderBy('name'));
  return onSnapshot(q, 
    (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      callback(cats);
    },
    (error) => {
      handleFirestoreError(error);
      callback([]);
    }
  );
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, 
    (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    },
    (error) => {
      handleFirestoreError(error);
      callback([]);
    }
  );
};

export const subscribeToStories = (callback: (stories: Story[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, STORIES_COL));
  return onSnapshot(q, 
    (snapshot) => {
      const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      const now = Date.now();
      const activeStories = stories.filter(s => s.expiresAt > now);
      callback(activeStories);
    },
    (error) => {
      handleFirestoreError(error);
      callback([]);
    }
  );
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, USERS_COL));
  return onSnapshot(q, 
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(users);
    },
    (error) => {
      handleFirestoreError(error);
      callback([]);
    }
  );
};

// --- Categories CRUD ---

export const addCategory = async (name: string) => {
  if (!isFirebaseConfigured || !name.trim()) return;
  try {
    await addDoc(collection(db, CATEGORIES_COL), { name: name.trim() });
  } catch (error) { handleFirestoreError(error); }
};

export const deleteCategory = async (id: string, name: string) => {
  if (!isFirebaseConfigured) return;
  try {
    const batch = writeBatch(db);
    
    // 1. Delete the category doc
    const catRef = doc(db, CATEGORIES_COL, id);
    batch.delete(catRef);

    // 2. Find all products with this category
    const q = query(collection(db, PRODUCTS_COL), where("category", "==", name));
    const snapshot = await getDocs(q);
    
    // 3. Delete those products
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) { handleFirestoreError(error); }
};

// --- Products CRUD ---

export const getStoredProducts = async (): Promise<Product[]> => {
  if (!isFirebaseConfigured) return MOCK_PRODUCTS;
  try {
    const q = query(collection(db, PRODUCTS_COL));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return MOCK_PRODUCTS;
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    return handleFirestoreError(error, MOCK_PRODUCTS);
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>) => {
  if (!isFirebaseConfigured) return;
  try {
    // Added createdAt field
    await addDoc(collection(db, PRODUCTS_COL), { ...productData, available: true, createdAt: Date.now() });
  } catch (error) { handleFirestoreError(error); }
};

export const updateProduct = async (product: Product) => {
  if (!isFirebaseConfigured) return;
  try {
    const { id, ...data } = product;
    await updateDoc(doc(db, PRODUCTS_COL, id), data);
  } catch (error) { handleFirestoreError(error); }
};

export const deleteProduct = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, id));
  } catch (error) { handleFirestoreError(error); }
};

export const updateProductDescription = async (id: string, newDescription: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await updateDoc(doc(db, PRODUCTS_COL, id), { description: newDescription });
  } catch (error) { handleFirestoreError(error); }
};

export const toggleProductAvailability = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    const productRef = doc(db, PRODUCTS_COL, id);
    const snap = await getDoc(productRef);
    if (snap.exists()) {
      const current = snap.data().available;
      await updateDoc(productRef, { available: !current });
    }
  } catch (error) { handleFirestoreError(error); }
};

// Dangerous: Delete All Products
export const deleteAllProducts = async () => {
    if (!isFirebaseConfigured) return;
    try {
        const q = query(collection(db, PRODUCTS_COL));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) { handleFirestoreError(error); }
};

// --- Stories ---

export const addStory = async (storyData: { imageUrl: string; type: 'image' | 'video'; caption: string; productId?: string }) => {
  if (!isFirebaseConfigured) return;
  try {
    const now = Date.now();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    await addDoc(collection(db, STORIES_COL), {
      imageUrl: storyData.imageUrl,
      type: storyData.type,
      caption: storyData.caption,
      createdAt: now,
      expiresAt: now + ONE_WEEK_MS,
      productId: storyData.productId || null,
      views: []
    });
  } catch (error) { handleFirestoreError(error); }
};

export const markStoryAsViewed = async (storyId: string, userId: string) => {
  if (!isFirebaseConfigured || !userId) return;
  try {
    const storyRef = doc(db, STORIES_COL, storyId);
    await updateDoc(storyRef, {
      views: arrayUnion(userId)
    });
  } catch (error) { handleFirestoreError(error); }
};

export const deleteStory = async (id: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, STORIES_COL, id));
  } catch (error) { handleFirestoreError(error); }
};

// --- Settings & Images ---

export const getShopSettings = async (): Promise<ShopSettings> => {
  const defaults: ShopSettings = {
    aboutUs: "Somos uma loja dedicada a trazer os melhores produtos com os melhores preços.",
    shippingPolicy: "Enviamos para todo o Brasil. O prazo de entrega varia de acordo com a região.",
    warrantyPolicy: "Garantia de 30 dias contra defeitos de fabricação.",
    feesPolicy: "Aceitamos pagamentos via PIX, Cartão de Crédito e Débito.",
    contactNumber: "5562992973853",
    pixKey: "",
    pixName: "",
    pixBank: ""
  };

  if (!isFirebaseConfigured) return defaults;

  try {
    const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as ShopSettings;
    return defaults;
  } catch (error) {
    return handleFirestoreError(error, defaults);
  }
};

export const saveShopSettings = async (settings: ShopSettings) => {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, SETTINGS_COL, SETTINGS_DOC_ID), settings);
  } catch (error) { handleFirestoreError(error); }
};

export const getHeroImage = async (): Promise<string> => {
  if (!isFirebaseConfigured) return '';
  try {
    const docRef = doc(db, SETTINGS_COL, IMAGES_DOC_ID);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().heroImage || '' : '';
  } catch (error) { return handleFirestoreError(error, ''); }
};

export const saveHeroImage = async (url: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, SETTINGS_COL, IMAGES_DOC_ID), { heroImage: url }, { merge: true });
  } catch (error) { handleFirestoreError(error); }
};

export const getLogo = async (): Promise<string> => {
  const defaultLogo = "https://i.ibb.co/YnkzNYy/Cream-Black-Typography-Loop-Brand-Logo.jpg";
  if (!isFirebaseConfigured) return defaultLogo;
  try {
    const docRef = doc(db, SETTINGS_COL, IMAGES_DOC_ID);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().logo || '' : defaultLogo;
  } catch (error) { return handleFirestoreError(error, defaultLogo); }
};

export const saveLogo = async (url: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, SETTINGS_COL, IMAGES_DOC_ID), { logo: url }, { merge: true });
  } catch (error) { handleFirestoreError(error); }
};

// --- Auth & Users (Cloud) ---

export const getUsers = async (): Promise<User[]> => {
  if (!isFirebaseConfigured) return [];
  try {
    const q = query(collection(db, USERS_COL));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) { return handleFirestoreError(error, []); }
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await updateDoc(doc(db, USERS_COL, userId), { password: newPassword });
  } catch (error) { handleFirestoreError(error); }
};

export const updateUser = async (user: User) => {
  if (!isFirebaseConfigured) return;
  try {
    const { id, ...data } = user;
    await updateDoc(doc(db, USERS_COL, id), data);
  } catch (error) { handleFirestoreError(error); }
};

export const deleteUser = async (userId: string) => {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (error) { handleFirestoreError(error); }
};

// Register
export const registerUser = async (userData: { name: string; phone: string; cep: string; city: string; password: string; }): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!isFirebaseConfigured) {
    return { success: false, message: 'Banco de dados não configurado.' };
  }

  try {
    const q = query(collection(db, USERS_COL), where("phone", "==", userData.phone));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, message: 'Telefone já cadastrado.' };
    }

    const newUserRef = doc(collection(db, USERS_COL));
    const newUser: User = {
      id: newUserRef.id,
      isAdmin: false,
      ...userData,
      savedCart: [],
      createdAt: Date.now()
    };

    await setDoc(newUserRef, newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    return { success: true, message: 'Cadastro realizado!', user: newUser };
  } catch (error) {
    handleFirestoreError(error);
    return { success: false, message: 'Erro ao conectar. Tente novamente.' };
  }
};

// Login
export const loginUser = async (identifier: string, password: string, remember: boolean): Promise<{ success: boolean; message: string; user?: User }> => {
  // Admin Check
  if (identifier === 'admin' && password === '12345678') {
    const adminUser: User = { id: 'admin', name: 'Administrador', isAdmin: true, username: 'admin' };
    if (remember) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
    return { success: true, message: 'Bem-vindo Admin', user: adminUser };
  }

  if (!isFirebaseConfigured) {
    // Basic local login simulation if firebase fails/not set
    return { success: false, message: 'Sistema offline. Login de cliente indisponível.' };
  }

  try {
    const q = query(collection(db, USERS_COL), where("phone", "==", identifier), where("password", "==", password));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() } as User;
      if (remember) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, message: `Bem-vindo de volta, ${user.name}!`, user };
    }
  } catch (error) {
    handleFirestoreError(error);
    return { success: false, message: 'Erro de conexão ou credenciais inválidas.' };
  }

  return { success: false, message: 'Credenciais inválidas.' };
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const fetchAddressByCep = async (cep: string): Promise<string | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return data.localidade; 
  } catch (error) {
    console.error("CEP fetch error", error);
    return null;
  }
};

// --- Cart Persistence ---
export const saveUserCart = async (userId: string, cart: CartItem[]) => {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    currentUser.savedCart = cart;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }

  if (userId === 'admin' || !isFirebaseConfigured) return;
  
  try {
    await updateDoc(doc(db, USERS_COL, userId), { savedCart: cart });
  } catch (error) { handleFirestoreError(error); }
};

// --- Orders ---
export const getOrders = async (): Promise<Order[]> => {
  if (!isFirebaseConfigured) return [];
  try {
    const q = query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) { return handleFirestoreError(error, []); }
};

export const saveOrder = async (order: Order) => {
  if (!isFirebaseConfigured) return;
  try {
    const orderRef = doc(collection(db, ORDERS_COL)); // New ID
    const orderWithId = { ...order, id: orderRef.id }; 
    await setDoc(orderRef, orderWithId);
  } catch (error) { handleFirestoreError(error); }
};

export const updateOrder = async (order: Order) => {
  if (!isFirebaseConfigured) return;
  try {
    const orderRef = doc(db, ORDERS_COL, order.id);
    await setDoc(orderRef, order, { merge: true });
  } catch (error) { handleFirestoreError(error); }
};
