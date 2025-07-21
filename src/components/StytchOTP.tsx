"use client";
import {
  useCallback,
  useRef,
  useState,
  useEffect,
  useReducer,
  memo,
} from "react";
import { StytchProvider, useStytch } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import Toaster from "./ui/toaster";
import { useUserStore } from "../../store/UserStore";

// IMPROVEMENT: Extract constants to avoid magic numbers and improve maintainability
const CONFIG = {
  CODE_LENGTH: 6,
  COUNTDOWN_SECONDS: 120,
  SESSION_DURATION_MINUTES: 60,
  AUTO_VERIFY_DELAY: 500,
  RESEND_MIN_INTERVAL: 30, // Prevent spam
} as const;

// IMPROVEMENT: Better type definitions for enhanced type safety
type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";
type OtpMethod = "email" | "phone";
type OtpStep = "submit" | "verify";

interface StytchOTPProps {
  method: OtpMethod;
  authWithStytch: (
    sessionJwt: string,
    userId: string,
    method: OtpMethod
  ) => Promise<void>;
  setView: React.Dispatch<React.SetStateAction<AuthView>>;
  isSignup?: boolean;
}

// IMPROVEMENT: Use reducer pattern for complex state management instead of multiple useState calls
// This prevents state synchronization issues and makes state transitions more predictable
interface OTPState {
  step: OtpStep;
  userId: string;
  methodId: string;
  code: string[];
  loading: boolean;
  countdown: number;
  errors: {
    auth: string;
    send: string;
  };
  toastStates: {
    verifySuccess: boolean;
    verifyError: boolean;
    sendSuccess: boolean;
    sendError: boolean;
  };
}

type OTPAction =
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_METHOD_ID"; payload: string }
  | { type: "SET_CODE"; payload: string[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_COUNTDOWN"; payload: number }
  | { type: "SET_ERROR"; payload: { type: "auth" | "send"; message: string } }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_STEP"; payload: OtpStep }
  | {
      type: "SET_TOAST";
      payload: { type: keyof OTPState["toastStates"]; value: boolean };
    }
  | { type: "RESET_CODE" }
  | { type: "RESET_STATE" };

// IMPROVEMENT: Centralized state management with reducer prevents inconsistent state updates
const initialState: OTPState = {
  step: "submit",
  userId: "",
  methodId: "",
  code: Array(CONFIG.CODE_LENGTH).fill(""),
  loading: false,
  countdown: 0,
  errors: { auth: "", send: "" },
  toastStates: {
    verifySuccess: false,
    verifyError: false,
    sendSuccess: false,
    sendError: false,
  },
};

function otpReducer(state: OTPState, action: OTPAction): OTPState {
  switch (action.type) {
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_METHOD_ID":
      return { ...state, methodId: action.payload };
    case "SET_CODE":
      return { ...state, code: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_COUNTDOWN":
      return { ...state, countdown: action.payload };
    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: action.payload.message,
        },
      };
    case "CLEAR_ERRORS":
      return { ...state, errors: { auth: "", send: "" } };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_TOAST":
      return {
        ...state,
        toastStates: {
          ...state.toastStates,
          [action.payload.type]: action.payload.value,
        },
      };
    case "RESET_CODE":
      return { ...state, code: Array(CONFIG.CODE_LENGTH).fill("") };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
);

// IMPROVEMENT: Custom hook for phone number validation with better international support
const usePhoneValidation = () => {
  const formatPhoneNumber = useCallback((phone: string): string => {
    // IMPROVEMENT: Better phone number cleaning and validation
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("1") && cleaned.length === 11) return `+${cleaned}`;
    if (cleaned.length === 10) return `+1${cleaned}`;
    return `+${cleaned}`;
  }, []);

  const validatePhoneNumber = useCallback(
    (phone: string): boolean => {
      // IMPROVEMENT: More robust phone validation with international support
      const phoneRegex = /^\+[1-9]\d{6,14}$/;
      const formatted = formatPhoneNumber(phone);
      return (
        phoneRegex.test(formatted) &&
        formatted.length >= 8 &&
        formatted.length <= 16
      );
    },
    [formatPhoneNumber]
  );

  return { formatPhoneNumber, validatePhoneNumber };
};

// IMPROVEMENT: Custom hook for countdown logic to separate concerns and prevent memory leaks
const useCountdown = (onComplete?: () => void) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = useCallback(
    (initialSeconds: number) => {
      // IMPROVEMENT: Clear existing timer to prevent multiple timers running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setSeconds(initialSeconds);
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [onComplete]
  );

  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
  }, []);

  // IMPROVEMENT: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return { seconds, startCountdown, stopCountdown, formatTime };
};

// IMPROVEMENT: Memoized digit input component to prevent unnecessary re-renders
const DigitInput = memo<{
  digit: string;
  index: number;
  loading: boolean;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  inputRef: (el: HTMLInputElement | null) => void;
}>(({ digit, index, loading, onChange, onKeyDown, onPaste, inputRef }) => {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={digit}
      disabled={loading}
      onChange={(e) => onChange(index, e.target.value)}
      onKeyDown={(e) => onKeyDown(index, e)}
      onPaste={index === 0 ? onPaste : undefined}
      className="w-12 h-12 lg:w-14 lg:h-14 text-center text-white text-xl font-medium bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
      autoComplete="off"
      aria-label={`Digit ${index + 1} of ${CONFIG.CODE_LENGTH}`}
      // IMPROVEMENT: Better accessibility with role and aria-describedby
      role="textbox"
      aria-describedby={index === 0 ? "code-instructions" : undefined}
    />
  );
});

DigitInput.displayName = "DigitInput";

// IMPROVEMENT: Helper function to handle SetStateAction<boolean>
const resolveSetStateAction = (
  value: React.SetStateAction<boolean>,
  currentValue: boolean
): boolean => {
  return typeof value === "function" ? value(currentValue) : value;
};

/**
 * IMPROVEMENT: Enhanced OTP component with better error handling, performance optimization,
 * and separation of concerns using custom hooks and reducer pattern
 */
const StytchOTP = ({ method, authWithStytch, isSignup }: StytchOTPProps) => {
  const { setUserEmail } = useUserStore();
  const [state, dispatch] = useReducer(otpReducer, initialState);

  // IMPROVEMENT: Use custom hooks for better separation of concerns
  const { formatPhoneNumber, validatePhoneNumber } = usePhoneValidation();
  const { seconds: countdown, startCountdown, formatTime } = useCountdown();

  // IMPROVEMENT: Use refs for stable references to prevent unnecessary re-renders
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stytchClient = useStytch();
  const verificationInProgressRef = useRef(false); // IMPROVEMENT: Prevent race conditions

  // IMPROVEMENT: Enhanced input validation with better email regex
  const validateInput = useCallback(
    (value: string, inputMethod: OtpMethod): boolean => {
      if (inputMethod === "email") {
        // IMPROVEMENT: More comprehensive email validation
        const emailRegex =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(value.trim().toLowerCase());
      } else {
        return validatePhoneNumber(value);
      }
    },
    [validatePhoneNumber]
  );

  // IMPROVEMENT: Debounced verification to prevent rapid successive calls
  const handleVerifyCode = useCallback(async () => {
    const fullCode = state.code.join("");
    if (
      fullCode.length !== CONFIG.CODE_LENGTH ||
      verificationInProgressRef.current
    ) {
      return;
    }

    // IMPROVEMENT: Prevent race conditions with ref-based locking
    verificationInProgressRef.current = true;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERRORS" });

    try {
      const response = await stytchClient.otps.authenticate(
        fullCode,
        state.methodId,
        {
          session_duration_minutes: CONFIG.SESSION_DURATION_MINUTES,
        }
      );

      dispatch({
        type: "SET_TOAST",
        payload: { type: "verifySuccess", value: true },
      });
      await authWithStytch(response.session_jwt, response.user_id, method);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Verification failed";
      dispatch({
        type: "SET_ERROR",
        payload: { type: "auth", message: errorMessage },
      });
      dispatch({
        type: "SET_TOAST",
        payload: { type: "verifyError", value: true },
      });

      // IMPROVEMENT: Clear code and focus first input on error for better UX
      dispatch({ type: "RESET_CODE" });
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      verificationInProgressRef.current = false; // IMPROVEMENT: Always reset the lock
    }
  }, [state.code, state.methodId, authWithStytch, method, stytchClient]);

  // IMPROVEMENT: Auto-verify with proper debouncing and race condition prevention
  useEffect(() => {
    const isCodeComplete = state.code.every((digit) => digit !== "");
    if (
      isCodeComplete &&
      !state.loading &&
      state.step === "verify" &&
      !verificationInProgressRef.current
    ) {
      const timer = setTimeout(() => {
        handleVerifyCode();
      }, CONFIG.AUTO_VERIFY_DELAY);

      return () => clearTimeout(timer);
    }
  }, [state.code, state.loading, state.step, handleVerifyCode]);

  // IMPROVEMENT: Better digit input handling with improved validation
  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // IMPROVEMENT: More strict input validation - only allow single digits
      if (!/^[0-9]?$/.test(value)) return;

      const newCode = [...state.code];
      newCode[index] = value;
      dispatch({ type: "SET_CODE", payload: newCode });

      // IMPROVEMENT: Auto-focus next input with bounds checking
      if (value && index < CONFIG.CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [state.code]
  );

  // IMPROVEMENT: Enhanced keyboard navigation with better UX
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace") {
        if (!state.code[index] && index > 0) {
          // IMPROVEMENT: Move to previous input and clear it
          const newCode = [...state.code];
          newCode[index - 1] = "";
          dispatch({ type: "SET_CODE", payload: newCode });
          inputRefs.current[index - 1]?.focus();
        } else if (state.code[index]) {
          // Clear current digit
          const newCode = [...state.code];
          newCode[index] = "";
          dispatch({ type: "SET_CODE", payload: newCode });
        }
      } else if (
        e.key === "Enter" &&
        state.code.every((digit) => digit !== "")
      ) {
        handleVerifyCode();
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < CONFIG.CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [state.code, handleVerifyCode]
  );

  // IMPROVEMENT: Enhanced paste handling with better validation and UX
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CONFIG.CODE_LENGTH);

    if (pastedData.length > 0) {
      const newCode = Array(CONFIG.CODE_LENGTH).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      dispatch({ type: "SET_CODE", payload: newCode });

      // IMPROVEMENT: Focus the last filled input or next empty input
      const focusIndex = Math.min(pastedData.length, CONFIG.CODE_LENGTH - 1);
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 10);
    }
  }, []);

  // IMPROVEMENT: Enhanced passcode sending with better error handling and rate limiting
  const sendPasscode = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateInput(state.userId, method)) {
        dispatch({
          type: "SET_ERROR",
          payload: { type: "send", message: `Please enter a valid ${method}` },
        });
        dispatch({
          type: "SET_TOAST",
          payload: { type: "sendError", value: true },
        });
        return;
      }

      // IMPROVEMENT: Rate limiting to prevent spam
      if (countdown > CONFIG.COUNTDOWN_SECONDS - CONFIG.RESEND_MIN_INTERVAL) {
        return;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERRORS" });

      try {
        let response;
        if (method === "email") {
          const email = state.userId.toLowerCase().trim();
          response = await stytchClient.otps.email.loginOrCreate(email);
          setUserEmail(email);
        } else {
          const formattedPhone = formatPhoneNumber(state.userId);
          response = await stytchClient.otps.sms.loginOrCreate(formattedPhone);
        }

        dispatch({ type: "SET_METHOD_ID", payload: response.method_id });
        dispatch({
          type: "SET_TOAST",
          payload: { type: "sendSuccess", value: true },
        });
        dispatch({ type: "SET_STEP", payload: "verify" });
        startCountdown(CONFIG.COUNTDOWN_SECONDS);

        // IMPROVEMENT: Auto-focus first digit input after successful send
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send code";
        dispatch({
          type: "SET_ERROR",
          payload: { type: "send", message: errorMessage },
        });
        dispatch({
          type: "SET_TOAST",
          payload: { type: "sendError", value: true },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [
      state.userId,
      method,
      validateInput,
      countdown,
      stytchClient,
      setUserEmail,
      formatPhoneNumber,
      startCountdown,
    ]
  );

  // IMPROVEMENT: Enhanced resend functionality with proper rate limiting
  const handleResendCode = useCallback(async () => {
    if (countdown > 0 || state.loading) return;

    dispatch({ type: "RESET_CODE" });

    // IMPROVEMENT: Create a synthetic event for reuse of sendPasscode logic
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;

    await sendPasscode(syntheticEvent);
  }, [countdown, state.loading, sendPasscode]);

  // IMPROVEMENT: Sync countdown with state for better state management
  useEffect(() => {
    dispatch({ type: "SET_COUNTDOWN", payload: countdown });
  }, [countdown]);

  return (
    <StytchProvider stytch={stytch}>
      <>
        {state.step === "submit" && (
          <>
            {/* IMPROVEMENT: Fixed toast handlers to properly resolve SetStateAction */}
            <Toaster
              setIsToastOpen={(value) =>
                dispatch({
                  type: "SET_TOAST",
                  payload: {
                    type: "sendError",
                    value: resolveSetStateAction(
                      value,
                      state.toastStates.sendError
                    ),
                  },
                })
              }
              isToastOpen={state.toastStates.sendError}
              isSuccess={false}
              content={state.errors.send || "Unknown Error"}
            />
            <Toaster
              setIsToastOpen={(value) =>
                dispatch({
                  type: "SET_TOAST",
                  payload: {
                    type: "sendSuccess",
                    value: resolveSetStateAction(
                      value,
                      state.toastStates.sendSuccess
                    ),
                  },
                })
              }
              isToastOpen={state.toastStates.sendSuccess}
              isSuccess={true}
              content="Code Sent"
            />

            {/* IMPROVEMENT: Better semantic HTML with proper heading structure */}
            <div className="text-white text-lg mb-4 text-center font-mono px-4">
              <h1>
                Enter your {method} to{" "}
                {isSignup ? "create an account" : "login"}
              </h1>
            </div>

            <div className="ml-auto mr-auto mt-12">
              <form onSubmit={sendPasscode} className="space-y-8" noValidate>
                <div className="mb-">
                  <label htmlFor={method} className="sr-only">
                    {method === "email" ? "Email address" : "Phone number"}
                  </label>
                  <input
                    id={method}
                    value={state.userId}
                    onChange={(e) =>
                      dispatch({ type: "SET_USER_ID", payload: e.target.value })
                    }
                    type={method === "email" ? "email" : "tel"}
                    name={method}
                    required
                    disabled={state.loading}
                    className="w-full px-4 py-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 outline-none transition-all text-base disabled:opacity-50"
                    placeholder={method === "email" ? "Email" : "Phone"}
                    autoComplete={method === "email" ? "email" : "tel"}
                    // IMPROVEMENT: Better accessibility with aria attributes
                    aria-invalid={state.errors.send ? "true" : "false"}
                    aria-describedby={
                      state.errors.send ? "input-error" : undefined
                    }
                  />
                  {/* IMPROVEMENT: Accessible error display */}
                  {state.errors.send && (
                    <div
                      id="input-error"
                      role="alert"
                      className="text-red-400 text-sm mt-2"
                    >
                      {state.errors.send}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={state.loading || !state.userId.trim()}
                  className={`w-full h-12 rounded-xl font-medium transition-all mt-5 text-base ${
                    state.loading || !state.userId.trim()
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-white/95 text-black hover:bg-gray-100"
                  }`}
                  // IMPROVEMENT: Better accessibility for loading state
                  aria-busy={state.loading}
                >
                  {state.loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {state.step === "verify" && (
          <>
            {/* IMPROVEMENT: Fixed toast handlers for verify step */}
            <Toaster
              setIsToastOpen={(value) =>
                dispatch({
                  type: "SET_TOAST",
                  payload: {
                    type: "verifyError",
                    value: resolveSetStateAction(
                      value,
                      state.toastStates.verifyError
                    ),
                  },
                })
              }
              isToastOpen={state.toastStates.verifyError}
              isSuccess={false}
              content={state.errors.auth || "Verification Failed"}
            />
            <Toaster
              setIsToastOpen={(value) =>
                dispatch({
                  type: "SET_TOAST",
                  payload: {
                    type: "verifySuccess",
                    value: resolveSetStateAction(
                      value,
                      state.toastStates.verifySuccess
                    ),
                  },
                })
              }
              isToastOpen={state.toastStates.verifySuccess}
              isSuccess={true}
              content="OTP Verified"
            />

            {/* IMPROVEMENT: Better semantic structure and accessibility */}
            <div className="ml-auto mr-auto text-center">
              <h1 className="text-white text-3xl text-center font-bold tracking-wide">
                CHECK YOUR INBOX
              </h1>
              <div className="space-y-2 mt-3">
                <div className="text-gray-400 text-center text-base">
                  Please enter the code sent to
                </div>
                <div className="text-white text-center mb-3 mt-4 font-medium text-base break-all">
                  {state.userId}
                </div>
              </div>
            </div>

            <div className="w-[96%] ml-auto mr-auto mt-12">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyCode();
                }}
                className="flex flex-col items-center px-1 justify-center"
              >
                {/* IMPROVEMENT: Better accessibility with instructions */}
                <div id="code-instructions" className="sr-only">
                  Enter the {CONFIG.CODE_LENGTH}-digit verification code. You
                  can paste the code or type each digit individually.
                </div>

                {/* IMPROVEMENT: Enhanced digit input with memoization */}
                <div
                  className="flex justify-center mb-9 lg:gap-3 gap-3"
                  role="group"
                  aria-labelledby="code-instructions"
                >
                  {state.code.map((digit, index) => (
                    <DigitInput
                      key={index}
                      digit={digit}
                      index={index}
                      loading={state.loading}
                      onChange={handleDigitChange}
                      onKeyDown={handleKeyDown}
                      onPaste={index === 0 ? handlePaste : undefined}
                      inputRef={(el) => {
                        inputRefs.current[index] = el;
                      }}
                    />
                  ))}
                </div>

                {/* IMPROVEMENT: Better loading indicator with accessibility */}
                {state.code.every((digit) => digit !== "") &&
                  !state.loading && (
                    <div
                      className="flex items-center justify-center mt-4 mb-6 text-blue-400 text-sm"
                      role="status"
                      aria-live="polite"
                    >
                      <div
                        className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"
                        aria-hidden="true"
                      ></div>
                      <span>Verifying automatically...</span>
                    </div>
                  )}

                <button
                  type="submit"
                  disabled={state.loading || state.code.some((digit) => !digit)}
                  className={`w-[99%] h-12 rounded-lg font-medium transition-all mt-4 mb-4 text-base ${
                    state.loading || state.code.some((digit) => !digit)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gray-600 text-white hover:bg-gray-500"
                  }`}
                  aria-busy={state.loading}
                >
                  {state.loading ? (
                    <div className="flex items-center justify-center">
                      <div
                        className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"
                        aria-hidden="true"
                      ></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>

                {/* IMPROVEMENT: Enhanced resend functionality with better UX */}
                <div className="text-center mt-8 mb-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || state.loading}
                    className={`text-base transition-colors ${
                      countdown > 0 || state.loading
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-400 hover:text-white"
                    }`}
                    aria-live="polite"
                  >
                    {countdown > 0
                      ? `Resend code (${formatTime(countdown)})`
                      : "Resend code"}
                  </button>
                </div>

                {/* IMPROVEMENT: Error display with better accessibility */}
                {state.errors.auth && (
                  <div
                    role="alert"
                    className="text-red-400 text-sm text-center mt-2"
                  >
                    {state.errors.auth}
                  </div>
                )}
              </form>
            </div>
          </>
        )}
      </>
    </StytchProvider>
  );
};

export default StytchOTP;
