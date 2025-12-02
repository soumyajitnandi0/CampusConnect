import NetInfo from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  networkStatus: NetInfo.NetInfoState | null;
  isOnline: boolean;
  isOffline: boolean;
  networkType: string | null;
  getNetworkErrorMessage: () => string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkStatus, setNetworkStatus] = useState<NetInfo.NetInfoState | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus(state);
    });

    // Get initial network state
    NetInfo.fetch().then(setNetworkStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  const isOnline = networkStatus?.isConnected ?? false;
  const isOffline = !isOnline;
  const networkType = networkStatus?.type ?? null;

  const getNetworkErrorMessage = (): string | null => {
    if (!isOffline) return null;

    if (networkStatus?.isInternetReachable === false) {
      return 'No internet connection. Please check your network settings.';
    }

    if (networkStatus?.type === 'none') {
      return 'No network connection available.';
    }

    return 'Connection problem. Please check your network.';
  };

  return (
    <NetworkContext.Provider
      value={{
        networkStatus,
        isOnline,
        isOffline,
        networkType,
        getNetworkErrorMessage,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

