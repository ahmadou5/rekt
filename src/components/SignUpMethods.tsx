import { useEffect, useState } from "react";

import StytchOTP from "./StytchOTP";
import AuthMethods from "./AuthMethods";
import Toaster from "./ui/toaster";

interface SignUpProps {
  authWithStytch: (
    sessionJwt: string,
    userId: string,
    method: "email" | "phone"
  ) => Promise<void>;
  goToLogin: () => void;
  error?: Error;
}

type AuthView = "default" | "email" | "phone" | "wallet" | "webauthn";

export default function SignUpMethods({
  authWithStytch,
  goToLogin,
  error,
}: SignUpProps) {
  const [view, setView] = useState<AuthView>("default");
  const [isToast, setIsToast] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      setIsToast(true);
    }
  }, []);
  return (
    <div className="container">
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
            <h1 className="text-white/90 text-2xl">Get started</h1>
            <p className="text-white/70 mt-2 text-lg font-medium">
              Create a smart wallet that is secured by accounts you already
              have.
            </p>
            <AuthMethods setView={setView} />

            <div className="mt-12">
              <button
                className="text-white w-[100%] text-xl flex items-center justify-center font-extralight"
                onClick={goToLogin}
              >
                <p className="text-white/70 font-bold ml-auto mr-5 ">
                  Have an account?
                  <span className="ml-2 text-blue-500">Sign in</span>
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
