"use client";
import { useState } from "react";
import { StytchProvider, useStytch } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import Toaster from "./ui/toaster";

type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";
interface StytchOTPProps {
  method: OtpMethod;
  authWithStytch: (
    sessionJwt: string,
    userId: string,
    method: OtpMethod
  ) => Promise<void>;
  setView: React.Dispatch<React.SetStateAction<AuthView>>;
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
const StytchOTP = ({ method, authWithStytch, setView }: StytchOTPProps) => {
  const [step, setStep] = useState<OtpStep>("submit");
  const [userId, setUserId] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [verifyToastSuccess, setVerifyToastSuccess] = useState<boolean>(false);
  const [verifyToastError, setVerifyToastError] = useState<boolean>(false);
  const [sendToastSuccess, setSendToastSuccess] = useState<boolean>(false);
  const [sendToastError, setSendToastError] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<AppError>({
    authError: "",
    sendError: "",
  });

  const stytchClient = useStytch();

  async function sendPasscode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError({
      ...error,
    });
    try {
      let response;
      if (method === "email") {
        response = await stytchClient.otps.email.loginOrCreate(userId);
      } else {
        response = await stytchClient.otps.sms.loginOrCreate(
          !userId.startsWith("+") ? `+${userId}` : userId
        );
      }
      //console.log(response);
      setSendToastSuccess(true);
      setMethodId(response.method_id);
      setStep("verify");
    } catch (err) {
      if (err instanceof Error)
        setError({
          ...error,
          sendError: err.message,
        });
      setSendToastError(true);
    } finally {
      //setToastSuccess(false);
      //  setToastError(false);
      setLoading(false);
    }
  }

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError({
      ...error,
    });
    try {
      const response = await stytchClient.otps.authenticate(code, methodId, {
        session_duration_minutes: 60,
      });
      setVerifyToastSuccess(true);
      await authWithStytch(response.session_jwt, response.user_id, method);
    } catch (err) {
      if (err instanceof Error)
        setError({
          ...error,
          authError: err.message,
        });
      setVerifyToastError(true);
    } finally {
      setLoading(false);
      //  setToastError(false);
      //  setToastSuccess(false);
    }
  }

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
                  : "Uknown Error"
              }
            />
            <Toaster
              setIsToastOpen={setSendToastSuccess}
              isToastOpen={sendToastSuccess}
              isSuccess={sendToastSuccess}
              content={"Code Sent"}
            />
            <h1 className="text-white/90 text-2xl">Enter your {method}</h1>
            <p className="text-white/70 mt-3 text-lg font-medium">
              A verification code will be sent to your {method}.
            </p>
            <div className="form-wrapper">
              <form className="form" onSubmit={sendPasscode}>
                <label htmlFor={method} className="sr-only">
                  {method === "email" ? "Email" : "Phone number"}
                </label>
                <input
                  id={method}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  type={method === "email" ? "email" : "tel"}
                  name={method}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 transition-all"
                  placeholder={
                    method === "email"
                      ? "Enter your email"
                      : "Your phone number"
                  }
                  autoComplete="off"
                ></input>
                <button
                  type="submit"
                  className={`h-11 ${
                    loading ? "bg-white/25" : "bg-white"
                  } rounded-lg mt-6`}
                  disabled={loading}
                >
                  Send code
                </button>
                <button
                  onClick={() => setView("default")}
                  className="text-white mt-4"
                >
                  Back
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
                error && error.sendError.includes("*")
                  ? "Sending Failed"
                  : "Uknon Error"
              }
            />
            <Toaster
              setIsToastOpen={setVerifyToastSuccess}
              isToastOpen={verifyToastSuccess}
              isSuccess={verifyToastSuccess}
              content={"OTP Verified"}
            />
            <h1 className="text-white/90 text-2xl">Check your {method}</h1>
            <p className="text-white/70 mt-3 text-lg font-medium">
              Enter the 6-digit verification code send to {userId}
            </p>
            <div className="form-wrapper">
              <form className="form" onSubmit={authenticate}>
                <label htmlFor="code" className="text-white ">
                  Code
                </label>
                <input
                  id="code"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value)}
                  type="code"
                  name="code"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Enter Verification code"
                  autoComplete="off"
                ></input>
                <button
                  type="submit"
                  disabled={loading}
                  className={`h-11 ${
                    loading ? "bg-white/25" : "bg-white"
                  } rounded-lg mt-6`}
                >
                  Verify
                </button>
                <button
                  onClick={() => setStep("submit")}
                  className="text-white mt-4"
                >
                  Try again
                </button>
              </form>
            </div>
          </>
        )}
      </>
    </StytchProvider>
  );
};

export default StytchOTP;
