"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // For App Router
import useAuthenticate from "../hooks/useAuthenticate";
import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";
import Loading from "../components/Loading";
import LoginMethods from "../components/LoginMethods";
import CreateAccount from "../components/CreateAccount";
import {
  handlePostEmail,
  handlePostIsLogin,
  handlePostSession,
  handlePostSolanaAddress,
} from "@/lib/helpers.lib";
import { listWrappedKeys } from "@/lib/helper.lit";
import { StoredKeyMetadata } from "@lit-protocol/wrapped-keys";
import { useUserStore } from "../../store/UserStore";
import { LucideVerified } from "lucide-react";
import { UserService } from "@/lib/services/user.service";

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

  const createUser = async (email: string) => {
    try {
      const userData = await UserService.GetUserByMail(email);

      if (userData.success && userData.data) {
        console.log("User already exists:", userData.data);
        return userData.data;
      } else {
        const newUser = await UserService.CreateUser({
          username: email.split("@")[0],
          email: email,
          address: addresses![0].publicKey || "",
          pin: "",
        });
        console.log("New user created:", newUser);
        return newUser;
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  };

  // Function to handle wrapped key generation

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
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading copy={"Authenticating your credentials..."} error={error} />
      </div>
    );
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading copy={"Looking up your accounts..."} error={error} />;
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading copy={"Initializing your session..."} error={error} />
      </div>
    );
  }

  // If user is authenticated and has selected an account, initialize session
  if (currentAccount && sessionSigs && (addresses?.length ?? 0) > 0) {
    handlePostSolanaAddress(addresses![0].publicKey);
    handlePostSession(sessionSigs);
    handlePostEmail(userEmail || "");
    handlePostIsLogin(true);
    createUser(userEmail || "");
    return (
      <div className="text-white  flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <LucideVerified size={60} color="green" />

        <div className="text-white ml-auto mr-auto text-3xl font-bold mt-2">
          <p className="text-white/80 font-bold text-2xl">Session Granted</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and has more than 1 account, choose his first account
  if (authMethod && accounts.length > 0) {
    // If no account is selected, default to the first account
    if (!currentAccount) {
      setCurrentAccount(accounts[0]);
    }
    return (
      <div className=" flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading copy={"Validating Account..."} error={error} />;
      </div>
    );
  }

  // If user is authenticated but has no accounts, prompt to create an account
  if (authMethod && accounts.length === 0) {
    return <CreateAccount signUp={goToSignUp} error={error} />;
  }

  // If user is not authenticated, show login methods
  return (
    <div className="h-[100%] flex items-center justify-center w-[100%] ml-auto mr-auto">
      <LoginMethods
        authWithStytch={authWithStytch}
        signUp={goToSignUp}
        error={error}
      />
    </div>
  );
}
