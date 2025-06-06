import { SessionSigs } from "@lit-protocol/types";
import { AuthSig } from "@lit-protocol/types";
import { config } from "@lit-protocol/wrapped-keys";
// import all lit actions cod
// or import individual lit actions
import {
  generateEncryptedEthereumPrivateKey,
  generateEncryptedSolanaPrivateKey,
} from "@lit-protocol/wrapped-keys-lit-actions";

// set the litActionRepository to set all lit actions
// config.setLitActionsCode({ litActionRepository });
// or set individual lit actions
config.setLitActionsCode({
  generateEncryptedKey: {
    evm: generateEncryptedEthereumPrivateKey.code,
    solana: generateEncryptedSolanaPrivateKey.code,
  },
});

type SessionSignature = SessionSigs | AuthSig | string | undefined;

export const handlePostIsLogin = (login?: boolean) => {
  try {
    // Ensure we always send a string
    const messageToSend = JSON.stringify({
      type: "IS_LOGIN",
      login: typeof login === "string" ? login : JSON.stringify(login),
    });

    console.log("Message being sent:", messageToSend);

    window.parent.postMessage(messageToSend, "*");

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error in log:", error);

    window.parent.postMessage(
      JSON.stringify({
        type: "LOGIN_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      "*"
    );
  }
};

export const handlePostSession = (sessionSig?: SessionSignature) => {
  try {
    console.log("Input sessionSig:", sessionSig);
    console.log("Input sessionSig type:", typeof sessionSig);

    // Ensure we always send a string
    const messageToSend = JSON.stringify({
      type: "AUTH_SUCCESS",
      sessionSig:
        typeof sessionSig === "string"
          ? sessionSig
          : JSON.stringify(sessionSig),
    });

    console.log("Message being sent:", messageToSend);

    window.parent.postMessage(messageToSend, "*");

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error in handlePostSession:", error);

    window.parent.postMessage(
      JSON.stringify({
        type: "AUTH_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      "*"
    );
  }
};

export const handlePostSolanaAddress = (address?: string) => {
  try {
    console.log("Input Address:", address);
    console.log("Input sessionSig type:", typeof String(address));

    // Ensure we always send a string
    const messageToSend = JSON.stringify({
      type: "SOLANA_ADDRESS",
      solanaAddress:
        typeof address === "string" ? address : JSON.stringify(address),
    });

    console.log("Message being sent:", messageToSend);

    window.parent.postMessage(messageToSend, "*");

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error in handlePostSession:", error);

    window.parent.postMessage(
      JSON.stringify({
        type: "SOLANA_ADDRESS_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      "*"
    );
  }
};

export const handlePostEmail = (email?: string) => {
  try {
    console.log("Input Email Address:", email);
    //console.log("Input  type:", typeof String(address));

    // Ensure we always send a string
    const messageToSend = JSON.stringify({
      type: "EMAIL_ADDRESS",
      emailAddress: typeof email === "string" ? email : JSON.stringify(email),
    });

    console.log("Message being sent:", messageToSend);

    window.parent.postMessage(messageToSend, "*");

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error in handlePostSession:", error);

    window.parent.postMessage(
      JSON.stringify({
        type: "EMAIL_ADDRESS_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      "*"
    );
  }
};

export const formatAddress = (value: string) => {
  return value.substring(0, 7) + "......" + value.substring(value.length - 2);
};
