import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";

import { api } from "@lit-protocol/wrapped-keys";
import { LIT_NETWORKS_KEYS, SessionSigsMap } from "@lit-protocol/types";

const { generatePrivateKey, listEncryptedKeyMetadata } = api;

export const generateWrappedKey = async (
  session: SessionSigsMap,
  evmOrSolana: "evm" | "solana",
  memo: string
) => {
  let litNodeClient: LitNodeClient;

  try {
    console.log("🔄 Connecting to Lit network...");
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    await litNodeClient.connect();
    console.log("✅ Connected to Lit network");

    console.log("🔄 Getting PKP Session Sigs...", session);

    console.log("🔄 Generating wrapped key...");
    const response = await generatePrivateKey({
      pkpSessionSigs: session,
      network: evmOrSolana,
      memo,
      litNodeClient,
    });
    console.log(
      `✅ Generated wrapped key with id: ${response.id} and public key: ${response.generatedPublicKey}`
    );
    return response;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
  } finally {
    litNodeClient!.disconnect();
  }
};

export const listWrappedKeys = async (session: SessionSigsMap) => {
  let litNodeClient: LitNodeClient;

  try {
    console.log("🔄 Connecting to Lit network...");
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    await litNodeClient.connect();
    console.log("✅ Connected to Lit network");

    console.log("🔄 Getting metadata for Wrapped Keys associated with PKP...");
    const response = await listEncryptedKeyMetadata({
      pkpSessionSigs: session,
      litNodeClient,
    });
    console.log(`✅ Got Wrapped Key metadata for ${response.length} keys`);
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    litNodeClient!.disconnect();
  }
};
