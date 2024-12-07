import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchWalletBalance } from "../utils";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNetwork } from "./NetworksContext";

interface WalletBalances {
  total: number;
  balances: Record<string, number>;
}

interface BalanceContextProps {
  smartWalletBalance: WalletBalances | null;
  externalWalletBalance: WalletBalances | null;
  allBalances: {
    smartWallet: WalletBalances | null;
    externalWallet: WalletBalances | null;
  };
  refreshBalance: () => void;
}

const BalanceContext = createContext<BalanceContextProps | undefined>(
  undefined,
);

export const BalanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { ready, user } = usePrivy();
  const { wallets } = useWallets();
  const { selectedNetwork } = useNetwork();

  const [smartWalletBalance, setSmartWalletBalance] =
    useState<WalletBalances | null>(null);
  const [externalWalletBalance, setExternalWalletBalance] =
    useState<WalletBalances | null>(null);

  const fetchBalances = async () => {
    if (!ready || !user) return;

    const smartWalletAccount = user.linkedAccounts.find(
      (account) => account.type === "smart_wallet",
    );
    const externalWalletAccount = wallets.find(
      (account) => account.connectorType === "injected",
    );

    if (smartWalletAccount) {
      const result = await fetchWalletBalance(
        selectedNetwork.name,
        smartWalletAccount.address,
      );
      setSmartWalletBalance(result);
    } else {
      setSmartWalletBalance(null);
    }

    if (externalWalletAccount) {
      const result = await fetchWalletBalance(
        selectedNetwork.name,
        externalWalletAccount.address,
      );
      setExternalWalletBalance(result);
    } else {
      setExternalWalletBalance(null);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [ready, user, selectedNetwork]);

  const refreshBalance = () => {
    fetchBalances();
  };

  const allBalances = {
    smartWallet: smartWalletBalance,
    externalWallet: externalWalletBalance,
  };

  return (
    <BalanceContext.Provider
      value={{
        smartWalletBalance,
        externalWalletBalance,
        allBalances,
        refreshBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
};
