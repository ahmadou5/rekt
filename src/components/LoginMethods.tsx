"use client";
import { useEffect, useReducer, useCallback, memo } from "react";
import StytchOTP from "./StytchOTP";
import AuthMethods from "./AuthMethods";
import Toaster from "./ui/toaster";

// IMPROVEMENT: Extract constants for better maintainability
const CONFIG = {
  TOAST_AUTO_DISMISS_DELAY: 5000,
} as const;

// IMPROVEMENT: Better type definitions with union types
type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";
type OtpMethod = "email" | "phone";

interface LoginProps {
  authWithStytch: (
    sessionJwt: string,
    userId: string,
    method: OtpMethod
  ) => Promise<void>;
  signUp: () => void;
  error?: Error;
}

// IMPROVEMENT: Use reducer pattern for better state management
interface LoginState {
  view: AuthView;
  isToastOpen: boolean;
  errorMessage: string;
}

type LoginAction =
  | { type: "SET_VIEW"; payload: AuthView }
  | { type: "SET_TOAST_OPEN"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET_STATE" };

const initialState: LoginState = {
  view: "default",
  isToastOpen: false,
  errorMessage: "",
};

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_TOAST_OPEN":
      return { ...state, isToastOpen: action.payload };
    case "SET_ERROR":
      return {
        ...state,
        errorMessage: action.payload,
        isToastOpen: true,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        errorMessage: "",
        isToastOpen: false,
      };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

// IMPROVEMENT: Helper function to handle SetStateAction<boolean>
const resolveSetStateAction = (
  value: React.SetStateAction<boolean>,
  currentValue: boolean
): boolean => {
  return typeof value === "function" ? value(currentValue) : value;
};

// IMPROVEMENT: Memoized header component to prevent unnecessary re-renders
const LoginHeader = memo(() => (
  <div className="flex items-center mt-8 justify-center flex-col h-auto p-5 bg-white/0 rounded-3xl w-[100%] px-1">
    <h1 className="text-white/90 text-2xl font-bold">Access your wallet</h1>
    <div className="text-white/70 mt-3 text-lg font-medium px-4 text-center">
      {/* IMPROVEMENT: Add descriptive text for better UX */}
      Sign in to access your secure smart wallet
    </div>
  </div>
));

LoginHeader.displayName = "LoginHeader";

// IMPROVEMENT: Memoized signup prompt component with better accessibility
const SignUpPrompt = memo<{ onClick: () => void }>(({ onClick }) => (
  <div className="mt-12 w-[100%] flex items-center justify-center">
    <button
      className="text-white w-[100%] text-xl flex items-center justify-center font-extralight transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg p-2"
      onClick={onClick}
      type="button"
      aria-label="Go to sign up page"
    >
      <p className="text-white/70 font-bold ml-auto mr-5">
        New User?
        <span className="ml-2 text-blue-500 hover:text-blue-400 transition-colors">
          Create
        </span>
      </p>
    </button>
  </div>
));

SignUpPrompt.displayName = "SignUpPrompt";

// IMPROVEMENT: Memoized OTP container component
const OTPContainer = memo<{
  method: OtpMethod;
  authWithStytch: LoginProps["authWithStytch"];
  setView: React.Dispatch<React.SetStateAction<AuthView>>;
  isSignup?: boolean;
}>(({ method, authWithStytch, setView, isSignup = false }) => (
  <div className="h-auto w-[90%] px-2 py-4 rounded-lg">
    <StytchOTP
      method={method}
      authWithStytch={authWithStytch}
      setView={setView}
      isSignup={isSignup}
    />
  </div>
));

OTPContainer.displayName = "OTPContainer";

// IMPROVEMENT: Memoized placeholder component for future auth methods
const AuthMethodPlaceholder = memo<{
  method: AuthView;
  onBack: () => void;
}>(({ method, onBack }) => (
  <div className="h-auto w-[90%] px-2 py-4 rounded-lg">
    <div className="text-white text-center">
      <h2 className="text-xl mb-4 capitalize">
        {method === "wallet" ? "Wallet Authentication" : "WebAuthn"}
      </h2>
      <p className="text-gray-400 mb-4">
        {method === "wallet"
          ? "Connect your existing wallet to sign in"
          : "Use biometric or security key authentication"}
      </p>
      <p className="text-gray-500 text-sm mb-6">Coming soon...</p>
      <button
        onClick={onBack}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        type="button"
        aria-label="Back to authentication options"
      >
        Back to options
      </button>
    </div>
  </div>
));

AuthMethodPlaceholder.displayName = "AuthMethodPlaceholder";

/**
 * IMPROVEMENT: Enhanced Login component with better state management,
 * error handling, accessibility, and performance optimization
 */
export default function LoginMethods({
  authWithStytch,
  signUp,
  error,
}: LoginProps) {
  const [state, dispatch] = useReducer(loginReducer, initialState);

  // IMPROVEMENT: Memoized callbacks to prevent unnecessary re-renders
  // Handle both direct values and function updates for compatibility with React.Dispatch<SetStateAction<AuthView>>
  const handleSetView = useCallback(
    (value: React.SetStateAction<AuthView>) => {
      if (typeof value === "function") {
        // If it's a function, call it with current state to get the new value
        const newView = value(state.view);
        dispatch({ type: "SET_VIEW", payload: newView });
      } else {
        // If it's a direct value, use it directly
        dispatch({ type: "SET_VIEW", payload: value });
      }
    },
    [state.view]
  );

  const handleSignUp = useCallback(() => {
    // IMPROVEMENT: Clear any existing errors when navigating
    dispatch({ type: "CLEAR_ERROR" });
    signUp();
  }, [signUp]);

  const handleBackToDefault = useCallback(() => {
    dispatch({ type: "SET_VIEW", payload: "default" });
  }, []);

  const handleToastClose = useCallback(
    (value: React.SetStateAction<boolean>) => {
      const resolved = resolveSetStateAction(value, state.isToastOpen);
      dispatch({ type: "SET_TOAST_OPEN", payload: resolved });

      // IMPROVEMENT: Clear error message when toast is closed
      if (!resolved) {
        setTimeout(() => {
          dispatch({ type: "CLEAR_ERROR" });
        }, 300); // Small delay for smooth animation
      }
    },
    [state.isToastOpen]
  );

  // IMPROVEMENT: Enhanced error handling with proper cleanup and auto-dismiss
  useEffect(() => {
    if (error?.message) {
      dispatch({ type: "SET_ERROR", payload: error.message });

      // IMPROVEMENT: Auto-dismiss toast after delay
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_ERROR" });
      }, CONFIG.TOAST_AUTO_DISMISS_DELAY);

      return () => clearTimeout(timer);
    }
  }, [error?.message]);

  // IMPROVEMENT: Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      dispatch({ type: "RESET_STATE" });
    };
  }, []);

  return (
    <div className="w-[100%] h-[100%] ml-auto mr-auto">
      <div className="w-[100%] h-[100%] ml-auto mr-auto flex items-center justify-center flex-col">
        {/* IMPROVEMENT: Enhanced error toast with better accessibility */}
        {state.errorMessage && (
          <Toaster
            isToastOpen={state.isToastOpen}
            content={state.errorMessage}
            isSuccess={false}
            setIsToastOpen={handleToastClose}
            // IMPROVEMENT: Add accessibility attributes
            //role="alert"
            aria-live="assertive"
          />
        )}

        {/* IMPROVEMENT: Better conditional rendering with consistent structure */}
        {state.view === "default" && (
          <>
            <LoginHeader />
            <AuthMethods setView={handleSetView} isSignup={false} />
            <SignUpPrompt onClick={handleSignUp} />
          </>
        )}

        {state.view === "email" && (
          <OTPContainer
            method="email"
            authWithStytch={authWithStytch}
            setView={handleSetView}
            isSignup={false}
          />
        )}

        {state.view === "phone" && (
          <OTPContainer
            method="phone"
            authWithStytch={authWithStytch}
            setView={handleSetView}
            isSignup={false}
          />
        )}

        {/* IMPROVEMENT: Handle other auth methods with proper placeholders */}
        {(state.view === "wallet" || state.view === "webauthn") && (
          <AuthMethodPlaceholder
            method={state.view}
            onBack={handleBackToDefault}
          />
        )}
      </div>
    </div>
  );
}
