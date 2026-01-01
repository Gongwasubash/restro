
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, LogOut, User as UserIcon, ChefHat, Menu as MenuIcon, X, 
  LayoutDashboard, History, Package, Home as HomeIcon, AlertTriangle, 
  ExternalLink, CheckCircle2, Trash2, Plus, Minus, Edit2, Loader2, MapPin, 
  Phone, Mail, UtensilsCrossed, Star, ShieldCheck, ArrowRight, Clock 
} from 'lucide-react';
import { User, Product, OrderItem, Category, Order } from './types';
import { api, isApiConfigured, SCRIPT_ID } from './services/api';

// --- Contexts ---
const AuthContext = createContext<{
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
} | null>(null);

const CartContext = createContext<{
  cart: OrderItem[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: number;
} | null>(null);

// --- Components ---

const ProductDetailModal = ({ product, onClose, onAddToCart }: { product: Product, onClose: () => void, onAddToCart: (p: Product) => void }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        <div className="md:w-1/2 h-64 md:h-auto relative">
          <img src={product.imageURL} className="w-full h-full object-cover" alt={product.name} />
          <button onClick={onClose} className="absolute top-4 left-4 md:hidden bg-white/90 p-2 rounded-full shadow-lg">
            <X size={24} />
          </button>
        </div>
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <button onClick={onClose} className="hidden md:block absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition">
            <X size={28} />
          </button>
          <div className="mb-8">
            <span className="text-xs uppercase tracking-[0.2em] text-red-700 font-bold mb-3 block">{product.category}</span>
            <h2 className="text-4xl font-serif font-bold text-stone-800 mb-4">{product.name}</h2>
            <div className="h-1 w-16 bg-red-700 mb-6" />
            <p className="text-stone-600 leading-relaxed mb-8">{product.description}</p>
            <div className="text-3xl font-serif font-bold text-stone-900 mb-8">
              Rs. {Number(product.price).toLocaleString()}
            </div>
          </div>
          <button 
            onClick={() => { onAddToCart(product); onClose(); }}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center space-x-3 shadow-lg hover:shadow-red-900/20"
          >
            <ShoppingCart size={20} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SetupWarning = () => {
  if (isApiConfigured) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-stone-200">
        <div className="flex items-center space-x-3 text-red-600 mb-6">
          <AlertTriangle size={32} />
          <h2 className="text-2xl font-bold">Backend Connection Required</h2>
        </div>
        <p className="text-stone-600 mb-6 font-medium">
          The app is ready, but it cannot talk to your Google Sheet yet. Follow these steps:
        </p>
        <ol className="space-y-4 mb-8 text-stone-700 text-sm list-decimal pl-4">
          <li>Ensure your Spreadsheet has sheets named: <strong>Products, Categories, Customers, Admins, Orders</strong>.</li>
          <li>In Apps Script editor, <strong>Run</strong> the <code className="bg-stone-100 px-1 rounded text-blue-700">getTableData</code> function once to trigger the <strong>Authorization Popup</strong>. Grant all permissions.</li>
          <li>Click <strong>Deploy > New Deployment</strong>, choose <strong>Web App</strong>, and ensure <i>"Who has access"</i> is set to <strong>"Anyone"</strong>.</li>
          <li>Copy the <strong>Deployment ID</strong> from the result and paste it into <code className="bg-stone-100 px-1 rounded">services/api.ts</code>.</li>
        </ol>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-700 text-white py-3 rounded-xl font-bold hover:bg-red-800 transition"
          >
            I've Authorized & Updated ID, Reload App
          </button>
          <a 
            href="https://script.google.com/home" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-stone-500 hover:text-stone-800 font-medium text-sm transition"
          >
            <span>Open Google Apps Script Dashboard</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8 text-red-700" />
              <span className="text-2xl font-serif font-bold text-stone-800 tracking-tight">Subash Royal</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-stone-600 hover:text-red-700 font-medium transition">Home</Link>
            <Link to="/menu" className="text-stone-600 hover:text-red-700 font-medium transition">Menu</Link>
            {auth?.user ? (
              <>
                {auth.user.role === 'admin' ? (
                  <Link to="/admin" className="flex items-center space-x-1 text-red-700 font-semibold">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                ) : (
                  <Link to="/orders" className="text-stone-600 hover:text-red-700 font-medium">My Orders</Link>
                )}
                <Link to="/cart" className="relative text-stone-600 hover:text-red-700">
                  <ShoppingCart size={24} />
                  {cart?.cart.length! > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {cart?.cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-3 pl-4 border-l border-stone-200">
                  <span className="text-sm font-medium text-stone-500">{auth.user.name}</span>
                  <button onClick={auth.logout} className="text-stone-400 hover:text-red-700 transition" title="Sign Out">
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-red-700 text-white px-6 py-2 rounded-full font-medium hover:bg-red-800 transition">
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600">
              {isOpen ? <X size={28} /> : <MenuIcon size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-stone-100 p-4 space-y-4">
          <Link to="/" className="block text-stone-600" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/menu" className="block text-stone-600" onClick={() => setIsOpen(false)}>Menu</Link>
          {auth?.user ? (
            <>
              {auth.user.role === 'admin' ? (
                <Link to="/admin" className="block text-red-700 font-bold" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
              ) : (
                <Link to="/orders" className="block text-stone-600" onClick={() => setIsOpen(false)}>My Orders</Link>
              )}
              <Link to="/cart" className="block text-stone-600" onClick={() => setIsOpen(false)}>Cart ({cart?.cart.length})</Link>
              <button onClick={() => { auth.logout(); setIsOpen(false); }} className="block text-red-700">Logout</button>
            </>
          ) : (
            <Link to="/login" className="block text-red-700 font-bold" onClick={() => setIsOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-stone-900 text-stone-300 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center space-x-2 mb-6">
          <ChefHat className="w-10 h-10 text-red-600" />
          <span className="text-3xl font-serif font-bold text-white tracking-tight">Subash Royal</span>
        </div>
        <p className="max-w-md text-stone-400 leading-relaxed text-lg">
          Crafting exquisite culinary experiences in the heart of Kathmandu. We blend royal traditions with modern elegance to bring you the finest dining experience in Jhor.
        </p>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navigation</h4>
        <ul className="space-y-3 text-base">
          <li><Link to="/" className="hover:text-red-500 transition">Home</Link></li>
          <li><Link to="/menu" className="hover:text-red-500 transition">Our Menu</Link></li>
          <li><Link to="/cart" className="hover:text-red-500 transition">Your Cart</Link></li>
          <li><Link to="/login" className="hover:text-red-500 transition">Member Access</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Get in Touch</h4>
        <ul className="space-y-4 text-base">
          <li className="flex items-start space-x-3">
            <MapPin size={20} className="text-red-600 mt-1 flex-shrink-0" />
            <span>Kathmandu, Jhor</span>
          </li>
          <li className="flex items-center space-x-3">
            <Phone size={20} className="text-red-600 flex-shrink-0" />
            <span>9840564096</span>
          </li>
          <li className="flex items-center space-x-3">
            <Mail size={20} className="text-red-600 flex-shrink-0" />
            <span className="break-all">subashgongwanepal@gmail.com</span>
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-stone-800 text-center text-xs text-stone-500 uppercase tracking-widest">
      &copy; {new Date().getFullYear()} Subash Royal. All Rights Reserved. Designed for Excellence.
    </div>
  </footer>
);

// --- Pages ---

const Home = () => {
  const [specials, setSpecials] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const cartCtx = useContext(CartContext);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      if (!isApiConfigured) {
        setLoading(false);
        return;
      }
      try {
        const productRes = await api.getProducts();
        if (productRes.success && productRes.data) {
          setSpecials(productRes.data.slice(0, 3));
        }

        if (authCtx?.user && authCtx.user.role === 'customer') {
          const orderRes = await api.getOrders(authCtx.user.id);
          if (orderRes.success && orderRes.data) {
            const sorted = [...orderRes.data].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setUserOrders(sorted.slice(0, 2));
          }
        }
      } catch (err) {
        console.error("Failed to fetch home data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authCtx?.user]);

  return (
    <div className="flex flex-col">
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/45 z-10" />
        <img 
          src="https://jimbuthakali.com/storage/uploads/banner/2025-07-21-9694.webp" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Subash Royal Atmosphere"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl">
          {authCtx?.user && (
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <span className="bg-red-700/90 backdrop-blur text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg inline-block">
                 Welcome back, {authCtx.user.name}
               </span>
            </div>
          )}
          <span className="text-white/80 uppercase tracking-[0.4em] text-sm mb-4 block animate-fade-in">Established in Kathmandu</span>
          <h1 className="text-6xl md:text-8xl text-white font-bold mb-8 drop-shadow-lg text-shadow">Subash Royal</h1>
          <p className="text-xl md:text-2xl text-stone-100 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the pinnacle of fine dining in Jhor. Where every ingredient tells a story of heritage and passion.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/menu" className="bg-red-700 text-white px-10 py-4 rounded-full font-bold hover:bg-red-800 transition transform hover:scale-105 shadow-xl">
              View Menu
            </Link>
            {!authCtx?.user && (
              <Link to="/login" className="bg-white/10 backdrop-blur text-white border border-white/30 px-10 py-4 rounded-full font-bold hover:bg-white hover:text-stone-900 transition transform hover:scale-105 shadow-xl">
                Join Us
              </Link>
            )}
          </div>
        </div>
      </section>

      {authCtx?.user && authCtx.user.role === 'customer' && userOrders.length > 0 && (
        <section className="py-12 bg-stone-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex-1 w-full">
                <div className="flex items-center space-x-3 mb-4 text-red-700 border-b border-stone-50 pb-2">
                  <Clock size={20} />
                  <h3 className="font-bold text-lg">Your Recent Activity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userOrders.map(order => (
                    <div key={order.orderId} className="flex justify-between items-center p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                      <div>
                        <p className="font-bold text-stone-800">Order #{order.orderId}</p>
                        <p className="text-xs text-stone-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-900">Rs. {Number(order.totalPrice).toLocaleString()}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                          order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 
                          order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Link to="/orders" className="flex items-center space-x-2 bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition shadow-lg">
                  <span>Full Order History</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other sections (Story, Excellence, Specials) remain largely unchanged for aesthetics */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-stone-100 rounded-full -z-10 group-hover:scale-110 transition duration-1000" />
            <img 
              src="https://superdesk-pro-c.s3.amazonaws.com/sd-nepalitimes/20221109191112/636bed924b0ad905ca02eef2jpeg.jpg" 
              className="rounded-[2.5rem] shadow-2xl relative z-10 w-full h-[600px] object-cover border-8 border-white group-hover:shadow-red-700/10 transition duration-500" 
              alt="Executive Chef" 
            />
            <div className="absolute -bottom-6 -right-6 bg-stone-900 text-white p-10 rounded-[2rem] shadow-2xl z-20 group-hover:-translate-y-2 transition duration-500">
              <span className="text-5xl font-serif font-bold block mb-1 text-red-600">12+</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">Award Winning Cuisine</span>
            </div>
          </div>
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-red-700 font-bold uppercase tracking-[0.3em] text-sm">The Artist Behind the Dish</span>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-stone-800 leading-[1.1]">Crafting Memories Through Fine Taste</h2>
              <div className="w-20 h-1.5 bg-red-700 rounded-full"></div>
            </div>
            <p className="text-xl text-stone-600 leading-relaxed font-light">
              Founded in the serene landscapes of Jhor, Kathmandu, Subash Royal began with a single vision: to bring authentic, high-end culinary experiences to our community. 
            </p>
            <Link to="/menu" className="inline-flex items-center space-x-3 text-stone-900 font-bold text-lg border-b-2 border-red-700 pb-2 hover:text-red-700 transition group">
              <span>Reserve Your Table</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* Specials Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
             <span className="text-red-700 font-bold uppercase tracking-[0.2em] text-sm mb-4 block">Featured</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-6">Today's Royal Specials</h2>
            <div className="w-20 h-1 bg-red-700 mx-auto"></div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-red-700" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {specials.map((product) => (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group cursor-pointer border border-stone-100">
                  <div className="h-72 overflow-hidden relative">
                    <img src={product.imageURL} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.name} />
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-serif font-bold text-stone-800">{product.name}</h3>
                      <span className="text-red-700 font-bold text-lg">Rs. {Number(product.price).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={(p) => cartCtx?.addToCart(p)}
        />
      )}
    </div>
  );
};

// ... AdminDashboard Component refined to check for Admin Role ...
const AdminDashboard = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ 
    name: '', price: 0, category: '', description: '', imageURL: '', activeStatus: true 
  });

  // Security: Check if user is admin, else redirect
  useEffect(() => {
    if (!auth?.user || auth.user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [auth, navigate]);

  const fetchData = async () => {
    if (!isApiConfigured) return;
    const [pRes, oRes, cRes] = await Promise.all([
      api.getProducts(),
      api.getOrders(),
      api.getCategories()
    ]);
    if (pRes.success) setProducts(pRes.data || []);
    if (oRes.success) setOrders(oRes.data || []);
    if (cRes.success) setCategories(cRes.data || []);
  };

  const handleEditClick = (p: Product) => {
    setNewProduct(p);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setNewProduct({ name: '', price: 0, category: '', description: '', imageURL: '', activeStatus: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = isEditing 
        ? await api.updateProduct(newProduct as Product)
        : await api.addProduct(newProduct as Omit<Product, 'id'>);

      if (res.success) {
        alert(`Product ${isEditing ? 'updated' : 'added'} successfully!`);
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(res.message || "Operation failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const res = await api.deleteProduct(id);
      if (res.success) fetchData();
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await api.updateOrderStatus(id, status);
    if (res.success) {
      setOrders(orders.map(o => o.orderId === id ? { ...o, orderStatus: status as any } : o));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-4xl font-serif font-bold text-stone-800">Admin Command Center</h1>
           <p className="text-stone-400 text-sm mt-1 uppercase tracking-widest">Logged in as {auth?.user?.name}</p>
        </div>
        {activeTab === 'products' && (
          <button 
            onClick={handleAddClick}
            className="bg-red-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-xl shadow-red-700/30 hover:bg-red-800 transition"
          >
            <Plus size={20} />
            <span>Add New Item</span>
          </button>
        )}
      </div>
      
      <div className="flex space-x-6 mb-10 border-b border-stone-200">
        {(['products', 'orders', 'categories'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] border-b-4 transition duration-300 ${
              activeTab === tab ? 'border-red-700 text-red-700' : 'border-transparent text-stone-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-[0.2em] border-b border-stone-100">
                <th className="px-8 py-5">Product Name</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5 text-right">Unit Price</th>
                <th className="px-8 py-5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-stone-50/50 transition">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <img src={p.imageURL} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-800">{p.name}</span>
                        {!p.activeStatus && <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Inactive</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5"><span className="text-stone-400 text-sm font-medium">{p.category}</span></td>
                  <td className="px-8 py-5 text-right font-serif font-bold text-stone-900">Rs. {Number(p.price).toLocaleString()}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center space-x-3">
                      <button onClick={() => handleEditClick(p)} className="p-2.5 bg-stone-100 rounded-xl text-stone-400 hover:text-blue-600 transition hover:bg-blue-50">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-stone-100 rounded-xl text-stone-400 hover:text-red-700 transition hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-[0.2em] border-b border-stone-100">
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Date Placed</th>
                <th className="px-8 py-5">Order Status</th>
                <th className="px-8 py-5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map(o => (
                <tr key={o.orderId} className="hover:bg-stone-50 transition">
                  <td className="px-8 py-5 font-bold text-stone-800">#{o.orderId}</td>
                  <td className="px-8 py-5 text-stone-400 text-sm font-medium">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <select 
                      value={o.orderStatus}
                      onChange={(e) => handleStatusUpdate(o.orderId, e.target.value)}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-stone-100 bg-stone-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-8 py-5 text-right font-serif font-bold text-stone-900">Rs. {Number(o.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-stone-800">{isEditing ? 'Edit Menu Entry' : 'New Menu Entry'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-50 rounded-full transition"><X /></button>
            </div>
            <form onSubmit={handleSubmitProduct} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                <input required className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <select required className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                    <option value="">Select Category</option>
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Price (Rs.)</label>
                  <input required type="number" className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold hover:bg-red-700 transition flex items-center justify-center space-x-3">
                {isSubmitting && <Loader2 className="animate-spin" />}
                <span>{isEditing ? 'Save Changes' : 'Complete Addition'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ... Remaining Pages (Cart, Login, Orders, etc.) refined ...

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.user) {
      const target = auth.user.role === 'admin' ? '/admin' : '/';
      navigate(target, { replace: true });
    }
  }, [auth?.user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = isLogin ? await api.login(email, password) : await api.register(name, email, password);
      if (res.success && res.data) {
        auth?.login(res.data.user);
      } else {
        alert(res.message || "Authentication failed. Check your credentials.");
      }
    } catch (error) {
      alert("A network error occurred. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-100/50">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-stone-100 shadow-2xl shadow-stone-200/40">
        <div className="flex justify-center mb-10">
          <div className="bg-red-50 p-6 rounded-full">
            <ChefHat size={56} className="text-red-700" />
          </div>
        </div>
        <h2 className="text-4xl font-serif font-bold text-center text-stone-800 mb-3">{isLogin ? 'Welcome Back' : 'Join the Club'}</h2>
        <p className="text-center text-stone-400 text-sm mb-12 tracking-wide uppercase">Member Access</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input placeholder="Ex: John Doe" required className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input type="email" placeholder="email@example.com" required className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Security Key</label>
            <input type="password" placeholder="••••••••" required className="w-full border-stone-100 bg-stone-50 p-4 rounded-2xl outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white py-5 rounded-[2rem] font-bold hover:bg-red-700 transition flex items-center justify-center">
            {loading && <Loader2 className="animate-spin mr-2" size={20} />}
            <span>{isLogin ? 'Enter Dining Room' : 'Start Journey'}</span>
          </button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-stone-500 text-sm font-medium hover:text-stone-900 transition mt-4">
            {isLogin ? "Become a Member" : "Have an account? Access Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Menu Component ---
const Menu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const cartCtx = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([api.getProducts(), api.getCategories()]);
        if (pRes.success) setProducts(pRes.data || []);
        if (cRes.success) setCategories(cRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-stone-800 mb-4">Royal Menu</h1>
        <p className="text-stone-500 uppercase tracking-widest text-sm">Discover Our Culinary Masterpieces</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`px-8 py-2 rounded-full font-bold transition ${activeCategory === 'All' ? 'bg-red-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-8 py-2 rounded-full font-bold transition ${activeCategory === cat.name ? 'bg-red-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-700" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 group">
              <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <img src={product.imageURL} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.name} />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="bg-white text-stone-900 px-6 py-2 rounded-full font-bold text-sm">View Details</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-stone-800">{product.name}</h3>
                  <span className="text-red-700 font-bold">Rs. {Number(product.price).toLocaleString()}</span>
                </div>
                <p className="text-stone-500 text-sm line-clamp-2 mb-6">{product.description}</p>
                <button 
                  onClick={() => cartCtx?.addToCart(product)}
                  className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={(p) => cartCtx?.addToCart(p)}
        />
      )}
    </div>
  );
};

// --- Cart Component ---
const Cart = () => {
  const cartCtx = useContext(CartContext);
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOrdering, setIsOrdering] = useState(false);

  if (!cartCtx || cartCtx.cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart size={64} className="mx-auto text-stone-200 mb-6" />
        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4">Your cart is empty</h2>
        <p className="text-stone-500 mb-8">It seems you haven't added anything to your cart yet.</p>
        <Link to="/menu" className="inline-block bg-red-700 text-white px-10 py-4 rounded-full font-bold hover:bg-red-800 transition shadow-lg">
          Explore Menu
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!authCtx?.user) {
      navigate('/login');
      return;
    }

    setIsOrdering(true);
    try {
      const orderData: Partial<Order> = {
        customerId: authCtx.user.id,
        itemsJSON: JSON.stringify(cartCtx.cart),
        totalPrice: cartCtx.total,
        orderStatus: 'Pending',
        paymentStatus: 'Pending'
      };

      const res = await api.createOrder(orderData);
      if (res.success) {
        cartCtx.clearCart();
        alert("Order placed successfully! Redirecting to your orders...");
        navigate('/orders');
      } else {
        alert(res.message || "Failed to place order.");
      }
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif font-bold text-stone-800 mb-10">Your Selection</h1>
      <div className="space-y-6 mb-12">
        {cartCtx.cart.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-stone-800">{item.name}</h3>
              <p className="text-stone-500 font-serif">Rs. {item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center bg-stone-50 rounded-lg p-1 border border-stone-200">
                <button onClick={() => cartCtx.updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded transition text-stone-400 hover:text-red-700"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold text-stone-800">{item.quantity}</span>
                <button onClick={() => cartCtx.updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded transition text-stone-400 hover:text-red-700"><Plus size={16} /></button>
              </div>
              <p className="w-24 text-right font-serif font-bold text-stone-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
              <button onClick={() => cartCtx.removeFromCart(item.id)} className="text-stone-300 hover:text-red-700 transition"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-stone-800 pb-8">
          <span className="text-stone-400 font-bold uppercase tracking-widest text-sm">Grand Total</span>
          <span className="text-4xl font-serif font-bold">Rs. {cartCtx.total.toLocaleString()}</span>
        </div>
        <button 
          onClick={handleCheckout}
          disabled={isOrdering}
          className="w-full bg-red-700 text-white py-5 rounded-2xl font-bold hover:bg-red-800 transition transform hover:scale-[1.02] shadow-xl flex items-center justify-center space-x-3"
        >
          {isOrdering ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
          <span>{authCtx?.user ? 'Complete Royal Order' : 'Login to Order'}</span>
        </button>
      </div>
    </div>
  );
};

// --- Orders Component ---
const Orders = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.user) {
      navigate('/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await api.getOrders(auth.user!.id);
        if (res.success && res.data) {
          const sorted = [...res.data].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [auth, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-700" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif font-bold text-stone-800 mb-4">Order History</h1>
      <p className="text-stone-500 uppercase tracking-widest text-xs mb-10">Tracking your culinary journeys</p>
      
      {orders.length === 0 ? (
        <div className="bg-stone-50 rounded-3xl p-12 text-center border border-stone-200">
          <Package size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 font-medium">No orders found yet.</p>
          <Link to="/menu" className="mt-6 inline-block text-red-700 font-bold border-b-2 border-red-700 pb-1">Start Ordering</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map(order => (
            <div key={order.orderId} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="bg-stone-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-stone-100">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm"><Package className="text-red-700" size={24} /></div>
                  <div>
                    <h3 className="font-bold text-stone-800">Order #{order.orderId}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-tighter">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-1">Total</p>
                    <p className="font-serif font-bold text-stone-900">Rs. {Number(order.totalPrice).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Items Ordered</p>
                <div className="space-y-3">
                  {JSON.parse(order.itemsJSON || '[]').map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-stone-600"><span className="font-bold text-stone-900">{item.quantity}x</span> {item.name}</span>
                      <span className="font-serif text-stone-400">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ... Root App Component ...
const App = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('subash_royal_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [cart, setCart] = useState<OrderItem[]>([]);

  const handleLoginState = (u: User) => {
    setUser(u);
    localStorage.setItem('subash_royal_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('subash_royal_user');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => setCart([]);
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Router>
      <AuthContext.Provider value={{ user, login: handleLoginState, logout: handleLogout }}>
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
          <AppContent />
        </CartContext.Provider>
      </AuthContext.Provider>
    </Router>
  );
};

const AppContent = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <SetupWarning />
    </div>
  );
};

export default App;
