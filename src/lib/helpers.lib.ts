import { SessionSigs } from "@lit-protocol/types";

export const handlePostSession = (sessionSig: SessionSigs) => {
  try {
    // Extract the sessionSig string
    const sessionSigString =
      typeof sessionSig === "string" ? sessionSig : sessionSig.sessionSig;

    // Ensure we have a string before sending
    if (!sessionSigString) {
      throw new Error("Invalid session signature");
    }

    // Send only the string representation of the sessionSig
    window.parent.postMessage(
      JSON.stringify({
        type: "AUTH_SUCCESS",
        sessionSig: sessionSigString,
      }),
      "*"
    );
    console.log("Authentication successful, sent sessionSig to React Native");
  } catch (error) {
    if (error instanceof Error) {
      window.parent.postMessage(
        JSON.stringify({
          type: "AUTH_ERROR",
          error: error.message,
        }),
        "*"
      );
      console.error("Error in handlePostSession:", error.message);
    }
  }
};

export const formatAddress = (value: string) => {
  return value.substring(0, 7) + "......" + value.substring(value.length - 2);
};
