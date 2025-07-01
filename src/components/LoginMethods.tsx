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
    <div className="w-[100%] h-[100%] ml-auto mr-auto ">
      <div className="w-[100%] h-[100%] ml-auto mr-auto flex items-center justify-center flex-col">
        {error && (
          <Toaster
            isToastOpen={isToast}
            content={error.message}
            isSuccess={false}
            setIsToastOpen={setIsToast}
          />
        )}

        {view === "default" && (
          <div className="flex items-center mt-8 justify-center flex-col h-auto p-5 bg-white/0 rounded-3xl w-[100%] px-1">
            <h1 className="text-white/90 text-2xl">Access your wallet.</h1>
            <div className="text-white/70 mt-3 text-lg font-medium"></div>
            <AuthMethods setView={setView} />
            <div className="mt-12 w-[100%] flex items-center justify-center">
              <button
                className="text-white w-[100%] text-xl flex items-center justify-center font-extralight"
                onClick={signUp}
              >
                <p className="text-white/70 font-bold ml-auto mr-5 ">
                  New User?<span className="ml-2 text-blue-500">Create</span>
                </p>
              </button>
            </div>
          </div>
        )}
        {view === "email" && (
          <div className=" h-auto w-[90%] px-2 py-4 rounded-lg">
            <StytchOTP
              method={"email"}
              authWithStytch={authWithStytch}
              setView={setView}
              isSignup={false}
            />
          </div>
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
