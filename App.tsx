import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Story, User, ShopSettings, Order } from './types';
import { 
  subscribeToProducts,
  subscribeToStories,
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
  updateOrder
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

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSalesAreaOpen, setIsSalesAreaOpen] = useState(false);
  const [isUserOrdersOpen, setIsUserOrdersOpen] = useState(false); 
  
  const [view, setView] = useState<'home' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroImageError, setHeroImageError] = useState(false);
  const [logo, setLogo] = useState<string>('');
  
  // File Input Ref for Hero Image
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Story States
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);

  // Product Details State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Admin Edit Order State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Quick Edit Product State (Admin)
  const [quickEditingProduct, setQuickEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  // Policy Modal State
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  useEffect(() => {
    // 1. Subscribe to Products
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    // 2. Subscribe to Stories
    const unsubStories = subscribeToStories((data) => {
      setStories(data);
    });

    // 3. Load Async Settings/Images
    const loadAsyncData = async () => {
      const hImg = await getHeroImage();
      const lImg = await getLogo();
      const sets = await getShopSettings();
      setHeroImage(hImg);
      setLogo(lImg);
      setSettings(sets);
    };
    loadAsyncData();
    
    // 4. Check User
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.isAdmin) {
        // Admin
      } else if (user.savedCart) {
        setCart(user.savedCart); 
      }
    } 
    // REMOVED: else { setIsAuthOpen(true); } to prevent auto-open on load

    // Cleanup listeners
    return () => {
      unsubProducts();
      unsubStories();
    };
  }, []);

  // Separate effect for URL param to ensure products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const sharedProductId = params.get('productId');
      if (sharedProductId) {
        const product = products.find(p => p.id === sharedProductId);
        if (product) {
          setViewingProduct(product);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [products]);

  // Sync Cart to User Storage whenever it changes
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      saveUserCart(currentUser.id, cart);
    }
  }, [cart, currentUser]);

  // Reset image error when URL changes
  useEffect(() => {
    setHeroImageError(false);
  }, [heroImage]);

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

  const handleCheckout = (
      extras: { wantsInvoice: boolean; wantsInsurance: boolean },
      customerOverride?: { user: User, address: any }
  ) => {
    // AUTH CHECK: Open modal if not logged in
    if (!currentUser) {
      setIsCartOpen(false); // Close cart so auth modal is visible clearly
      setIsAuthOpen(true);
      return;
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const invoiceFee = extras.wantsInvoice ? subtotal * 0.06 : 0;
    const insuranceFee = extras.wantsInsurance ? subtotal * 0.03 : 0;
    const total = subtotal + invoiceFee + insuranceFee;
    
    // Determine who is the "User" for the order
    // If Admin selected a customer, use that customer. Otherwise use current user.
    const targetUser = customerOverride ? customerOverride.user : currentUser;
    const targetAddress = customerOverride ? customerOverride.address : null;

    // Create the Order Object locally
    // Save order if it's a regular user OR if it's an admin placing order for a user
    if ((currentUser && !currentUser.isAdmin) || (currentUser?.isAdmin && targetUser)) {
      const newOrder: Order = {
        id: Date.now().toString(), // Temp ID, storage will generate Firestore ID
        userId: targetUser.id,
        userName: targetUser.name,
        userPhone: targetUser.phone || '',
        
        // Use Address override if provided (Admin Mode), else fallback to user profile
        userCep: targetAddress?.cep || targetUser.cep,
        userCity: targetAddress?.city || targetUser.city,
        userStreet: targetAddress?.street,
        userNumber: targetAddress?.number,
        userDistrict: targetAddress?.district,

        items: [...cart],
        total: total,
        wantsInvoice: extras.wantsInvoice,
        wantsInsurance: extras.wantsInsurance,
        status: 'orcamento',
        createdAt: Date.now(),
        history: [{ status: 'orcamento', timestamp: Date.now() }]
      };
      saveOrder(newOrder);
      // Clear cart after creating order
      setCart([]);
    }

    // Build WA Message
    const lines = cart.map(item => {
      let line = `- ${item.quantity}x ${item.name}`;
      line += `\n   (Un: R$ ${item.price.toFixed(2)})`; // Explicit Unit Price
      if (item.note) line += `\n   Obs: ${item.note}`;
      return line;
    });

    let customerInfo = "";
    if (targetUser) {
        customerInfo += `\n*Cliente:* ${targetUser.name}`;
        customerInfo += `\n*Tel:* ${targetUser.phone || 'Não informado'}`;
        
        // Format address for message
        if (targetAddress && targetAddress.street) {
             customerInfo += `\n*Endereço:* ${targetAddress.street}, ${targetAddress.number || 'S/N'}`;
             if(targetAddress.district) customerInfo += ` - ${targetAddress.district}`;
             if(targetAddress.city) customerInfo += `\n${targetAddress.city}`;
             if(targetAddress.cep) customerInfo += ` (CEP: ${targetAddress.cep})`;
        } else if (targetUser.city) {
            customerInfo += `\n*Endereço:* ${targetUser.city}`;
            if (targetUser.cep) customerInfo += ` - CEP: ${targetUser.cep}`;
        }
    }

    let extraInfo = "";
    if (extras.wantsInvoice) extraInfo += "\n*Com Nota Fiscal*";
    if (extras.wantsInsurance) extraInfo += "\n*Com Seguro*";

    const text = 
`*Novo Pedido - Lojista Vip*
----------------------------
${lines.join('\n')}
----------------------------
${extraInfo}
*Total Estimado: R$ ${total.toFixed(2)}*
${customerInfo}

*Aguardando cálculo do frete e confirmação...*
`;
    
    const encodedText = encodeURIComponent(text);
    const phoneNumber = settings?.contactNumber || '5562992973853';
    // Using api.whatsapp.com ensures deep linking works correctly on all devices to fill the text box
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedText}`, '_blank');
    setIsCartOpen(false);
  };

  const handleContact = () => {
    window.open(`https://api.whatsapp.com/send?phone=5562992973853`, '_blank');
  };

  const handleLogin = async (u: string, p: string, remember: boolean) => {
    const result = await loginUser(u, p, remember);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      if (result.user.savedCart) {
        setCart(result.user.savedCart);
      }
      if (result.user.isAdmin) {
        setView('admin');
      }
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
    // Do not open auth modal on logout
  };

  // Header Icon Logic
  const handleHeaderCartClick = () => {
    if (currentUser?.isAdmin) {
      // Admin opens Sales Area
      setIsSalesAreaOpen(true);
    } else {
      // User opens Cart
      setIsCartOpen(true);
    }
  };

  // Admin Product Actions
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

  // Admin Order Edit
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleSaveEditedOrder = async (updatedOrder: Order) => {
    await updateOrder(updatedOrder);
    setEditingOrder(null);
  };

  // Story Actions
  const handleAddStory = async (data: { imageUrl: string; type: 'image' | 'video'; caption: string; productId?: string }) => {
    await addStory(data);
  };

  const handleDeleteStory = async (id: string) => {
    if(confirm("Apagar este story?")) {
      await deleteStory(id);
      setViewingStoryId(null);
    }
  };

  const handleStoryProductLink = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setViewingStoryId(null);
      setViewingProduct(product);
    }
  };

  // Trigger File Input for Hero
  const handleEditHero = () => {
    heroFileInputRef.current?.click();
  };

  // Handle File Selection
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
    setSelectedCategory(cat);
    setCurrentPage(1); // Reset to page 1 on filter
    setView('home');
  };

  const isAdmin = currentUser?.isAdmin || false;

  // Filter products: Category AND Availability (unless admin)
  const availableProducts = isAdmin ? products : products.filter(p => p.available);
  const filteredProducts = selectedCategory 
    ? availableProducts.filter(p => p.category === selectedCategory)
    : availableProducts;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRelatedProducts = (current: Product | null) => {
    if (!current) return [];
    return availableProducts
      .filter(p => p.category === current.category && p.id !== current.id)
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, 3);
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
      {/* Hidden File Input for Hero Edit */}
      <input 
        type="file" 
        ref={heroFileInputRef}
        onChange={handleHeroFileChange}
        accept="image/*"
        className="hidden"
      />

      <Header 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)} // Keep default to open cart, admin icon handles sales area
        currentUser={currentUser}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogoutClick={handleLogout}
        onMenuClick={() => setIsMenuOpen(true)}
        onAdminClick={() => setIsSalesAreaOpen(true)} // Admin Link opens Sales Area
        logo={logo}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {view === 'admin' && isAdmin ? (
          <div className="animate-fade-in-up">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
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
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateDescription={handleDescriptionUpdate}
              onEditOrder={handleEditOrder}
            />
          </div>
        ) : (
          <div className="animate-fade-in-up">
             {/* Stories Section */}
             {(stories.length > 0 || isAdmin) && (
               <div className="mb-6">
                 <StoryList 
                    stories={stories}
                    isAdmin={isAdmin}
                    onAddClick={() => setIsStoryCreatorOpen(true)}
                    onStoryClick={(story) => setViewingStoryId(story.id)}
                 />
               </div>
             )}

             {/* Dynamic Hero Cover Section */}
             {!selectedCategory && (
                <div className="mb-10 rounded-2xl overflow-hidden shadow-lg relative group bg-gray-100 min-h-[100px]">
                  {heroImage && !heroImageError ? (
                    <img 
                      src={heroImage} 
                      alt="Capa da Loja" 
                      className="w-full h-auto max-h-[400px] object-cover" 
                      onError={() => setHeroImageError(true)}
                    />
                  ) : isAdmin ? (
                    <div className="w-full h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {heroImageError ? 'Erro ao carregar imagem. Clique para trocar.' : 'Definir Imagem de Capa'}
                      </span>
                    </div>
                  ) : null}

                  {isAdmin && (
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2>
                  <div className="flex gap-2">
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">Lojista Vip</span>
                  </div>
                </div>
                
                <CategoryFilter 
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                />
             </div>

             {filteredProducts.length === 0 ? (
               <div className="text-center py-20 text-gray-400">
                 <p className="text-lg">Nenhum produto encontrado nesta categoria.</p>
               </div>
             ) : (
              <>
                {/* Product Grid: 2 cols on mobile, 4 cols on large screens */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {displayedProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={(p) => addToCart(p, 1)}
                      onClick={(p) => setViewingProduct(p)}
                      currentUser={currentUser}
                      onEdit={handleQuickEditProduct}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-10 gap-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
          {/* Instagram Button */}
          <a 
            href="https://instagram.com/Lojista.vip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-400 font-bold mb-4 transition-colors text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
            </svg>
            @Lojista.vip
          </a>
          <p className="text-gray-400 text-sm mt-2">&copy; {new Date().getFullYear()} Lojista Vip. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://api.whatsapp.com/send?phone=5562992973853" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-[90] bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
        aria-label="Fale Conosco no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>

      {/* Modals & Drawers */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQty}
        onCheckout={handleCheckout}
        onOpenMyOrders={currentUser && !currentUser.isAdmin ? () => {
            setIsCartOpen(false);
            setIsUserOrdersOpen(true);
        } : undefined}
        isAdmin={!!currentUser?.isAdmin}
      />

      <UserOrdersModal 
        isOpen={isUserOrdersOpen}
        onClose={() => setIsUserOrdersOpen(false)}
        currentUser={currentUser}
      />

      {/* Admin Sales Area */}
      <SalesArea 
        isOpen={isSalesAreaOpen}
        onClose={() => setIsSalesAreaOpen(false)}
        onEditItems={handleEditOrder}
      />

      <MenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectCategory={handleSelectCategory}
        onOpenPolicy={handleOpenPolicy}
        onContact={handleContact}
        onLogout={handleLogout}
        currentUser={currentUser}
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
          isAdmin={isAdmin}
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

      {/* Quick Edit Modal for Admins */}
      <ProductFormModal 
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        productToEdit={quickEditingProduct}
        onSave={handleQuickSaveProduct}
      />
    </div>
  );
}

export default App;