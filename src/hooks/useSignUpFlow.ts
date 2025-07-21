// hooks/useSignUpFlow.ts
import { useCallback, useReducer, useMemo } from "react";
import { ExportPrivateKeyResult } from "@lit-protocol/wrapped-keys";
import { generateWrappedKey, getUserPrivateKey } from "@/lib/helper.lit";
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
interface SignUpError {
  type:
    | "auth"
    | "network"
    | "key_generation"
    | "user_creation"
    | "account_creation";
  message: string;
  recoverable: boolean;
  originalError?: unknown;
}

interface SignUpState {
  phase:
    | "idle"
    | "authenticating"
    | "creating_account"
    | "creating_session"
    | "generating_keys"
    | "creating_user"
    | "finalizing"
    | "completed"
    | "error";
  solanaAddress?: string;
  privateKeyResult?: ExportPrivateKeyResult;
  error?: SignUpError;
  retryCount: number;
}

type SignUpAction =
  | { type: "START_AUTH" }
  | { type: "START_ACCOUNT_CREATION" }
  | { type: "START_SESSION_CREATION" }
  | { type: "START_KEY_GENERATION" }
  | { type: "SET_SOLANA_ADDRESS"; payload: string }
  | { type: "SET_PRIVATE_KEY"; payload: ExportPrivateKeyResult }
  | { type: "START_USER_CREATION" }
  | { type: "START_FINALIZATION" }
  | { type: "COMPLETE_SIGNUP" }
  | { type: "SET_ERROR"; payload: SignUpError }
  | { type: "RETRY" }
  | { type: "RESET" };

// Utility functions
const createSecureLogger = (isDevelopment: boolean) => ({
  debug: (message: string, data?: unknown) => {
    if (isDevelopment && data && !String(data).includes("privateKey")) {
      console.log(`[SignUpFlow Debug] ${message}`, data);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[SignUpFlow Error] ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[SignUpFlow Warning] ${message}`, data);
  },
});

// Reducer
const signUpReducer = (
  state: SignUpState,
  action: SignUpAction
): SignUpState => {
  switch (action.type) {
    case "START_AUTH":
      return { ...state, phase: "authenticating", error: undefined };
    case "START_ACCOUNT_CREATION":
      return { ...state, phase: "creating_account" };
    case "START_SESSION_CREATION":
      return { ...state, phase: "creating_session" };
    case "START_KEY_GENERATION":
      return { ...state, phase: "generating_keys" };
    case "SET_SOLANA_ADDRESS":
      return { ...state, solanaAddress: action.payload };
    case "SET_PRIVATE_KEY":
      return { ...state, privateKeyResult: action.payload };
    case "START_USER_CREATION":
      return { ...state, phase: "creating_user" };
    case "START_FINALIZATION":
      return { ...state, phase: "finalizing" };
    case "COMPLETE_SIGNUP":
      return {
        ...state,
        phase: "completed",
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

export const useSignUpFlow = () => {
  const [signUpState, dispatch] = useReducer(signUpReducer, {
    phase: "idle",
    retryCount: 0,
  });

  const logger = useMemo(
    () => createSecureLogger(process.env.NODE_ENV === "development"),
    []
  );

  const generateSolanaKeys = useCallback(
    async (sessionSigs: SessionSigs) => {
      if (!sessionSigs) {
        logger.warn("Session signatures not available for key generation");
        return;
      }

      try {
        dispatch({ type: "START_KEY_GENERATION" });

        const wrappedKeyResponse = await generateWrappedKey(
          sessionSigs,
          "solana",
          "WrappedKey for Solana"
        );

        if (!wrappedKeyResponse?.generatedPublicKey || !wrappedKeyResponse.id) {
          throw new Error("Wrapped key generation failed");
        }

        dispatch({
          type: "SET_SOLANA_ADDRESS",
          payload: wrappedKeyResponse.generatedPublicKey,
        });

        const privateKey = await getUserPrivateKey(
          sessionSigs,
          "solana",
          wrappedKeyResponse.id
        );

        if (!privateKey?.decryptedPrivateKey) {
          throw new Error("Failed to decrypt private key");
        }

        dispatch({ type: "SET_PRIVATE_KEY", payload: privateKey });

        logger.debug("Solana keys generated successfully", {
          publicKey: wrappedKeyResponse.generatedPublicKey.slice(0, 8) + "...",
        });

        return { address: wrappedKeyResponse.generatedPublicKey, privateKey };
      } catch (error) {
        logger.error("Failed to generate Solana keys", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            type: "key_generation",
            message: "Failed to generate wallet keys",
            recoverable: true,
            originalError: error,
          },
        });
        throw error;
      }
    },
    [logger]
  );

  const createUser = useCallback(
    async (email: string) => {
      if (!signUpState.solanaAddress) {
        throw new Error("Solana address not available for user creation");
      }

      try {
        dispatch({ type: "START_USER_CREATION" });
        logger.debug("Starting user creation process", {
          email: email.split("@")[0],
        });

        // Check if user already exists
        const userData = await UserService.GetUserByMail(email);

        if (userData.success && userData.data) {
          logger.debug("User already exists, using existing user");
          return userData.data;
        }

        // Create new user
        const newUser = await UserService.CreateUser({
          username: email.split("@")[0],
          email: email,
          address: signUpState.solanaAddress,
          pin: "0000",
          bio: "just a lapo boy",
          profilePicture: "https://assets.infusewallet.xyz/assets/solana.png",
        });

        if (!newUser.success) {
          throw new Error("User creation failed");
          console.log(newUser.message);
        }

        logger.debug("New user created successfully");
        return newUser.data;
      } catch (error) {
        logger.error("Failed to create user", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            type: "user_creation",
            message: "Failed to create user account",
            recoverable: true,
            originalError: error,
          },
        });
        throw error;
      }
    },
    [signUpState.solanaAddress, logger]
  );

  const finalizeSignUp = useCallback(
    async (sessionSigs: SessionSigs, userEmail: string) => {
      if (
        !sessionSigs ||
        !signUpState.solanaAddress ||
        !signUpState.privateKeyResult
      ) {
        logger.warn("Missing required data for finalization");
        throw new Error("Missing required signup data");
      }

      try {
        dispatch({ type: "START_FINALIZATION" });

        // Execute all post-signup actions in parallel
        await Promise.all([
          handlePostSolanaAddress(signUpState.solanaAddress),
          handlePostSession(sessionSigs),
          handlePostEmail(userEmail),
          handlePostSolanaPKey(
            signUpState.privateKeyResult.decryptedPrivateKey
          ),
          handlePostIsLogin(false),
        ]);

        // Create user (this might take longer, so do it separately)
        await createUser(userEmail);

        dispatch({ type: "COMPLETE_SIGNUP" });
        logger.debug("SignUp finalization completed");
      } catch (error) {
        logger.error("Failed to finalize signup", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            type: "network",
            message: "Failed to complete signup process",
            recoverable: true,
            originalError: error,
          },
        });
        throw error;
      }
    },
    [
      signUpState.solanaAddress,
      signUpState.privateKeyResult,
      createUser,
      logger,
    ]
  );

  const handleRetry = useCallback(() => {
    if (signUpState.retryCount < 3) {
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
  }, [signUpState.retryCount]);

  const resetSignUpFlow = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // State transition methods
  const startAuth = useCallback(() => dispatch({ type: "START_AUTH" }), []);
  const startAccountCreation = useCallback(
    () => dispatch({ type: "START_ACCOUNT_CREATION" }),
    []
  );
  const startSessionCreation = useCallback(
    () => dispatch({ type: "START_SESSION_CREATION" }),
    []
  );

  // Validation helpers
  const isValidSolanaAddress = useCallback(
    (address?: string): address is string => {
      return typeof address === "string" && address.length > 0;
    },
    []
  );

  return {
    signUpState,
    generateSolanaKeys,
    finalizeSignUp,
    handleRetry,
    resetSignUpFlow,
    startAuth,
    startAccountCreation,
    startSessionCreation,
    isValidSolanaAddress,
  };
};
