import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getEnv = (name: string): string => {
  // Browser environment
  if (typeof globalThis !== "undefined" && "window" in globalThis) {
    const envMap: Record<string, string | undefined> = {
      ETHEREUM_PRIVATE_KEY: process.env.NEXT_PUBLIC_ETHEREUM_PRIVATE_KEY,
      SOLANA_PRIVATE_KEY: process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY,
    };
    const env = envMap[name];
    if (env === undefined || env === "")
      throw new Error(
        `Browser: ${name} ENV is not defined, please define it in the .env file`
      );
    return env;
  }

  // Node environment
  const env = process.env[name];
  if (env === undefined || env === "")
    throw new Error(
      `Node: ${name} ENV is not defined, please define it in the .env file`
    );
  return env;
};
