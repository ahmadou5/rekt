import { PublicKey } from "@solana/web3.js";

interface TransactionMetrics {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
  buy_volume: number;
  sell_volume: number;
}

interface TimeFrameMetrics {
  price_variation: number;
  volume: number;
  transactions: TransactionMetrics;
}

interface PoolMetrics {
  m5: TimeFrameMetrics;
  m15: TimeFrameMetrics;
  h1: TimeFrameMetrics;
  h6: TimeFrameMetrics;
  h24: TimeFrameMetrics;
}

interface PooledTokens {
  token: number;
  native: number;
  nativeTokenName: string;
}

interface Pools {
  sources: string[];
  metrics: PoolMetrics;
  ids: string[];
  pooled: PooledTokens;
  created_at: string; // ISO 8601 date string
}

interface TokenStats {
  market_cap: number;
  price_usd: number;
  volume: number;
  supply: number;
  liquidity: number;
  holders: number;
}

interface TokenDetails {
  symbol: string;
  name: string;
  icon: string;
  id: string;
  pool_id: string;
  decimals: number;
}

export interface CryptocurrencyData {
  stats: TokenStats;
  details: TokenDetails;
  pools: Pools;
  native_token_price: number;
}
export interface UserInterface {
  id: string;
  username: string;
  pin: string;
  ethAddress: string;
  ethPrivateKey: string;
  suiAddress: string;
  suiPrivateKey: string;
  solPublicKey: string;
  solPrivateKey: string;
  mnemonic: string;
  email: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  address: string;
  pin: string;
  bio?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface Transaction {}

export interface userToken {
  mint: string;
  amount: number;
  decimals: number;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  price: number;
  [key: string]: any;
}

export interface userNFT {
  mint: string;
  amount: number;
  decimals: number;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  attribute?: {
    trait_type: string;
    value: string;
  }[];
  description: string;
  external_url: string;
  collection?: {
    family: string;
    name: string;
  };
  [key: string]: any;
}
export interface vybeToken {
  category: string | null;
  currentSupply: number;
  decimal: number;
  logoUrl: string | null;
  marketCap: number;
  mintAddress: string;
  name: string | null;
  price: number;
  price1d: number;
  price7d: number;
  subcategory: string | null;
  symbol: string;
  tokenAmountVolume: number | null;
  updateTime: number;
  usdValueVolume24h: number | null;
  verified: boolean;
}
export interface Apps {
  name: string;
  baseUrl: string;
  about: string;
  logoUrl: string;
  isSVM: boolean;
  isEVM: boolean;
  isSUI: boolean;
  [key: string]: any;
}

export interface TokenMetadata {
  key: number;
  updateAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: null;
  collection: null;
  uses: null;
  [key: string]: any;
}

export interface TokenAsset {
  type: "SPL";
  mint: string;
  amount: number;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  metadata?: TokenMetadata;
  [key: string]: any;
}

export interface NFTAsset {
  type: "NFT";
  mint: string;
  name: string;
  symbol: string;
  image: string;
  metadata: TokenMetadata;
  [key: string]: any;
}

export interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  pairCount: number;
  logoUrl?: string;
  [key: string]: any;
}

export interface Tokens {
  token_id: string;
  name: string;
  symbol: string;
  ticker: string;
  logoUrl: string;
  address: string;
  decimals: number;
  price?: number;
  priceChange?: number;
  marketCap?: number;
}

export interface Native {
  name: string;
  address: string;
  networkLogo: string;
  ticker: string;
  logoUrl: string;
  token_id: string;
}

export interface Network {
  name: string;
  rpcUrl: string;
  rpcUrlAlt: string;
  isEVM: boolean;
  isTestNet: boolean;
  native: Native | undefined;
}

export interface BlinkInterface {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  image_url?: string;
  description?: string;
  label?: string;
  pub_key: string;

  created_at: Date;
  updated_at?: Date;
}

export interface TransactionDetails {
  signature: string;
  blockTime: string;
  fee: number;
  direction: "sent" | "received";
  amount: number;
}

export interface TransactionState {
  sent: TransactionDetails[];
  received: TransactionDetails[];
}

export interface Chain {}
