"use client";
import { useCallback, useState } from "react";
import { AuthMethod } from "@lit-protocol/types";
import { litNodeClient } from "../utils/lit.utils";
import { LitActionResource } from "@lit-protocol/auth-helpers";
import { IRelayPKP } from "@lit-protocol/types";
import { SessionSigs } from "@lit-protocol/types";
import { LIT_ABILITY } from "@lit-protocol/constants";

export default function useSession() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Generate session sigs and store new session data
   */
  const initSession = useCallback(
    async (authMethod: AuthMethod, pkp: IRelayPKP): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        // Ensure litNodeClient is connected
        const expiration = new Date(
          Date.now() + 1000 * 60 * 10 // 10 minutes
        ).toISOString(); // 1 week 60 * 24 * 7

        // Generate session sigs
        const sessionSigs = await litNodeClient.getPkpSessionSigs({
          pkpPublicKey: pkp.publicKey,
          authMethods: [authMethod],
          resourceAbilityRequests: [
            {
              resource: new LitActionResource("*"),
              ability: LIT_ABILITY.LitActionExecution,
            },
          ],
          expiration: expiration,
        });

        setSessionSigs(sessionSigs);
        console.log("Session sigs for nodes:", Object.keys(sessionSigs));
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    initSession,
    sessionSigs,
    loading,
    error,
  };
}
