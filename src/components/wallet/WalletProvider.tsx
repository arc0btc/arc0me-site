import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
} from '@stacks/connect';

interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  handleConnect: () => Promise<void>;
  handleDisconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  connected: false,
  address: null,
  connecting: false,
  handleConnect: async () => {},
  handleDisconnect: () => {},
});

export function useWallet(): WalletState {
  return useContext(WalletContext);
}

function getStxAddress(): string | null {
  try {
    const data = getLocalStorage();
    const stxAddresses = data?.addresses?.stx;
    if (stxAddresses && stxAddresses.length > 0) {
      return stxAddresses[0].address;
    }
  } catch {
    // localStorage unavailable or no session
  }
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const existing = isConnected();
    if (existing) {
      setConnected(true);
      setAddress(getStxAddress());
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!window.LeatherProvider) {
      window.open('https://leather.io/install-extension', '_blank');
      return;
    }

    setConnecting(true);
    try {
      await connect();
      const nowConnected = isConnected();
      setConnected(nowConnected);
      if (nowConnected) {
        setAddress(getStxAddress());
      }
    } catch {
      // User rejected or wallet error
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setConnected(false);
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ connected, address, connecting, handleConnect, handleDisconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}
