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
  { id: "m1", name: "Margherita Pizza", price: 11.5, tags: ["veg", "pizza"] },
  { id: "m2", name: "Pepperoni Pizza", price: 13.0, tags: ["pizza"] },
  { id: "m3", name: "Paneer Tikka", price: 12.0, tags: ["veg", "indian"] },
  { id: "m4", name: "Chicken Biryani", price: 14.25, tags: ["indian"] },
  { id: "m5", name: "Caesar Salad", price: 9.5, tags: ["salad"] },
  { id: "m6", name: "Butter Naan", price: 3.5, tags: ["indian", "bread"] },
  { id: "m7", name: "Tomato Soup", price: 6.75, tags: ["soup", "veg"] },
  { id: "m8", name: "Gulab Jamun", price: 5.25, tags: ["dessert", "indian"] },
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
    <div className={"rounded-2xl shadow p-4 bg-white " + className}>{children}</div>
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
// Root App (ensure default export)
// -----------------------------
export function App() {
  const [route, setRoute] = useState("home");
  const cart = useCart();

  const [toast, setToast] = useState("");
  const addToCart = (id) => {
    cart.add(id);
    setToast("Added to cart!");
    setTimeout(() => setToast(""), 800);
  };

  const onOrderPlaced = () => {
    cart.clear();
    setToast("Order placed (demo)!");
    setRoute("admin");
    setTimeout(() => setToast(""), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="p-6">Restaurant QA Demo (simplified build)</div>
    </div>
  );
}

export default App;
