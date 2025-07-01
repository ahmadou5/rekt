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
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    await litNodeClient.connect();

    const response = await generatePrivateKey({
      pkpSessionSigs: session,
      network: evmOrSolana,
      memo,
      litNodeClient,
    });

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
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    await litNodeClient.connect();

    const response = await listEncryptedKeyMetadata({
      pkpSessionSigs: session,
      litNodeClient,
    });

    return response;
  } catch (error) {
    console.error(error);
  } finally {
    litNodeClient!.disconnect();
  }
};
