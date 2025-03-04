"use client";
import { useEffect } from "react";
import useAuthenticate from "../hooks/useAuthenticate";
import NavLogo from "@/assets/logo.svg";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";

import { AuthMethodType } from "@lit-protocol/constants";
import SignUpMethods from "../components/SignUpMethods";
import Loading from "../components/Loading";
import { useRouter } from "next/navigation"; // For App Router
import Image from "next/image";
const stytch = createStytchUIClient(process.env.NEXT_STYTCH_PUBLIC_TOKEN || "");
export default function SignUpView() {
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
  const router = useRouter();

  const error = authError || accountsError || sessionError;

  if (error) {
    if (authError) {
      console.error("Auth error:", authError);
    }

    if (accountsError) {
      console.error("Accounts error:", accountsError);
    }

    if (sessionError) {
      console.error("Session error:", sessionError);
    }
  }

  useEffect(() => {
    // If user is authenticated, create an account
    // For WebAuthn, the account creation is handled by the registerWithWebAuthn function
    if (authMethod && authMethod.authMethodType !== AuthMethodType.WebAuthn) {
      router.replace(window.location.pathname, undefined);
      createAccount(authMethod);
    }
  }, [authMethod, createAccount]);

  useEffect(() => {
    // If user is authenticated and has at least one account, initialize session
    if (authMethod && currentAccount) {
      initSession(authMethod, currentAccount);
    }
  }, [authMethod, currentAccount, initSession]);

  if (authLoading) {
    return (
      <Loading copy={"Authenticating your credentials..."} error={error} />
    );
  }

  if (accountsLoading) {
    return <Loading copy={"Creating your account..."} error={error} />;
  }

  if (sessionLoading) {
    return <Loading copy={"Securing your session..."} error={error} />;
  }

  if (currentAccount && sessionSigs) {
    return (
      <div className="text-white">{`${currentAccount.ethAddress} = ${sessionSigs[1].derivedVia}`}</div>
    );
  } else {
    return (
      <StytchProvider stytch={stytch}>
        <div className="h-screen w-[100%] px-2 flex flex-col items-center justify-center">
          <div className="relative h-[10vh]">
            <Image
              src={NavLogo}
              alt="InFuse Logo"
              width={180}
              height={180}
              className="animate-pulse/4"
              priority
            />
          </div>
          <SignUpMethods
            authWithStytch={authWithStytch}
            goToLogin={() => router.push("/login")}
            error={error}
          />
        </div>
      </StytchProvider>
    );
  }
}
