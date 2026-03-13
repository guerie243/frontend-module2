import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    totalPrice: number;
    vitrineId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const vitrineId = useMemo(() => {
        if (cart.length === 0) return null;
        return cart[0].product.vitrineId;
    }, [cart]);

    const addToCart = useCallback((product: Product, quantity: number) => {
        setCart((prevCart) => {
            const productId = product.id || product._id || '';

            // If item from different vitrine, clear cart first? 
            // For simplicity, we'll assume one vitrine at a time for now as per requirement 5
            if (prevCart.length > 0 && prevCart[0].product.vitrineId !== product.vitrineId) {
                return [{ product, quantity }];
            }

            const existingItemIndex = prevCart.findIndex(
                (item) => (item.product.id || item.product._id) === productId
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            }

            return [...prevCart, { product, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart((prevCart) => prevCart.filter(
            (item) => (item.product.id || item.product._id) !== productId
        ));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        setCart((prevCart) => {
            if (quantity <= 0) {
                return prevCart.filter((item) => (item.product.id || item.product._id) !== productId);
            }
            return prevCart.map((item) =>
                (item.product.id || item.product._id) === productId
                    ? { ...item, quantity }
                    : item
            );
        });
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const itemCount = useMemo(() => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }, [cart]);

    const totalPrice = useMemo(() => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    }, [cart]);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        totalPrice,
        vitrineId,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
