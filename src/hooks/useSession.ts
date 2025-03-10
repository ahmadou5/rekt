"use client";
import { useCallback, useState } from "react";
import { AuthMethod } from "@lit-protocol/types";
import { getSessionSigs } from "../utils/lit.utils";
import { LitActionResource } from "@lit-protocol/auth-helpers";
import { IRelayPKP } from "@lit-protocol/types";
import { SessionSigs } from "@lit-protocol/types";
import { LIT_ABILITY } from "@lit-protocol/constants";
import { AuthSig } from "@lit-protocol/types";

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
        // Prepare session sigs params
        const chain = "solana";
        const resourceAbilities = [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ];
        const expiration = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7
        ).toISOString(); // 1 week

        // Generate session sigs
        const sessionSigs = await getSessionSigs({
          pkpPublicKey: pkp.publicKey,
          authMethod,
          sessionSigsParams: {
            chain,
            expiration,
            resourceAbilityRequests: resourceAbilities,
            authNeededCallback: async () => {
              // Implement your callback logic here and return a Promise<AuthSig>
              return new Promise((resolve) => {
                // Example implementation
                const authSig: AuthSig = {
                  sig: "example_signature",
                  derivedVia: "example_method",
                  signedMessage: "example_message",
                  address: "example_address",
                };
                resolve(authSig);
              });
            },
          },
        });

        setSessionSigs(sessionSigs);
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
