"use client";
import { useEffect, useState } from "react";
import useAuthenticate from "../hooks/useAuthenticate";

import useSession from "../hooks/useSession";
import useAccounts from "../hooks/useAccounts";

import { AuthMethodType } from "@lit-protocol/constants";
import SignUpMethods from "../components/SignUpMethods";
import Loading from "../components/Loading";
import { useRouter } from "next/navigation"; // For App Router

import {
  handlePostSession,
  handlePostSolanaAddress,
  handlePostEmail,
  handlePostIsLogin,
} from "@/lib/helpers.lib";

import { generateWrappedKey } from "@/lib/helper.lit";
import { LucideVerified } from "lucide-react";
import { useUserStore } from "../../store/UserStore";
import { UserService } from "@/lib/services/user.service";

export default function SignUpView() {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const { userEmail } = useUserStore();
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
          address: address || "",
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

  useEffect(() => {
    const getUser = async () => {
      try {
        if (!sessionSigs) {
          throw new Error("sessionSigs is undefined");
        }
        const wrappedKeyResponse = await generateWrappedKey(
          sessionSigs,
          "solana",
          "WrappedKey for Solana"
        );
        setAddress(wrappedKeyResponse?.generatedPublicKey);
        console.log(
          "Wrapped Key Response:",
          wrappedKeyResponse?.generatedPublicKey
        );
      } catch (error) {
        console.error("Error generating wrapped key:", error);
      }
    };

    if (currentAccount && sessionSigs) {
      getUser();
      handlePostSession(sessionSigs);
      handlePostEmail(userEmail || "");
      handlePostIsLogin(false);
      createUser(userEmail || "")
        .then((user) => {
          console.log("User created or fetched:", user);
        })
        .catch((error) => {
          console.error("Error in user creation:", error);
        });
    }
  }, [currentAccount, sessionSigs]);
  useEffect(() => {
    if (address) {
      handlePostSolanaAddress(address);
    }
  }, [address]);
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
        <Loading copy={"Creating your account..."} error={error} />;
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <Loading copy={"Securing your session..."} error={error} />;
      </div>
    );
  }

  if (currentAccount && sessionSigs) {
    if (!address) {
      return (
        <div className="flex items-center justify-center flex-col h-screen w-[100%] px-2">
          <Loading copy={"Generating your Solana address..."} error={error} />
        </div>
      );
    }
    return (
      <div className="text-white  flex items-center justify-center flex-col h-screen w-[100%] px-2">
        <LucideVerified size={60} color="green" />
        <div className="text-white ml-auto mr-auto text-3xl font-bold mt-2">
          <p className="text-white/80 font-bold text-2xl">Session Granted</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="h-[100%] flex items-center justify-center w-[100%] ml-auto mr-auto">
        <SignUpMethods
          authWithStytch={authWithStytch}
          goToLogin={() => router.push("/login")}
          error={error}
        />
      </div>
    );
  }
}
