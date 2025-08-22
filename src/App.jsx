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
  { 
    id: "m1", 
    name: "Margherita Pizza", 
    price: 11.5, 
    tags: ["veg", "pizza"], 
    description: "Fresh mozzarella, tomato sauce, and basil",
    rating: 4.8,
    reviews: 127,
    prepTime: "15-20 min",
    popular: true
  },
  { 
    id: "m2", 
    name: "Pepperoni Pizza", 
    price: 13.0, 
    tags: ["pizza"], 
    description: "Spicy pepperoni with melted cheese",
    rating: 4.6,
    reviews: 89,
    prepTime: "15-20 min",
    popular: true
  },
  { 
    id: "m3", 
    name: "Paneer Tikka", 
    price: 12.0, 
    tags: ["veg", "indian"], 
    description: "Grilled cottage cheese with aromatic spices",
    rating: 4.7,
    reviews: 156,
    prepTime: "20-25 min",
    popular: false
  },
  { 
    id: "m4", 
    name: "Chicken Biryani", 
    price: 14.25, 
    tags: ["indian"], 
    description: "Fragrant rice with tender chicken and spices",
    rating: 4.9,
    reviews: 203,
    prepTime: "25-30 min",
    popular: true
  },
  { 
    id: "m5", 
    name: "Caesar Salad", 
    price: 9.5, 
    tags: ["salad"], 
    description: "Crisp romaine, parmesan, and caesar dressing",
    rating: 4.4,
    reviews: 67,
    prepTime: "10-15 min",
    popular: false
  },
  { 
    id: "m6", 
    name: "Butter Naan", 
    price: 3.5, 
    tags: ["indian", "bread"], 
    description: "Soft, buttery flatbread",
    rating: 4.5,
    reviews: 89,
    prepTime: "8-12 min",
    popular: false
  },
  { 
    id: "m7", 
    name: "Tomato Soup", 
    price: 6.75, 
    tags: ["soup", "veg"], 
    description: "Rich tomato soup with herbs",
    rating: 4.3,
    reviews: 45,
    prepTime: "12-15 min",
    popular: false
  },
  { 
    id: "m8", 
    name: "Gulab Jamun", 
    price: 5.25, 
    tags: ["dessert", "indian"], 
    description: "Sweet milk dumplings in rose syrup",
    rating: 4.6,
    reviews: 78,
    prepTime: "5-8 min",
    popular: false
  },
];

const SPECIAL_OFFERS = [
  {
    id: "offer1",
    title: "🍕 Pizza Lovers Special",
    description: "Buy any 2 pizzas, get 1 free!",
    discount: "33% OFF",
    validUntil: "2024-12-31"
  },
  {
    id: "offer2",
    title: "🆕 First Order Bonus",
    description: "New customers get 20% off on orders above $25",
    discount: "20% OFF",
    validUntil: "2024-12-31"
  }
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
// Favorites System
// -----------------------------
function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem("qa_favorites");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("qa_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const isFavorite = (id) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
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
// Special Offers Component
// -----------------------------
function SpecialOffers() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">🎉 Special Offers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SPECIAL_OFFERS.map(offer => (
          <Card key={offer.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{offer.title}</h3>
                <p className="text-gray-600 text-sm">{offer.description}</p>
                <p className="text-xs text-gray-500 mt-2">Valid until: {offer.validUntil}</p>
              </div>
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {offer.discount}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// -----------------------------
// Menu Item Component
// -----------------------------
function MenuItem({ item, onAddToCart, onToggleFavorite, isFavorite, showQuickAdd = false }) {
  const [showQuickAddInput, setShowQuickAddInput] = useState(false);
  const [quickAddQty, setQuickAddQty] = useState(1);

  const handleQuickAdd = () => {
    if (quickAddQty > 0) {
      for (let i = 0; i < quickAddQty; i++) {
        onAddToCart(item.id);
      }
      setShowQuickAddInput(false);
      setQuickAddQty(1);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 relative">
      {/* Popular Badge */}
      {item.popular && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          🔥 Popular
        </div>
      )}
      
      {/* Favorite Button */}
      <button
        onClick={() => onToggleFavorite(item.id)}
        className={`absolute top-2 left-2 p-2 rounded-full transition-colors ${
          isFavorite 
            ? "bg-red-500 text-white" 
            : "bg-white text-gray-400 hover:text-red-500"
        }`}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>

      <div className="flex justify-between items-start mb-2 pt-8">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
          
          {/* Rating and Reviews */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">⭐</span>
              <span className="text-sm font-medium">{item.rating}</span>
            </div>
            <span className="text-gray-400 text-sm">({item.reviews} reviews)</span>
          </div>
          
          {/* Prep Time */}
          <div className="text-sm text-gray-500 mb-2">⏱️ {item.prepTime}</div>
          
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

      {showQuickAdd && showQuickAddInput ? (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="1"
            max="10"
            value={quickAddQty}
            onChange={(e) => setQuickAddQty(parseInt(e.target.value) || 1)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center"
          />
          <Button onClick={handleQuickAdd} className="bg-green-600 text-white border-green-600">
            Add {quickAddQty}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button 
            onClick={() => onAddToCart(item.id)}
            className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700"
          >
            Add to Cart
          </Button>
          {showQuickAdd && (
            <Button 
              onClick={() => setShowQuickAddInput(true)}
              className="px-3 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            >
              Quick Add
            </Button>
          )}
        </div>
      )}
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

  // Calculate delivery time
  const estimatedDelivery = new Date();
  estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 45);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        {/* Delivery Time Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🚚</span>
            <div>
              <div className="text-sm font-medium text-blue-900">Estimated Delivery</div>
              <div className="text-sm text-blue-700">{estimatedDelivery.toLocaleTimeString()}</div>
            </div>
          </div>
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
function HomePage({ cart, onAddToCart, onOpenCart, favorites, onToggleFavorite }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

  const popularItems = MENU.filter(item => item.popular);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🍕 Fresh Bites</h1>
        <p className="text-xl text-gray-600">Delicious food delivered to your doorstep</p>
      </div>

      {/* Special Offers */}
      <SpecialOffers />

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">🔥 Popular Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {popularItems.map(item => (
              <MenuItem 
                key={item.id} 
                item={item} 
                onAddToCart={onAddToCart} 
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.includes(item.id)}
                showQuickAdd={true}
              />
            ))}
          </div>
        </div>
      )}

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

        {/* Quick Add Toggle */}
        <div className="text-center">
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showQuickAdd}
              onChange={(e) => setShowQuickAdd(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Enable Quick Add (add multiple items at once)</span>
          </label>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredMenu.map(item => (
          <MenuItem 
            key={item.id} 
            item={item} 
            onAddToCart={onAddToCart} 
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(item.id)}
            showQuickAdd={showQuickAdd}
          />
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

  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  useEffect(() => {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + (deliveryOption === "express" ? 30 : 45) * 60000);
    setEstimatedDelivery(deliveryTime.toLocaleTimeString());
  }, [deliveryOption]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onOrderPlaced();
  };

  const deliveryFee = deliveryOption === "express" ? 3.99 : 0;

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
          
          {/* Delivery Options */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Delivery Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  value="standard"
                  checked={deliveryOption === "standard"}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                />
                <span>Standard Delivery (45 min) - Free</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  value="express"
                  checked={deliveryOption === "express"}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                />
                <span>Express Delivery (30 min) - {CURRENCY(3.99)}</span>
              </label>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Estimated delivery: {estimatedDelivery}
            </div>
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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee:</span>
              <span>{deliveryOption === "express" ? CURRENCY(deliveryFee) : "Free"}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{CURRENCY(cart.total + deliveryFee)}</span>
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
              Place Order - {CURRENCY(cart.total + deliveryFee)}
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
  const favorites = useFavorites();

  const [toast, setToast] = useState("");
  
  const addToCart = (id) => {
    cart.add(id);
    setToast("Added to cart!");
    setTimeout(() => setToast(""), 2000);
  };

  const onOrderPlaced = () => {
    cart.clear();
    setToast("Order placed successfully! 🎉 Check your email for confirmation.");
    setRoute("home");
    setTimeout(() => setToast(""), 4000);
  };

  const renderPage = () => {
    switch (route) {
      case "checkout":
        return <CheckoutPage cart={cart} onOrderPlaced={onOrderPlaced} onBack={() => setRoute("home")} />;
      default:
        return <HomePage 
          cart={cart} 
          onAddToCart={addToCart} 
          onOpenCart={() => setShowCart(true)}
          favorites={favorites.favorites}
          onToggleFavorite={favorites.toggleFavorite}
        />;
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
                <button 
                  onClick={() => setRoute("home")}
                  className="px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                >
                  Favorites ({favorites.favorites.length})
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
