import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productIndex = cart.findIndex(product => product.id === productId);
      if(productIndex >= 0) {
        const cartMirror = [...cart];
        const newAmount = cartMirror[productIndex].amount + 1;
        const { data } = await api.get(`/stock/${productId}`);
        if(newAmount <= data.amount) {
          cartMirror[productIndex].amount = newAmount;
          setCart(cartMirror);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          console.log(cart);

        }
        else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
      else if(productIndex === -1) {
      const response = await api.get(`/products/${productId}`);
      const product = response.data;
      product.amount = 1;
      setCart([...cart, product]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
    }
  
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      console.log(productIndex);
      if(productIndex === -1) throw new Error('Erro na remoção do produto');
      else {
        setCart(cart.filter(product => (product.id !== productId)));
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart.filter(product => (product.id !== productId))));
      }

      

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      const cartMirror = [...cart];
      const { data } = await api.get(`/stock/${productId}`);
      if(amount <= 0) {
        throw new Error('Não pode atualizar o valor para menos que 1');
      }
      
      if(amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }
      else {
        cartMirror[productIndex].amount = amount;
        setCart(cartMirror);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartMirror));
      }

      
    } catch { 
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
