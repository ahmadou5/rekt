"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // For App Router
import useAuthenticate from "../hooks/useAuthenticate";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import NavLogo from "@/assets/logo.svg";
import Image from "next/image";
import Loading from "../components/Loading";
import LoginMethods from "../components/LoginMethods";
//import AccountSelection from "../components/AccountSelection";
import CreateAccount from "../components/CreateAccount";
import {
  handlePostEmail,
  handlePostIsLogin,
  handlePostSession,
  handlePostSolanaAddress,
} from "@/lib/helpers.lib";
import { generateWrappedKey, listWrappedKeys } from "@/lib/helper.lit";
import { StoredKeyMetadata } from "@lit-protocol/wrapped-keys";
import { useUserStore } from "../../store/UserStore";

export default function LoginView() {
  const { userEmail } = useUserStore();
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

  const [addresses, setAddresses] = useState<StoredKeyMetadata[] | undefined>(
    []
  );

  // Function to handle wrapped key generation

  const handleWrappedKey = async () => {
    try {
      if (!sessionSigs) {
        throw new Error("sessionSigs is undefined");
      }
      const wrappedKeyResponse = await generateWrappedKey(
        sessionSigs,
        "solana",
        "WrappedKey for Solana"
      );
      console.log(
        "Wrapped Key Response:",
        wrappedKeyResponse?.generatedPublicKey
      );
    } catch (error) {
      console.error("Error generating wrapped key:", error);
    }
  };
  useEffect(() => {
    const fetchSolAddress = async () => {
      if (!sessionSigs) {
        //console.error("Session Sigs are not available yet.");
        return;
      }
      try {
        const solAddress = await listWrappedKeys(sessionSigs);
        setAddresses(solAddress);
        console.log("Solana Address:", solAddress?.length);
      } catch (error) {
        console.error("Error fetching Solana address:", error);
      }
    };
    fetchSolAddress();
  }, [sessionSigs]);
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
  if (currentAccount && sessionSigs && (addresses?.length ?? 0) > 0) {
    handlePostSolanaAddress(addresses![0].publicKey);
    handlePostSession(sessionSigs);
    handlePostEmail(userEmail || "");
    handlePostIsLogin(true);
    return (
      <div className="text-white">
        {userEmail && (
          <div className="text-white mb-4 ml-auto mr-auto">
            Logged in as: {userEmail}
          </div>
        )}
        {(addresses?.length ?? 0) > 0 &&
          addresses!.map((address, i) => (
            <div
              key={i}
              className="text-white ml-auto mr-auto text-3xl font-bold mt-2"
            >
              {address.publicKey}
            </div>
          ))}
        {addresses?.length === 0 && (
          <div className="ml-auto mr-auto mt-10 flex flex-col items-center justify-center">
            <p className="text-white font-bold mb-12 text-xl">
              Lets Generate a solana key for you
            </p>
            <button
              onClick={() => handleWrappedKey()}
              className="bg-white/90 mt-7 text-black rounded-lg py-2 px-3"
            >
              Generate a WrappedKey
            </button>
          </div>
        )}
      </div>
    );
  }

  // If user is authenticated and has more than 1 account, show account selection
  if (authMethod && accounts.length > 0) {
    setCurrentAccount(accounts[0]); // Set the first account as current
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
