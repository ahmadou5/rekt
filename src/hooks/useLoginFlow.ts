// hooks/useLoginFlow.ts
import { useCallback, useReducer, useMemo } from "react";
import {
  ExportPrivateKeyResult,
  StoredKeyMetadata,
} from "@lit-protocol/wrapped-keys";
import { getUserPrivateKey, listWrappedKeys } from "@/lib/helper.lit";
import { UserService } from "@/lib/services/user.service";
import {
  handlePostEmail,
  handlePostIsLogin,
  handlePostSession,
  handlePostSolanaAddress,
  handlePostSolanaPKey,
} from "@/lib/helpers.lib";
import { SessionSigs } from "@lit-protocol/types";

// Types
interface LoginError {
  type: "auth" | "network" | "key_generation" | "user_creation";
  message: string;
  recoverable: boolean;
  originalError?: unknown;
}

interface LoginState {
  phase:
    | "idle"
    | "authenticating"
    | "fetching_accounts"
    | "creating_session"
    | "fetching_keys"
    | "finalizing"
    | "authenticated"
    | "error";
  addresses?: StoredKeyMetadata[];
  privateKeyResult?: ExportPrivateKeyResult;
  error?: LoginError;
  retryCount: number;
}

type LoginAction =
  | { type: "START_AUTH" }
  | { type: "START_FETCHING_ACCOUNTS" }
  | { type: "START_SESSION_CREATION" }
  | { type: "START_KEY_FETCHING" }
  | {
      type: "SET_KEYS";
      payload: {
        addresses: StoredKeyMetadata[];
        privateKey: ExportPrivateKeyResult;
      };
    }
  | { type: "START_FINALIZATION" }
  | { type: "COMPLETE_AUTH" }
  | { type: "SET_ERROR"; payload: LoginError }
  | { type: "RETRY" }
  | { type: "RESET" };

// Utility functions
const isValidAddresses = (
  addresses: StoredKeyMetadata[] | undefined
): addresses is StoredKeyMetadata[] => {
  return Array.isArray(addresses) && addresses.length > 0;
};

const createSecureLogger = (isDevelopment: boolean) => ({
  debug: (message: string, data?: unknown) => {
    if (isDevelopment && data && !String(data).includes("privateKey")) {
      console.log(`[LoginFlow Debug] ${message}`, data);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[LoginFlow Error] ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[LoginFlow Warning] ${message}`, data);
  },
});

// Reducer
const loginReducer = (state: LoginState, action: LoginAction): LoginState => {
  switch (action.type) {
    case "START_AUTH":
      return { ...state, phase: "authenticating", error: undefined };
    case "START_FETCHING_ACCOUNTS":
      return { ...state, phase: "fetching_accounts" };
    case "START_SESSION_CREATION":
      return { ...state, phase: "creating_session" };
    case "START_KEY_FETCHING":
      return { ...state, phase: "fetching_keys" };
    case "SET_KEYS":
      return {
        ...state,
        addresses: action.payload.addresses,
        privateKeyResult: action.payload.privateKey,
      };
    case "START_FINALIZATION":
      return { ...state, phase: "finalizing" };
    case "COMPLETE_AUTH":
      return {
        ...state,
        phase: "authenticated",
        error: undefined,
        retryCount: 0,
      };
    case "SET_ERROR":
      return { ...state, phase: "error", error: action.payload };
    case "RETRY":
      return {
        ...state,
        phase: "idle",
        error: undefined,
        retryCount: state.retryCount + 1,
      };
    case "RESET":
      return { phase: "idle", retryCount: 0 };
    default:
      return state;
  }
};

export const useLoginFlow = () => {
  const [loginState, dispatch] = useReducer(loginReducer, {
    phase: "idle",
    retryCount: 0,
  });

  const logger = useMemo(
    () => createSecureLogger(process.env.NODE_ENV === "development"),
    []
  );

  const createUser = useCallback(
    async (email: string) => {
      try {
        logger.debug("Starting user creation process", {
          email: email.split("@")[0],
        });

        const userData = await UserService.GetUserByMail(email);

        if (userData.success && userData.data) {
          logger.debug("User already exists");
          return userData.data;
        } else {
          if (!isValidAddresses(loginState.addresses)) {
            throw new Error("No valid addresses available for user creation");
          }

          const newUser = await UserService.CreateUser({
            username: email.split("@")[0],
            email: email,
            address: loginState.addresses[0].publicKey,
            pin: "",
          });

          logger.debug("New user created successfully");
          return newUser.data;
        }
      } catch (error) {
        logger.error("Failed to create user", error);
        throw new Error("Failed to create user");
      }
    },
    [loginState.addresses, logger]
  );

  const fetchSolanaKeys = useCallback(
    async (sessionSigs: SessionSigs) => {
      if (!sessionSigs) {
        logger.warn("Session signatures not available for key fetching");
        return;
      }

      try {
        dispatch({ type: "START_KEY_FETCHING" });

        const addresses = await listWrappedKeys(sessionSigs);

        if (!isValidAddresses(addresses)) {
          throw new Error("No Solana addresses found");
        }

        const privateKey = await getUserPrivateKey(
          sessionSigs,
          "solana",
          addresses[0].id
        );

        if (!privateKey?.decryptedPrivateKey) {
          throw new Error("Failed to decrypt private key");
        }

        dispatch({
          type: "SET_KEYS",
          payload: { addresses, privateKey },
        });

        logger.debug("Keys fetched successfully", {
          addressCount: addresses.length,
        });

        return { addresses, privateKey };
      } catch (error) {
        logger.error("Failed to fetch Solana keys", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            type: "key_generation",
            message: "Failed to fetch wallet keys",
            recoverable: true,
            originalError: error,
          },
        });
        throw error;
      }
    },
    [logger]
  );

  const finalizeAuthentication = useCallback(
    async (sessionSigs: SessionSigs, userEmail: string) => {
      if (
        !sessionSigs ||
        !isValidAddresses(loginState.addresses) ||
        !loginState.privateKeyResult
      ) {
        logger.warn("Missing required data for finalization");
        throw new Error("Missing required authentication data");
      }

      try {
        dispatch({ type: "START_FINALIZATION" });

        // Execute all post-login actions in parallel
        await Promise.all([
          handlePostSolanaAddress(loginState.addresses[0].publicKey),
          handlePostSession(sessionSigs),
          handlePostEmail(userEmail),
          handlePostSolanaPKey(loginState.privateKeyResult.decryptedPrivateKey),
          handlePostIsLogin(true),
        ]);

        // Create user
        await createUser(userEmail);

        dispatch({ type: "COMPLETE_AUTH" });
        logger.debug("Authentication finalization completed");
      } catch (error) {
        logger.error("Failed to finalize authentication", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            type: "network",
            message: "Failed to complete login process",
            recoverable: true,
            originalError: error,
          },
        });
        throw error;
      }
    },
    [loginState.addresses, loginState.privateKeyResult, createUser, logger]
  );

  const handleRetry = useCallback(() => {
    if (loginState.retryCount < 3) {
      dispatch({ type: "RETRY" });
    } else {
      dispatch({
        type: "SET_ERROR",
        payload: {
          type: "network",
          message: "Maximum retry attempts exceeded",
          recoverable: false,
        },
      });
    }
  }, [loginState.retryCount]);

  const resetLoginFlow = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // State transition methods
  const startAuth = useCallback(() => dispatch({ type: "START_AUTH" }), []);
  const startFetchingAccounts = useCallback(
    () => dispatch({ type: "START_FETCHING_ACCOUNTS" }),
    []
  );
  const startSessionCreation = useCallback(
    () => dispatch({ type: "START_SESSION_CREATION" }),
    []
  );

  return {
    loginState,
    fetchSolanaKeys,
    finalizeAuthentication,
    handleRetry,
    resetLoginFlow,
    startAuth,
    startFetchingAccounts,
    startSessionCreation,
    isValidAddresses,
  };
};
