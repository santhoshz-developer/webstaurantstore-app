import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShopModule {
  name: string;
  is_enabled: boolean;
  configuration: any;
  ui_config: {
    component: string;
    route: string;
  };
}

export interface ShopTheme {
  ui_theme: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  shop_type_name: string;
  shop_type_display_name: string;
  qr_code: string;
  owner_name: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  configuration: {
    modules: string[];
    features: string[];
    ui_theme: string;
    colors: any;
    disabled_modules: string[];
    disabled_features: string[];
  };
  business_hours: any;
  is_open: boolean;
  theme_config: any;
  module_config: any;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  id: string;
  product_id: number;
  variant_id?: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
}

interface BookingSlot {
  date: string;
  time_start: string;
  time_end: string;
  duration: number;
  service_id?: number;
  staff_id?: number;
}

interface ShopState {
  // Current shop data
  currentShop: Shop | null;
  shopModules: ShopModule[];
  isLoading: boolean;
  error: string | null;

  // Cart state (for orders)
  cart: CartItem[];
  cartTotal: number;

  // Booking state (for appointments/reservations)
  selectedBooking: BookingSlot | null;
  bookingData: any;

  // UI state
  activeModule: string | null;
  sidebarOpen: boolean;
  theme: ShopTheme;

  // Actions
  setCurrentShop: (shop: Shop) => void;
  setShopModules: (modules: ShopModule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearShop: () => void;

  // Cart actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  calculateCartTotal: () => void;

  // Booking actions
  setSelectedBooking: (booking: BookingSlot | null) => void;
  setBookingData: (data: any) => void;
  clearBooking: () => void;

  // UI actions
  setActiveModule: (module: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Partial<ShopTheme>) => void;

  // Helper methods
  isModuleEnabled: (moduleName: string) => boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  getModuleConfig: (moduleName: string) => any;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentShop: null,
      shopModules: [],
      isLoading: false,
      error: null,
      cart: [],
      cartTotal: 0,
      selectedBooking: null,
      bookingData: null,
      activeModule: null,
      sidebarOpen: false,
      theme: {
        ui_theme: 'default',
        colors: {}
      },

      // Shop actions
      setCurrentShop: (shop) => {
        set({
          currentShop: shop,
          theme: {
            ui_theme: shop.configuration.ui_theme || 'default',
            colors: shop.configuration.colors || {}
          }
        });
      },

      setShopModules: (modules) => {
        set({ shopModules: modules });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearShop: () => {
        set({
          currentShop: null,
          shopModules: [],
          error: null,
          cart: [],
          cartTotal: 0,
          selectedBooking: null,
          bookingData: null,
          activeModule: null,
          theme: {
            ui_theme: 'default',
            colors: {}
          }
        });
      },

      // Cart actions
      addToCart: (item) => {
        const { cart } = get();
        const id = `${item.product_id}-${item.variant_id || 'default'}-${Date.now()}`;
        const newItem: CartItem = { ...item, id };
        
        // Check if same product+variant already exists
        const existingItemIndex = cart.findIndex(
          (cartItem) => 
            cartItem.product_id === item.product_id && 
            cartItem.variant_id === item.variant_id
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += item.quantity;
          set({ cart: updatedCart });
        } else {
          // Add new item
          set({ cart: [...cart, newItem] });
        }
        
        get().calculateCartTotal();
      },

      removeFromCart: (itemId) => {
        const { cart } = get();
        set({ cart: cart.filter((item) => item.id !== itemId) });
        get().calculateCartTotal();
      },

      updateCartItem: (itemId, updates) => {
        const { cart } = get();
        const updatedCart = cart.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        set({ cart: updatedCart });
        get().calculateCartTotal();
      },

      clearCart: () => {
        set({ cart: [], cartTotal: 0 });
      },

      calculateCartTotal: () => {
        const { cart } = get();
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        set({ cartTotal: total });
      },

      // Booking actions
      setSelectedBooking: (booking) => {
        set({ selectedBooking: booking });
      },

      setBookingData: (data) => {
        set({ bookingData: data });
      },

      clearBooking: () => {
        set({ selectedBooking: null, bookingData: null });
      },

      // UI actions
      setActiveModule: (module) => {
        set({ activeModule: module });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setTheme: (theme) => {
        set((state) => ({
          theme: { ...state.theme, ...theme }
        }));
      },

      // Helper methods
      isModuleEnabled: (moduleName) => {
        const { currentShop } = get();
        if (!currentShop) return false;
        
        return currentShop.configuration.modules.includes(moduleName) &&
               !currentShop.configuration.disabled_modules.includes(moduleName);
      },

      isFeatureEnabled: (featureName) => {
        const { currentShop } = get();
        if (!currentShop) return false;
        
        return currentShop.configuration.features.includes(featureName) &&
               !currentShop.configuration.disabled_features.includes(featureName);
      },

      getModuleConfig: (moduleName) => {
        const { shopModules } = get();
        const module = shopModules.find((m) => m.name === moduleName);
        return module?.configuration || {};
      }
    }),
    {
      name: 'shop-store',
      partialize: (state) => ({
        currentShop: state.currentShop,
        cart: state.cart,
        cartTotal: state.cartTotal,
        selectedBooking: state.selectedBooking,
        bookingData: state.bookingData,
        theme: state.theme
      })
    }
  )
);