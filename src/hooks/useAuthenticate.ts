"use client";
import { useCallback, useState } from "react";

import { AuthMethod } from "@lit-protocol/types";
import { authenticateWithStytch } from "../utils/lit.utils";
//import { useConnect } from "wagmi";

export default function useAuthenticate() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Handle redirect from Google OAuth
   */

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (
      accessToken: string,
      userId?: string,
      method?: string
    ): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = (await authenticateWithStytch(
          accessToken,
          userId,
          method
        )) as AuthMethod;
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    authWithStytch,
    authMethod,
    loading,
    error,
  };
}
