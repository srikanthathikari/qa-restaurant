import React, { useMemo, useState, useEffect } from "react";

// -----------------------------
// Simple in-memory data + helpers
// -----------------------------
const CURRENCY = (n) => `$${n.toFixed(2)}`;

const FEATURE_FLAGS = {
  BUG_TAX_RATE_ROUNDING: true,
  BUG_RESERVATION_MIN_PARTY: true,
  BUG_EXPIRY_LENIENT: true,
  BUG_SEARCH_CASE_SENSITIVE: true,
};

const TAX_RATE = 0.0825;
const MIN_PARTY_SIZE = 2;

const MENU = [
  { id: "m1", name: "Margherita Pizza", price: 11.5, tags: ["veg", "pizza"], description: "Fresh mozzarella, tomato sauce, and basil" },
  { id: "m2", name: "Pepperoni Pizza", price: 13.0, tags: ["pizza"], description: "Spicy pepperoni with melted cheese" },
  { id: "m3", name: "Paneer Tikka", price: 12.0, tags: ["veg", "indian"], description: "Grilled cottage cheese with aromatic spices" },
  { id: "m4", name: "Chicken Biryani", price: 14.25, tags: ["indian"], description: "Fragrant rice with tender chicken and spices" },
  { id: "m5", name: "Caesar Salad", price: 9.5, tags: ["salad"], description: "Crisp romaine, parmesan, and caesar dressing" },
  { id: "m6", name: "Butter Naan", price: 3.5, tags: ["indian", "bread"], description: "Soft, buttery flatbread" },
  { id: "m7", name: "Tomato Soup", price: 6.75, tags: ["soup", "veg"], description: "Rich tomato soup with herbs" },
  { id: "m8", name: "Gulab Jamun", price: 5.25, tags: ["dessert", "indian"], description: "Sweet milk dumplings in rose syrup" },
];

function Button({ children, onClick, className = "", type = "button", disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl shadow text-sm font-medium border hover:shadow-md active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow p-4 bg-white ${className}`}>{children}</div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </div>
      {children}
    </label>
  );
}

// -----------------------------
// Cart logic
// -----------------------------
function useCart() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("qa_cart");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("qa_cart", JSON.stringify(items));
  }, [items]);

  const add = (id) => setItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const remove = (id) => setItems((prev) => {
    const qty = (prev[id] || 0) - 1;
    const next = { ...prev };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    return next;
  });
  const clear = () => setItems({});

  const lines = Object.entries(items).map(([id, qty]) => ({
    ...(MENU.find((m) => m.id === id) || { id, name: "Unknown", price: 0, tags: [] }),
    qty,
    subtotal: qty * (MENU.find((m) => m.id === id)?.price || 0),
  }));

  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const tax = FEATURE_FLAGS.BUG_TAX_RATE_ROUNDING
    ? Math.round(subtotal * TAX_RATE * 100) / 100
    : subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { items, add, remove, clear, lines, subtotal, tax, total };
}

// -----------------------------
// Menu Item Component
// -----------------------------
function MenuItem({ item, onAddToCart }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">{CURRENCY(item.price)}</div>
        </div>
      </div>
      <Button 
        onClick={() => onAddToCart(item.id)}
        className="w-full bg-green-600 text-white border-green-600 hover:bg-green-700"
      >
        Add to Cart
      </Button>
    </Card>
  );
}

// -----------------------------
// Cart Component
// -----------------------------
function Cart({ cart, onCheckout, onClose }) {
  if (cart.lines.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Your Cart is Empty</h3>
            <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
            <Button onClick={onClose} className="bg-gray-600 text-white border-gray-600">
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-3 mb-4">
          {cart.lines.map(line => (
            <div key={line.id} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex-1">
                <div className="font-medium">{line.name}</div>
                <div className="text-sm text-gray-600">{CURRENCY(line.price)} × {line.qty}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => cart.remove(line.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 border-red-200"
                >
                  -
                </Button>
                <span className="font-medium">{line.qty}</span>
                <Button 
                  onClick={() => cart.add(line.id)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-600 border-green-200"
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{CURRENCY(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax:</span>
            <span>{CURRENCY(cart.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{CURRENCY(cart.total)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button 
            onClick={onCheckout}
            className="w-full bg-green-600 text-white border-green-600 hover:bg-green-700"
          >
            Checkout
          </Button>
          <Button 
            onClick={cart.clear}
            className="w-full bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
          >
            Clear Cart
          </Button>
        </div>
      </Card>
    </div>
  );
}

// -----------------------------
// Home Page Component
// -----------------------------
function HomePage({ cart, onAddToCart, onOpenCart }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...new Set(MENU.flatMap(item => item.tags))];
  
  const filteredMenu = useMemo(() => {
    let filtered = MENU;
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.tags.includes(selectedCategory));
    }
    
    if (searchTerm) {
      const term = FEATURE_FLAGS.BUG_SEARCH_CASE_SENSITIVE ? searchTerm : searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const searchText = FEATURE_FLAGS.BUG_SEARCH_CASE_SENSITIVE ? item.name : item.name.toLowerCase();
        return searchText.includes(term);
      });
    }
    
    return filtered;
  }, [searchTerm, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🍕 Fresh Bites</h1>
        <p className="text-xl text-gray-600">Delicious food delivered to your doorstep</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for your favorite dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-3 text-gray-400">🔍</div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredMenu.map(item => (
          <MenuItem key={item.id} item={item} onAddToCart={onAddToCart} />
        ))}
      </div>

      {/* Cart Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={onOpenCart}
          className="bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-lg"
        >
          🛒 Cart ({Object.keys(cart.items).length})
        </Button>
      </div>
    </div>
  );
}

// -----------------------------
// Checkout Page Component
// -----------------------------
function CheckoutPage({ cart, onOrderPlaced, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    deliveryInstructions: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onOrderPlaced();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={onBack} className="mb-4 bg-gray-600 text-white border-gray-600">
          ← Back to Menu
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {cart.lines.map(line => (
              <div key={line.id} className="flex justify-between">
                <span>{line.name} × {line.qty}</span>
                <span>{CURRENCY(line.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{CURRENCY(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax:</span>
              <span>{CURRENCY(cart.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{CURRENCY(cart.total)}</span>
            </div>
          </div>
        </Card>

        {/* Delivery Form */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" required>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </Field>
            
            <Field label="Email" required>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </Field>
            
            <Field label="Phone" required>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </Field>
            
            <Field label="Delivery Address" required>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </Field>
            
            <Field label="Delivery Instructions">
              <textarea
                value={formData.deliveryInstructions}
                onChange={(e) => setFormData({...formData, deliveryInstructions: e.target.value})}
                rows="2"
                placeholder="Any special instructions for delivery?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </Field>

            <Button
              type="submit"
              className="w-full bg-green-600 text-white border-green-600 hover:bg-green-700"
            >
              Place Order - {CURRENCY(cart.total)}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// -----------------------------
// Root App Component
// -----------------------------
export function App() {
  const [route, setRoute] = useState("home");
  const [showCart, setShowCart] = useState(false);
  const cart = useCart();

  const [toast, setToast] = useState("");
  
  const addToCart = (id) => {
    cart.add(id);
    setToast("Added to cart!");
    setTimeout(() => setToast(""), 2000);
  };

  const onOrderPlaced = () => {
    cart.clear();
    setToast("Order placed successfully! 🎉");
    setRoute("home");
    setTimeout(() => setToast(""), 3000);
  };

  const renderPage = () => {
    switch (route) {
      case "checkout":
        return <CheckoutPage cart={cart} onOrderPlaced={onOrderPlaced} onBack={() => setRoute("home")} />;
      default:
        return <HomePage cart={cart} onAddToCart={addToCart} onOpenCart={() => setShowCart(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-green-600">🍕 Fresh Bites</h1>
              <div className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setRoute("home")}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    route === "home" 
                      ? "bg-green-100 text-green-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Menu
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCart(true)}
                className="bg-green-600 text-white border-green-600 hover:bg-green-700"
              >
                🛒 Cart ({Object.keys(cart.items).length})
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20">
        {renderPage()}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <Cart 
          cart={cart} 
          onCheckout={() => {
            setShowCart(false);
            setRoute("checkout");
          }}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
