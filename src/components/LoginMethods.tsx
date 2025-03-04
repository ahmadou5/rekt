"use client";
import { useEffect, useState } from "react";

import StytchOTP from "./StytchOTP";
import AuthMethods from "./AuthMethods";
import Toaster from "./ui/toaster";

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

type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";

export default function LoginMethods({
  authWithStytch,
  signUp,
  error,
}: LoginProps) {
  const [view, setView] = useState<AuthView>("default");
  const [isToast, setIsToast] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      setIsToast(true);
    }
  }, []);
  return (
    <div className="container ">
      <div className="wrapper">
        {error && (
          <Toaster
            isToastOpen={isToast}
            content={error.message}
            isSuccess={false}
            setIsToastOpen={setIsToast}
          />
        )}

        {view === "default" && (
          <>
            <h1 className="text-white/90 text-2xl">Welcome Back</h1>
            <p className="text-white/70 mt-3 text-lg font-medium">
              Get access to your wallet.
            </p>
            <AuthMethods setView={setView} />
            <div className="mt-12">
              <button
                className="text-white w-[100%] text-xl flex items-center justify-center font-extralight"
                onClick={signUp}
              >
                <p className="text-white/70 font-bold ml-auto mr-5 ">
                  New User?<span className="ml-2 text-blue-500">Create</span>
                </p>
              </button>
            </div>
          </>
        )}
        {view === "email" && (
          <StytchOTP
            method={"email"}
            authWithStytch={authWithStytch}
            setView={setView}
          />
        )}

        {view === "phone" && (
          <StytchOTP
            method={"phone"}
            authWithStytch={authWithStytch}
            setView={setView}
          />
        )}
      </div>
    </div>
  );
}
