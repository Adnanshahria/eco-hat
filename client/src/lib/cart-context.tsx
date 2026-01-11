import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/components/auth-provider";

interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        price: number;
        images: string[] | null;
        stock: number;
        seller_id: number;
    };
}

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updateQuantity: (productId: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    itemCount: number;
    total: number;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<number | null>(null);

    // Get user ID from profile
    useEffect(() => {
        const fetchUserId = async () => {
            if (!user?.email) {
                setUserId(null);
                setItems([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("id")
                .eq("email", user.email)
                .single();

            if (data) {
                setUserId(data.id);
            } else {
                console.error("CartContext: Failed to fetch user ID", error);
            }
            // Ensure loading is set to false after attempting to get user ID
            // If we have a userId, 'refreshCart' will trigger and handle loading state there.
            // But if we failed to get userId, we should stop loading here.
            if (!data) setLoading(false);
        };

        fetchUserId();
    }, [user]);

    // Fetch cart when userId changes
    useEffect(() => {
        if (userId) {
            refreshCart();
        }
    }, [userId]);

    const refreshCart = async () => {
        if (!userId) return;

        setLoading(true);
        const { data } = await supabase
            .from("cart_items")
            .select(`
        id,
        product_id,
        quantity,
        product:products (
          id,
          name,
          price,
          images,
          stock,
          seller_id
        )
      `)
            .eq("user_id", userId);

        if (data) {
            setItems(data as unknown as CartItem[]);
        }
        setLoading(false);
    };

    const addToCart = async (productId: number, quantity = 1) => {
        if (!userId) return;

        // Check if item exists
        const existing = items.find((item) => item.product_id === productId);

        if (existing) {
            await updateQuantity(productId, existing.quantity + quantity);
        } else {
            const { error } = await supabase.from("cart_items").insert({
                user_id: userId,
                product_id: productId,
                quantity,
            });
            if (error) {
                console.error("Error adding to cart:", error);
                throw error;
            }
            await refreshCart();
        }
    };

    const removeFromCart = async (productId: number) => {
        if (!userId) return;

        await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId)
            .eq("product_id", productId);

        setItems(items.filter((item) => item.product_id !== productId));
    };

    const updateQuantity = async (productId: number, quantity: number) => {
        if (!userId) return;

        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        await supabase
            .from("cart_items")
            .update({ quantity })
            .eq("user_id", userId)
            .eq("product_id", productId);

        setItems(
            items.map((item) =>
                item.product_id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = async () => {
        if (!userId) return;

        await supabase.from("cart_items").delete().eq("user_id", userId);
        setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                loading,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                itemCount,
                total,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
