import { SessionSigs } from "@lit-protocol/types";
import { AuthSig } from "@lit-protocol/types";

type SessionSignature = SessionSigs | AuthSig | string | undefined;

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

export const formatAddress = (value: string) => {
  return value.substring(0, 7) + "......" + value.substring(value.length - 2);
};
