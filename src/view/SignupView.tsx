"use client";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthMethodType } from "@lit-protocol/constants";

import useAuthenticate from "../hooks/useAuthenticate";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import { useSignUpFlow } from "../hooks/useSignUpFlow";
import { useUserStore } from "../../store/UserStore";

import Loading from "../components/Loading";
import SignUpMethods from "../components/SignUpMethods";
import { SignUpErrorBoundary } from "../components/SignUpErrorBoundary";
import { LucideVerified } from "lucide-react";

export default function SignUpView() {
  const { userEmail } = useUserStore();
  const router = useRouter();

  // Custom hook for signup flow management
  const {
    signUpState,
    generateSolanaKeys,
    finalizeSignUp,
    handleRetry,
    startAuth,

    startSessionCreation,
    isValidSolanaAddress,
  } = useSignUpFlow();

  // Existing hooks
  const {
    authMethod,
    authWithStytch,
    loading: authLoading,
    error: authError,
  } = useAuthenticate();

  const {
    createAccount,
    currentAccount,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();

  const {
    initSession,
    sessionSigs,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  // Combine all errors
  const combinedError =
    authError || accountsError || sessionError || signUpState.error;

  // Navigation handler
  const goToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  // Authentication flow effects
  useEffect(() => {
    if (authMethod && signUpState.phase === "idle") {
      startAuth();
      router.replace(window.location.pathname, undefined);

      // For WebAuthn, account creation is handled by registerWithWebAuthn
      if (authMethod.authMethodType !== AuthMethodType.WebAuthn) {
        createAccount(authMethod);
      }
    }
  }, [authMethod, signUpState.phase, startAuth, createAccount, router]);

  // Start session creation when account is ready
  useEffect(() => {
    if (
      authMethod &&
      currentAccount &&
      signUpState.phase === "creating_account"
    ) {
      startSessionCreation();
      initSession(authMethod, currentAccount);
    }
  }, [
    authMethod,
    currentAccount,
    signUpState.phase,
    startSessionCreation,
    initSession,
  ]);

  // Generate keys when session is ready
  useEffect(() => {
    if (sessionSigs && signUpState.phase === "creating_session") {
      generateSolanaKeys(sessionSigs);
    }
  }, [sessionSigs, signUpState.phase, generateSolanaKeys]);

  // Finalize signup when all data is ready
  useEffect(() => {
    if (
      currentAccount &&
      sessionSigs &&
      isValidSolanaAddress(signUpState.solanaAddress) &&
      signUpState.privateKeyResult &&
      signUpState.phase === "generating_keys" &&
      userEmail
    ) {
      finalizeSignUp(sessionSigs, userEmail);
    }
  }, [
    currentAccount,
    sessionSigs,
    signUpState.solanaAddress,
    signUpState.privateKeyResult,
    signUpState.phase,
    userEmail,
    finalizeSignUp,
    isValidSolanaAddress,
  ]);

  // Render loading states
  if (authLoading || signUpState.phase === "authenticating") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Authenticating your credentials..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (accountsLoading || signUpState.phase === "creating_account") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Creating your account..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (sessionLoading || signUpState.phase === "creating_session") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Securing your session..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (signUpState.phase === "generating_keys") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Generating your Solana address..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (signUpState.phase === "creating_user") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Creating your user profile..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (signUpState.phase === "finalizing") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Finalizing your account..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  // Success state
  if (signUpState.phase === "completed") {
    return (
      <div className="text-white flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <LucideVerified size={60} color="green" />
        <div className="text-white ml-auto mr-auto text-3xl font-bold mt-2">
          <p className="text-white/80 font-bold text-2xl">
            Account Created Successfully
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (signUpState.phase === "error" && signUpState.error) {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <div className="text-center text-white max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 14.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-red-400 mb-2">
            {signUpState.error.type === "network"
              ? "Connection Error"
              : signUpState.error.type === "key_generation"
              ? "Key Generation Error"
              : signUpState.error.type === "user_creation"
              ? "Account Creation Error"
              : signUpState.error.type === "account_creation"
              ? "Account Setup Error"
              : "Authentication Error"}
          </h3>

          <p className="text-gray-300 mb-6">{signUpState.error.message}</p>

          {signUpState.error.recoverable && signUpState.retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold transition-colors duration-200"
            >
              Retry ({3 - signUpState.retryCount} attempts left)
            </button>
          )}

          {(!signUpState.error.recoverable || signUpState.retryCount >= 3) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Unable to complete signup. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded text-white font-semibold transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default signup methods view
  return (
    <div className="h-[100%] flex items-center justify-center w-[100%] ml-auto mr-auto">
      <SignUpMethods
        authWithStytch={authWithStytch}
        goToLogin={goToLogin}
        error={combinedError instanceof Error ? combinedError : undefined}
      />
    </div>
  );
}

// Wrap the component with error boundary
export function WrappedSignUpView() {
  return (
    <SignUpErrorBoundary>
      <SignUpView />
    </SignUpErrorBoundary>
  );
}
