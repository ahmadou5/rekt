"use client";
import { useCallback, useRef, useState, useEffect } from "react";
import { StytchProvider, useStytch } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import Toaster from "./ui/toaster";
import { useUserStore } from "../../store/UserStore";

type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";
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

type OtpMethod = "email" | "phone";
type OtpStep = "submit" | "verify";
interface AppError {
  authError: string;
  sendError: string;
}
const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
);

/**
 * One-time passcodes can be sent via phone number through Stytch
 */
const StytchOTP = ({ method, authWithStytch, isSignup }: StytchOTPProps) => {
  const { setUserEmail } = useUserStore();
  const [step, setStep] = useState<OtpStep>("submit");
  const [userId, setUserId] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [verifyToastSuccess, setVerifyToastSuccess] = useState<boolean>(false);
  const [verifyToastError, setVerifyToastError] = useState<boolean>(false);
  const [sendToastSuccess, setSendToastSuccess] = useState<boolean>(false);
  const [sendToastError, setSendToastError] = useState<boolean>(false);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  const [error, setError] = useState<AppError>({
    authError: "",
    sendError: "",
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stytchClient = useStytch();

  const formatPhoneNumber = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("+") ? phone : `+${cleaned}`;
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError({ authError: "", sendError: "" });
  }, []);
  // Enhanced input validation
  const validateInput = useCallback(
    (value: string, inputMethod: OtpMethod): boolean => {
      if (inputMethod === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      } else {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(value);
      }
    },
    []
  );

  // Improved countdown timer with cleanup
  const startCountdown = useCallback(() => {
    // Clear any existing timer
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(120);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Handle verification with improved error handling
  const handleVerifyCode = useCallback(async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setLoading(true);
    clearErrors();

    try {
      const response = await stytchClient.otps.authenticate(
        fullCode,
        methodId,
        {
          session_duration_minutes: 60,
        }
      );

      setVerifyToastSuccess(true);
      await authWithStytch(response.session_jwt, response.user_id, method);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Verification failed";
      setError({
        ...error,
        authError: errorMessage,
      });
      setVerifyToastError(true);

      // Clear code and focus first input on error
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  }, [
    code,
    methodId,
    authWithStytch,
    method,
    stytchClient,
    error,
    clearErrors,
  ]);

  // Auto-verify when all digits are entered
  useEffect(() => {
    const isCodeComplete = code.every((digit) => digit !== "");
    if (isCodeComplete && !loading && step === "verify") {
      // Add a small delay for better UX
      const timer = setTimeout(() => {
        handleVerifyCode();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [code, loading, step, handleVerifyCode]);

  // Handle digit input changes with auto-focus
  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Only allow single digits
      if (!/^\d?$/.test(value)) return;

      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input if value entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  // Handle backspace navigation
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Handle Enter key to submit (only if code is complete)
      if (e.key === "Enter" && code.every((digit) => digit !== "")) {
        handleVerifyCode();
      }
    },
    [code, handleVerifyCode]
  );

  // Handle paste functionality
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      const newCode = [...code];

      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      // Focus appropriate input after paste
      const nextEmptyIndex = newCode.findIndex((digit) => !digit);
      const focusIndex =
        nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
      inputRefs.current[focusIndex]?.focus();
    },
    [code]
  );

  // Enhanced passcode sending with better error handling
  async function sendPasscode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate input before sending
    if (!validateInput(userId, method)) {
      setError({
        ...error,
        sendError: `Please enter a valid ${method}`,
      });
      setSendToastError(true);
      return;
    }

    setLoading(true);
    clearErrors();

    try {
      let response;
      if (method === "email") {
        response = await stytchClient.otps.email.loginOrCreate(
          userId.toLowerCase().trim()
        );
        setUserEmail(userId.toLowerCase().trim());
      } else {
        const formattedPhone = formatPhoneNumber(userId);
        response = await stytchClient.otps.sms.loginOrCreate(formattedPhone);
      }

      setMethodId(response.method_id);
      setSendToastSuccess(true);
      setStep("verify");
      startCountdown();

      // Auto-focus first digit input after successful send
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send code";
      setError({
        ...error,
        sendError: errorMessage,
      });
      setSendToastError(true);
    } finally {
      setLoading(false);
    }
  }

  // Handle form submission for verification
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleVerifyCode();
  }

  // Resend code functionality
  const handleResendCode = useCallback(async () => {
    if (countdown > 0) return;

    setCode(["", "", "", "", "", ""]);
    await sendPasscode({
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>);
  }, [userId, method, sendPasscode, countdown]);

  // Format countdown display (MM:SS)
  const formatCountdown = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return (
    <StytchProvider stytch={stytch}>
      <>
        {step === "submit" && (
          <>
            <Toaster
              setIsToastOpen={setSendToastError}
              isToastOpen={sendToastError}
              isSuccess={sendToastSuccess}
              content={
                error && error.sendError.includes("*")
                  ? "Sending Failed"
                  : "Unknown Error"
              }
            />
            <Toaster
              setIsToastOpen={setSendToastSuccess}
              isToastOpen={sendToastSuccess}
              isSuccess={sendToastSuccess}
              content={"Code Sent"}
            />
            {/* Header */}

            <div className="text-white text-lg mb-4 text-center font-mono  px-4">
              Enter your {method} to {isSignup ? "create an account" : "login"}
            </div>

            <div className="ml-auto mr-auto mt-12">
              <form onSubmit={sendPasscode} className="space-y-8">
                <div className="mb-">
                  <label htmlFor={method} className="sr-only">
                    {method === "email" ? "Email address" : "Phone number"}
                  </label>
                  <input
                    id={method}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    type={method === "email" ? "email" : "tel"}
                    name={method}
                    required
                    className="w-full px-4 py-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 outline-none  transition-all text-base"
                    placeholder={method === "email" ? "Email" : "Phone"}
                    autoComplete={method === "email" ? "email" : "tel"}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !userId.trim()}
                  className={`w-full h-12 rounded-xl font-medium transition-all mt-5 text-base ${
                    loading || !userId.trim()
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-white/95 text-black hover:bg-gray-100"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            </div>
          </>
        )}
        {step === "verify" && (
          <>
            <Toaster
              setIsToastOpen={setVerifyToastError}
              isToastOpen={verifyToastError}
              isSuccess={verifyToastSuccess}
              content={
                error && error.authError.includes("*")
                  ? "Verification Failed"
                  : "Unknown Error"
              }
            />
            <Toaster
              setIsToastOpen={setVerifyToastSuccess}
              isToastOpen={verifyToastSuccess}
              isSuccess={verifyToastSuccess}
              content={"OTP Verified"}
            />
            {/* Header */}
            <div className="ml-auto mr-auto text-center">
              <h1 className="text-white text-3xl text-center font-bold tracking-wide">
                CHECK YOUR INBOX
              </h1>
              <div className="space-y-2 mt-3">
                <div className="text-gray-400 text-center text-base">
                  Please enter the code sent to
                </div>
                <div className="text-white text-center mb-3 mt-4 font-medium text-base break-all">
                  {userId}
                </div>
              </div>
            </div>

            <div className="w-[96%] ml-auto mr-auto mt-12">
              {/* Verification Form */}
              <form
                onSubmit={authenticate}
                className="flex flex-col items-center px-1 justify-center"
              >
                {/* Digit Input Boxes */}
                <div className="flex justify-center mb-9 lg:gap-3 gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-10 h-10 lg:w-14 lg:h-14 text-center text-white text-xl font-medium bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoComplete="off"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Auto-verification indicator */}
                {code.every((digit) => digit !== "") && !loading && (
                  <div className="flex items-center justify-center text-blue-400 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying automatically...
                  </div>
                )}

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={loading || code.some((digit) => !digit)}
                  className={`w-[99%] h-12 rounded-lg font-medium transition-all mt-4 mb-4 text-base ${
                    loading || code.some((digit) => !digit)
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gray-600 text-white hover:bg-gray-500"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>

                {/* Resend Code */}

                <div className="text-center mt-8 mb-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || loading}
                    className={`text-base transition-colors ${
                      countdown > 0 || loading
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {countdown > 0
                      ? `Resend code (${formatCountdown(countdown)})`
                      : "Resend code"}
                  </button>
                </div>

                {/* Try Again
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("submit");
                      setCode(["", "", "", "", "", ""]);
                      // Clear countdown when going back
                      if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                      }
                      setCountdown(0);
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Try again
                  </button>
                </div>*/}
              </form>
            </div>
          </>
        )}
      </>
    </StytchProvider>
  );
};

export default StytchOTP;
