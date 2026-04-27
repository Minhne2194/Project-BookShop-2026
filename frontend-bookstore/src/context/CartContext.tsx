import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface CartItem {
  bookId: string;
  quantity: number;
}

interface CartContextType {
  token: string | null;
  cartItems: CartItem[];
  setToken: (token: string | null) => void;
  fetchCart: () => void;
  handleAddToCart: (bookId: string) => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const fetchCart = () => {
    if (token) {
      fetch('http://localhost:3000/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if(data.items) setCartItems(data.items);
      });
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const handleAddToCart = async (bookId: string) => {
    if (!token) {
      alert("Vui lòng đăng nhập!"); // Bạn có thể xử lý logic show form login tốt hơn sau
      return;
    }
    const res = await fetch('http://localhost:3000/cart/add', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bookId, quantity: 1 })
    });
    if (res.ok) fetchCart();
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ token, cartItems, setToken, fetchCart, handleAddToCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook để dùng cho tiện
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};