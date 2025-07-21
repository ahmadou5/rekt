"use client";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuthenticate from "../hooks/useAuthenticate";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import Loading from "../components/Loading";
import LoginMethods from "../components/LoginMethods";
import CreateAccount from "../components/CreateAccount";
import { useUserStore } from "../../store/UserStore";
import { LucideVerified } from "lucide-react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoginErrorBoundary } from "../components/LoginErrorBoundary";

export default function LoginView() {
  const { userEmail } = useUserStore();
  const router = useRouter();

  // Custom hook for login flow management
  const {
    loginState,
    fetchSolanaKeys,
    finalizeAuthentication,
    handleRetry,
    startAuth,
    startFetchingAccounts,
    startSessionCreation,
    isValidAddresses,
  } = useLoginFlow();

  // Existing hooks
  const {
    authMethod,
    authWithStytch,
    loading: authLoading,
    error: authError,
  } = useAuthenticate();

  const {
    fetchAccounts,
    setCurrentAccount,
    currentAccount,
    accounts,
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
    authError || accountsError || sessionError || loginState.error;

  // Navigation handler
  const goToSignUp = useCallback(() => {
    router.push("/signup");
  }, [router]);

  // Authentication flow effects
  useEffect(() => {
    if (authMethod && loginState.phase === "idle") {
      startAuth();
      router.replace(window.location.pathname, undefined);
      fetchAccounts(authMethod);
      startFetchingAccounts();
    }
  }, [
    authMethod,
    loginState.phase,
    startAuth,
    startFetchingAccounts,
    fetchAccounts,
    router,
  ]);

  // Auto-select first account if available
  useEffect(() => {
    if (authMethod && accounts.length > 0 && !currentAccount) {
      setCurrentAccount(accounts[0]);
    }
  }, [authMethod, accounts, currentAccount, setCurrentAccount]);

  // Start session creation when account is selected
  useEffect(() => {
    if (
      authMethod &&
      currentAccount &&
      loginState.phase === "fetching_accounts"
    ) {
      startSessionCreation();
      initSession(authMethod, currentAccount);
    }
  }, [
    authMethod,
    currentAccount,
    loginState.phase,
    startSessionCreation,
    initSession,
  ]);

  // Fetch keys when session is ready
  useEffect(() => {
    if (sessionSigs && loginState.phase === "creating_session") {
      fetchSolanaKeys(sessionSigs);
    }
  }, [sessionSigs, loginState.phase, fetchSolanaKeys]);

  // Finalize authentication when all data is ready
  useEffect(() => {
    if (
      currentAccount &&
      sessionSigs &&
      isValidAddresses(loginState.addresses) &&
      loginState.privateKeyResult &&
      loginState.phase === "fetching_keys" &&
      userEmail
    ) {
      finalizeAuthentication(sessionSigs, userEmail);
    }
  }, [
    currentAccount,
    sessionSigs,
    loginState.addresses,
    loginState.privateKeyResult,
    loginState.phase,
    userEmail,
    finalizeAuthentication,
    isValidAddresses,
  ]);

  // Render loading states
  if (authLoading || loginState.phase === "authenticating") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Authenticating your credentials..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (accountsLoading || loginState.phase === "fetching_accounts") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Looking up your accounts..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (sessionLoading || loginState.phase === "creating_session") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Initializing your session..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (loginState.phase === "fetching_keys") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Fetching wallet keys..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  if (loginState.phase === "finalizing") {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Finalizing authentication..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  // Success state
  if (loginState.phase === "authenticated") {
    return (
      <div className="text-white flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <LucideVerified size={60} color="green" />
        <div className="text-white ml-auto mr-auto text-3xl font-bold mt-2">
          <p className="text-white/80 font-bold text-2xl">Session Granted</p>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (loginState.phase === "error" && loginState.error) {
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
            {loginState.error.type === "network"
              ? "Connection Error"
              : loginState.error.type === "key_generation"
              ? "Key Generation Error"
              : loginState.error.type === "user_creation"
              ? "Account Creation Error"
              : "Authentication Error"}
          </h3>

          <p className="text-gray-300 mb-6">{loginState.error.message}</p>

          {loginState.error.recoverable && loginState.retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold transition-colors duration-200"
            >
              Retry ({3 - loginState.retryCount} attempts left)
            </button>
          )}

          {(!loginState.error.recoverable || loginState.retryCount >= 3) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Unable to complete authentication. Please try refreshing the
                page.
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

  // Account validation loading
  if (authMethod && accounts.length > 0 && !currentAccount) {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading
          copy="Validating Account..."
          error={combinedError instanceof Error ? combinedError : undefined}
        />
      </div>
    );
  }

  // Create account flow
  if (authMethod && accounts.length === 0) {
    return (
      <CreateAccount
        signUp={goToSignUp}
        error={combinedError instanceof Error ? combinedError : undefined}
      />
    );
  }

  // Default login methods view
  return (
    <div className="h-[100%] flex items-center justify-center w-[100%] ml-auto mr-auto">
      <LoginMethods
        authWithStytch={authWithStytch}
        signUp={goToSignUp}
        error={combinedError instanceof Error ? combinedError : undefined}
      />
    </div>
  );
}

// Wrap the component with error boundary
export function WrappedLoginView() {
  return (
    <LoginErrorBoundary>
      <LoginView />
    </LoginErrorBoundary>
  );
}
