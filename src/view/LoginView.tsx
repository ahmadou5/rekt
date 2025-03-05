"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // For App Router
import useAuthenticate from "../hooks/useAuthenticate";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import NavLogo from "@/assets/logo.svg";
import Image from "next/image";
import Loading from "../components/Loading";
import LoginMethods from "../components/LoginMethods";
import AccountSelection from "../components/AccountSelection";
import CreateAccount from "../components/CreateAccount";
import { handlePostSession } from "@/lib/helpers.lib";

export default function LoginView() {
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
  const router = useRouter();

  const error = authError || accountsError || sessionError;

  function goToSignUp() {
    router.push("/signup");
  }

  useEffect(() => {
    // If user is authenticated, fetch accounts
    if (authMethod) {
      router.replace(window.location.pathname, undefined);
      fetchAccounts(authMethod);
    }
  }, [authMethod, fetchAccounts]);

  useEffect(() => {
    // If user is authenticated and has selected an account, initialize session
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
    return <Loading copy={"Looking up your accounts..."} error={error} />;
  }

  if (sessionLoading) {
    return <Loading copy={"Securing your session..."} error={error} />;
  }

  // If user is authenticated and has selected an account, initialize session
  if (currentAccount && sessionSigs) {
    handlePostSession(sessionSigs);
    return (
      <div className="text-white">{`${sessionSigs} -- ${currentAccount.ethAddress}`}</div>
    );
  }

  // If user is authenticated and has more than 1 account, show account selection
  if (authMethod && accounts.length > 0) {
    return (
      <AccountSelection
        accounts={accounts}
        setCurrentAccount={setCurrentAccount}
        error={error}
      />
    );
  }

  // If user is authenticated but has no accounts, prompt to create an account
  if (authMethod && accounts.length === 0) {
    return <CreateAccount signUp={goToSignUp} error={error} />;
  }

  // If user is not authenticated, show login methods
  return (
    <div className="h-screen w-[100%] px-2 flex flex-col items-center justify-center">
      <div className="relative h-[13vh]">
        <Image
          src={NavLogo}
          alt="InFuse Logo"
          width={180}
          height={180}
          className="animate-pulse/4"
          priority
        />
      </div>
      <LoginMethods
        authWithStytch={authWithStytch}
        signUp={goToSignUp}
        error={error}
      />
    </div>
  );
}
