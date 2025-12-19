
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, CartItem, Story, User, ShopSettings, Order, Category } from './types';
import { 
  subscribeToProducts,
  subscribeToStories,
  subscribeToCategories,
  subscribeToOrders, 
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductDescription, 
  loginUser,
  registerUser,
  getCurrentUser,
  logout,
  addStory,
  deleteStory,
  getHeroImage,
  saveHeroImage,
  getLogo,
  saveUserCart,
  getShopSettings,
  saveOrder,
  updateOrder,
  markStoryAsViewed
} from './services/storage';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { AuthModal } from './components/AuthModal'; 
import { AdminPanel } from './components/AdminPanel';
import { CategoryFilter } from './components/CategoryFilter';
import { StoryList } from './components/StoryList';
import { StoryViewer } from './components/StoryViewer';
import { StoryCreatorModal } from './components/StoryCreatorModal';
import { ProductDetails } from './components/ProductDetails';
import { MenuDrawer } from './components/MenuDrawer';
import { PolicyModal } from './components/PolicyModal';
import { OrderEditModal } from './components/OrderEditModal';
import { SalesArea } from './components/SalesArea';
import { UserOrdersModal } from './components/UserOrdersModal';
import { ProductFormModal } from './components/ProductFormModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { UserProfileModal } from './components/UserProfileModal';

const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSalesAreaOpen, setIsSalesAreaOpen] = useState(false);
  const [isUserOrdersOpen, setIsUserOrdersOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [view, setView] = useState<'home' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroImageError, setHeroImageError] = useState(false);
  const [logo, setLogo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'views' | 'newest'>('default');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const productAnchorRef = useRef<HTMLDivElement>(null); 
  const lastOrderTimestampRef = useRef<number>(Date.now()); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [quickEditingProduct, setQuickEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [lastOrderForWhatsapp, setLastOrderForWhatsapp] = useState<Order | null>(null);

  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  useEffect(() => {
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    const unsubStories = subscribeToStories((data) => {
      setStories(data);
    });
    const unsubCategories = subscribeToCategories((data) => {
        setCategories(data);
    });
    const loadAsyncData = async () => {
      const hImg = await getHeroImage();
      const lImg = await getLogo();
      const sets = await getShopSettings();
      setHeroImage(hImg);
      setLogo(lImg);
      setSettings(sets);
    };
    loadAsyncData();
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (!(user.isAdmin || user.isVendor) && user.savedCart) {
        setCart(user.savedCart); 
      }
    } else {
      setIsAuthOpen(true);
    }
    return () => {
      unsubProducts();
      unsubStories();
      unsubCategories();
    };
  }, []);

  useEffect(() => {
    if (!currentUser || (!currentUser.isAdmin && !currentUser.isVendor)) return;
    let isFirstLoad = true;
    const unsubscribeOrders = subscribeToOrders((allOrders) => {
        if (allOrders.length === 0) return;
        const newestOrder = allOrders.reduce((prev, current) => 
            (prev.createdAt > current.createdAt) ? prev : current
        );
        if (isFirstLoad) {
            lastOrderTimestampRef.current = Math.max(lastOrderTimestampRef.current, newestOrder.createdAt);
            isFirstLoad = false;
        } else {
            if (newestOrder.createdAt > lastOrderTimestampRef.current) {
                lastOrderTimestampRef.current = newestOrder.createdAt;
                try {
                    const audio = new Audio(NOTIFICATION_SOUND);
                    audio.volume = 0.5;
                    audio.play();
                } catch (e) {}
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("💰 Novo Pedido Recebido!", {
                        body: `Cliente: ${newestOrder.userName}\nValor: R$ ${newestOrder.total.toFixed(2)}`,
                        icon: logo || undefined,
                        tag: newestOrder.id 
                    });
                }
            }
        }
    });
    return () => unsubscribeOrders();
  }, [currentUser, logo]); 

  const handleCheckout = async (
      extras: { shippingTarget: 'user' | 'end_customer'; endCustomer?: any },
      adminOverride?: { user: User, address: any }
  ) => {
    if (!currentUser && !adminOverride) {
      setIsCartOpen(false); 
      setIsAuthOpen(true);
      return;
    }
    
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const buyer = adminOverride ? adminOverride.user : currentUser!;
    
    // Determine address details based on target
    let orderDetails: any = {
      userName: buyer.name,
      userPhone: buyer.phone || '',
      userCpf: buyer.cpf || '',
      userBirthDate: buyer.birthDate || '',
      userCep: buyer.cep || '',
      userCity: buyer.city || '',
      userStreet: buyer.street || '',
      userNumber: buyer.number || '',
      userDistrict: buyer.district || '',
      userComplement: buyer.complement || ''
    };

    if (extras.shippingTarget === 'end_customer' && extras.endCustomer) {
      orderDetails = {
        userName: `${buyer.name} (PARA: ${extras.endCustomer.name})`,
        userPhone: buyer.phone || '', // Keep buyer phone for main contact
        userCpf: extras.endCustomer.cpf,
        userBirthDate: extras.endCustomer.birthDate,
        userCep: extras.endCustomer.cep,
        userCity: extras.endCustomer.city,
        userStreet: extras.endCustomer.street,
        userNumber: extras.endCustomer.number,
        userDistrict: extras.endCustomer.district,
        userComplement: extras.endCustomer.complement
      };
    }

    const newOrder: Order = {
      id: Date.now().toString(), 
      userId: buyer.id,
      ...orderDetails,
      items: [...cart],
      total: subtotal,
      discount: 0,
      shippingCost: 0,
      shippingTarget: extras.shippingTarget,
      status: 'orcamento', 
      createdAt: Date.now(),
      sellerId: (currentUser?.isVendor || currentUser?.isAdmin) ? currentUser.id : undefined,
      history: [{ status: 'orcamento', timestamp: Date.now() }]
    };

    try {
      await saveOrder(newOrder);
      setCart([]); 
      setLastOrderForWhatsapp(newOrder);
      setIsCartOpen(false);
      setShowOrderSuccess(true);
    } catch (error) {
      alert("Erro ao registrar pedido.");
    }
  };

  const addToCart = (product: Product, quantity: number = 1, note: string = '') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, note: note || item.note } 
            : item
        );
      }
      return [...prev, { ...product, quantity, note }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleContact = () => {
    window.open(`https://api.whatsapp.com/send?phone=5562992973853`, '_blank');
  };

  const handleLogin = async (u: string, p: string, remember: boolean) => {
    const result = await loginUser(u, p, remember);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      if (result.user.savedCart) setCart(result.user.savedCart);
      if (result.user.isAdmin || result.user.isVendor) setView('admin');
      setIsAuthOpen(false);
    }
    return result;
  };

  const handleRegister = async (data: any) => {
    const result = await registerUser(data);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthOpen(false);
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setView('home');
    setCart([]); 
    setIsAuthOpen(true); 
  };

  const handleHeaderCartClick = () => {
    setIsCartOpen(true);
  };

  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    await addProduct(product);
  };
  const handleUpdateProduct = async (product: Product) => {
    await updateProduct(product);
  };
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id);
    }
  };
  const handleDescriptionUpdate = async (id: string, newDesc: string) => {
    await updateProductDescription(id, newDesc);
  };
  const handleQuickEditProduct = (product: Product) => {
    setQuickEditingProduct(product);
    setIsProductFormOpen(true);
  };
  const handleQuickSaveProduct = async (data: Product | Omit<Product, 'id'>) => {
    if ('id' in data) {
      await updateProduct(data as Product);
    }
    setQuickEditingProduct(null);
  };
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };
  const handleSaveEditedOrder = async (updatedOrder: Order) => {
    await updateOrder(updatedOrder);
    setEditingOrder(null);
  };
  const handleAddStory = async (data: { imageUrl: string; type: 'image' | 'video'; caption: string; productId?: string }) => {
    await addStory(data);
  };
  const handleDeleteStory = async (id: string) => {
    setViewingStoryId(null);
    try {
      await deleteStory(id);
    } catch (e) {
      console.error("Falha ao deletar story", e);
    }
  };
  const handleStoryView = (story: Story) => {
      if (currentUser && !currentUser.isAdmin) {
          markStoryAsViewed(story.id, currentUser.id);
      }
      setViewingStoryId(story.id);
  };
  const handleStoryProductLink = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setViewingStoryId(null);
      setViewingProduct(product);
    }
  };
  const handleEditHero = () => {
    heroFileInputRef.current?.click();
  };
  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await saveHeroImage(base64String);
        setHeroImage(base64String);
        setHeroImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleOpenPolicy = (type: 'about' | 'shipping' | 'warranty' | 'fees') => {
    if (!settings) return;
    const titles = {
      about: 'Sobre Nós',
      shipping: 'Política de Envio',
      warranty: 'Política de Garantia',
      fees: 'Taxas e Pagamentos'
    };
    const contents = {
      about: settings.aboutUs,
      shipping: settings.shippingPolicy,
      warranty: settings.warrantyPolicy,
      fees: settings.feesPolicy
    };
    setPolicyModal({
      isOpen: true,
      title: titles[type],
      content: contents[type] || 'Conteúdo não definido.'
    });
  };
  const handleSelectCategory = (cat: string | null) => {
    if (cat === selectedCategory) return;
    performTransition(() => {
        setSelectedCategory(cat);
        setCurrentPage(1); 
        setView('home');
    });
  };
  const handleSearchChange = (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
  };
  const handleSearchSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      performTransition(() => {});
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value as any;
      performTransition(() => {
          setSortBy(val);
          setCurrentPage(1);
      });
  };
  const handlePageChange = (newPage: number) => {
      performTransition(() => {
          setCurrentPage(newPage);
      });
  };

  const handleUpdateProfile = (updated: User) => {
      setCurrentUser(updated);
  };

  const isStaff = currentUser?.isAdmin || currentUser?.isVendor;
  const filteredProducts = useMemo(() => {
      let result = products.filter(p => p.available);
      if (selectedCategory === 'Novidades da Semana') {
          result = result.filter(p => {
             const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
             return (p.createdAt || 0) > oneWeekAgo;
          });
      } else if (selectedCategory) {
          result = result.filter(p => p.category === selectedCategory);
      }
      if (searchTerm.trim()) {
          const lowerTerm = searchTerm.toLowerCase();
          result = result.filter(p => p.name.toLowerCase().includes(lowerTerm));
      }
      switch (sortBy) {
          case 'price_asc':
              result.sort((a, b) => a.price - b.price);
              break;
          case 'price_desc':
              result.sort((a, b) => b.price - a.price);
              break;
          case 'views':
              result.sort((a, b) => (b.views || 0) - (a.views || 0));
              break;
          case 'newest':
              result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              break;
          default:
              break;
      }
      return result;
  }, [products, selectedCategory, searchTerm, sortBy]);

  const promoProducts = useMemo(() => 
    products.filter(p => p.available && p.isPromo), 
  [products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRelatedProducts = (current: Product | null) => {
    if (!current) return [];
    return products.filter(p => p.available && p.category === current.category && p.id !== current.id)
      .sort(() => 0.5 - Math.random()) 
      .slice(0, 3);
  };

  const performTransition = (action: () => void) => {
    setIsTransitioning(true);
    if (productAnchorRef.current) {
        const y = productAnchorRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTimeout(() => {
        action();
        setIsTransitioning(false);
    }, 2000); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-orange-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Carregando Loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      {isTransitioning && (
          <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center animate-fade-in">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Carregando produtos...</p>
              </div>
          </div>
      )}
      <input 
        type="file" 
        ref={heroFileInputRef}
        onChange={handleHeroFileChange}
        accept="image/*"
        className="hidden"
      />
      <Header 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onCartClick={handleHeaderCartClick} 
        currentUser={currentUser}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogoutClick={handleLogout}
        onMenuClick={() => setIsMenuOpen(true)}
        onAdminClick={() => setView('admin')} 
        onProfileClick={() => setIsProfileOpen(true)}
        onMyOrdersClick={() => setIsUserOrdersOpen(true)}
        logo={logo}
      />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {view === 'admin' && isStaff ? (
          <div className="animate-fade-in-up">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {currentUser?.isAdmin ? 'Painel Administrativo' : 'Painel do Vendedor'}
                </h1>
                <p className="text-gray-500 mt-2">Bem-vindo de volta, {currentUser?.name}.</p>
              </div>
              <button 
                onClick={() => setView('home')} 
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Voltar para Loja
              </button>
            </div>
            <AdminPanel 
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateDescription={handleDescriptionUpdate}
              onEditOrder={handleEditOrder}
            />
          </div>
        ) : (
          <div className="animate-fade-in-up">
             {(stories.length > 0 || isStaff) && (
               <div className="mb-6">
                 <StoryList 
                    stories={stories}
                    isAdmin={!!currentUser?.isAdmin} 
                    onAddClick={() => setIsStoryCreatorOpen(true)}
                    onStoryClick={handleStoryView}
                 />
               </div>
             )}
             {!selectedCategory && !searchTerm && (
                <div className="mb-10 rounded-2xl overflow-hidden shadow-lg relative group bg-gray-100 min-h-[100px]">
                  {heroImage && !heroImageError ? (
                    <img 
                      src={heroImage} 
                      alt="Capa da Loja" 
                      className="w-full h-auto max-h-[400px] object-cover" 
                      onError={() => setHeroImageError(true)}
                    />
                  ) : currentUser?.isAdmin ? (
                    <div className="w-full h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {heroImageError ? 'Erro ao carregar imagem. Clique para trocar.' : 'Definir Imagem de Capa'}
                      </span>
                    </div>
                  ) : null}
                  {currentUser?.isAdmin && (
                    <button 
                      onClick={handleEditHero}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full shadow-md hover:bg-white transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {heroImage && !heroImageError ? 'Trocar Capa' : 'Adicionar Capa'}
                    </button>
                  )}
                </div>
             )}
             <div className="flex flex-col mb-6">
                <div ref={productAnchorRef} className="scroll-mt-32"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-col">
                      <h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">Lojista Vip</span>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <form onSubmit={handleSearchSubmit} className="relative group w-full sm:w-64">
                          <input 
                              type="text"
                              placeholder="Buscar por nome..."
                              className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent block pl-10 p-2.5 outline-none shadow-sm transition-all"
                              value={searchTerm}
                              onChange={(e) => handleSearchChange(e.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                              </svg>
                          </div>
                      </form>
                      <div className="relative w-full sm:w-48">
                          <select 
                              value={sortBy}
                              onChange={handleSortChange}
                              className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-2.5 outline-none shadow-sm appearance-none cursor-pointer"
                          >
                              <option value="default">Padrão</option>
                              <option value="price_asc">💰 Menor Preço</option>
                              <option value="price_desc">💎 Maior Preço</option>
                              <option value="views">🔥 Mais Procurados</option>
                              <option value="newest">🆕 Recém Adicionados</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>
                  </div>
                </div>
                {!selectedCategory && !searchTerm && promoProducts.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-orange-600 mb-3 flex items-center gap-2">
                            <span className="text-xl">🔥</span> Ofertas Imperdíveis
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                            {promoProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onAddToCart={(p) => addToCart(p, 1)}
                                    onClick={(p) => setViewingProduct(p)}
                                    currentUser={currentUser}
                                    onEdit={currentUser?.isAdmin ? handleQuickEditProduct : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <CategoryFilter 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                />
             </div>
             {filteredProducts.length === 0 ? (
               <div className="text-center py-20 text-gray-400">
                 <p className="text-lg">
                     {products.length === 0 ? 'A loja está vazia. Adicione produtos no painel.' : 'Nenhum produto encontrado.'}
                 </p>
               </div>
             ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {displayedProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={(p) => addToCart(p, 1)}
                      onClick={(p) => setViewingProduct(p)}
                      currentUser={currentUser}
                      onEdit={currentUser?.isAdmin ? handleQuickEditProduct : undefined}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-10 gap-4">
                    <button 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
             )}
          </div>
        )}
      </main>
      <footer className="bg-zinc-900 border-t border-zinc-800 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <a 
            href="https://instagram.com/Lojista.vip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-500 font-bold mb-4 transition-colors text-lg"
          >
            @Lojista.vip
          </a>
          <p className="text-gray-400 text-sm mt-2">&copy; {new Date().getFullYear()} Lojista Vip. Todos os direitos reservados.</p>
        </div>
      </footer>
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQty}
        onCheckout={handleCheckout}
        onOpenMyOrders={currentUser && !currentUser.isAdmin && !currentUser.isVendor ? () => {
            setIsCartOpen(false);
            setIsUserOrdersOpen(true);
        } : undefined}
        isAdmin={!!currentUser?.isAdmin || !!currentUser?.isVendor}
        currentUser={currentUser}
      />
      <UserOrdersModal 
        isOpen={isUserOrdersOpen}
        onClose={() => setIsUserOrdersOpen(false)}
        user={currentUser}
      />
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdate={handleUpdateProfile}
      />
      <SalesArea 
        isOpen={isSalesAreaOpen}
        onClose={() => setIsSalesAreaOpen(false)}
        onEditItems={handleEditOrder}
        currentUser={currentUser}
      />
      <MenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectCategory={handleSelectCategory}
        onOpenPolicy={handleOpenPolicy}
        onContact={handleContact}
        onLogout={handleLogout}
        currentUser={currentUser}
        categories={categories}
        logo={logo}
      />
      <PolicyModal 
        isOpen={policyModal.isOpen}
        title={policyModal.title}
        content={policyModal.content}
        onClose={() => setPolicyModal({...policyModal, isOpen: false})}
      />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        logo={logo}
      />
      <StoryCreatorModal 
        isOpen={isStoryCreatorOpen}
        onClose={() => setIsStoryCreatorOpen(false)}
        onSave={handleAddStory}
        products={products}
      />
      {viewingStoryId && (
        <StoryViewer 
          stories={stories}
          initialStoryId={viewingStoryId}
          onClose={() => setViewingStoryId(null)}
          onDelete={handleDeleteStory}
          onGoToProduct={handleStoryProductLink}
          isAdmin={!!currentUser?.isAdmin} 
          users={currentUser?.isAdmin ? [] : undefined} 
        />
      )}
      <ProductDetails 
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onAddToCart={addToCart}
        relatedProducts={getRelatedProducts(viewingProduct)}
        onRelatedClick={(p) => setViewingProduct(p)}
      />
      <OrderEditModal 
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        onSave={handleSaveEditedOrder}
      />
      <ProductFormModal 
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        productToEdit={quickEditingProduct}
        onSave={handleQuickSaveProduct}
        categories={categories}
      />
      <OrderSuccessModal 
        isOpen={showOrderSuccess} 
        onClose={() => setShowOrderSuccess(false)} 
        onOpenMyOrders={() => { setShowOrderSuccess(false); setIsUserOrdersOpen(true); }}
        order={lastOrderForWhatsapp} 
      />
    </div>
  );
}

export default App;