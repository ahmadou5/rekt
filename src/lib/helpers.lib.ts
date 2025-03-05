import { SessionSigs } from "@lit-protocol/types";

export const handlePostSession = (sessionSig: SessionSigs) => {
  try {
    // Send the sessionSig back to the React Native app
    window.parent.postMessage(
      JSON.stringify({
        type: "AUTH_SUCCESS",
        sessionSig: sessionSig,
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
    }
  } finally {
  }

  // Send error to React Native
};
