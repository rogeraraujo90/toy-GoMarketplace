import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const DB_CART_KEY = '@GoMarketPlace:cart';
const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem(DB_CART_KEY);

      if (cart) {
        const parsedCart = JSON.parse(cart);

        setProducts(parsedCart);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const cartProductIndex = products.findIndex(p => p.id === product.id);
      const newCart = [...products];

      if (cartProductIndex >= 0) {
        newCart[cartProductIndex] = {
          ...product,
          quantity: products[cartProductIndex].quantity + 1,
        };
      } else {
        newCart.unshift({
          ...product,
          quantity: 1,
        });
      }

      setProducts(newCart);
      await AsyncStorage.setItem(DB_CART_KEY, JSON.stringify(newCart));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const product = products.find(cartProduct => cartProduct.id === id);

      if (product) {
        product.quantity += 1;
      }

      const newCart = [...products];

      setProducts(newCart);
      await AsyncStorage.setItem(DB_CART_KEY, JSON.stringify(newCart));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(cartProduct => cartProduct.id === id);

      if (product) {
        product.quantity -= 1;
      }

      const newCart = products.filter(
        cartProduct => cartProduct.quantity !== 0,
      );

      setProducts(newCart);
      await AsyncStorage.setItem(DB_CART_KEY, JSON.stringify(newCart));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
