import { UserInterface } from ".";
import { Dispatch, SetStateAction } from "react";
import { Network, TokenAsset, UserProfile } from "./models.interface";

export interface AuthContextProps {
  isLoggedIn: boolean;
  user: UserProfile | undefined; // Allow undefined
  setUser: (user: UserProfile) => void;
  logout: () => void;
  fetchProfile: (email: string) => void;
  isUserLoading: boolean;
}

export interface MiniContextType {
  isNative: boolean;
  selectedToken: TokenAsset | null;
  modalVisible: boolean;
  receiveAddress: string;
  solBalance: number;
  isCompressed: boolean;
  isLoading: boolean;
  userEmail: string;
  setIsNative: Dispatch<SetStateAction<boolean>>;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
  setSelectedToken: Dispatch<SetStateAction<TokenAsset | null>>;
  setReceiveAddress: Dispatch<SetStateAction<string>>;
  setUserEmail: Dispatch<SetStateAction<string>>;
  userPassword: string;
  setUserPassword: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsCompressed: Dispatch<SetStateAction<boolean>>;
  setSolBalance: Dispatch<SetStateAction<number>>;
}

export interface AppContextProps {
  userBalance: number;
  //setUserBalance: () => Dispatch<SetStateAction<number>>
}

export interface NetworkContextType {
  isActive: boolean;
  network: Network;
  setActiveChain: (network: Network) => void;
}
