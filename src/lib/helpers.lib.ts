import { SessionSigs } from "@lit-protocol/types";
import { AuthSig } from "@lit-protocol/types";

type SessionSignature = SessionSigs | AuthSig | string | undefined;

export const handlePostSession = (sessionSig?: SessionSignature) => {
  try {
    // Log the entire input for debugging
    console.log("Input sessionSig type:", typeof sessionSig);
    console.log("Full sessionSig:", JSON.stringify(sessionSig, null, 2));

    // Handle undefined case
    if (sessionSig === undefined) {
      throw new Error("Session signature is undefined");
    }

    // Extract the sessionSig string with multiple fallback methods
    let sessionSigString: SessionSignature;

    if (typeof sessionSig === "string") {
      sessionSigString = sessionSig;
    } else if (sessionSig && typeof sessionSig === "object") {
      // Handle different possible object structures
      sessionSigString =
        (sessionSig as SessionSigs).sessionSig ||
        (sessionSig as AuthSig).sig ||
        (sessionSig as { sig?: string }).sig ||
        JSON.stringify(sessionSig);

      if (!sessionSigString) {
        throw new Error("Unable to extract session signature from object");
      }
    } else {
      throw new Error("Unable to extract session signature");
    }

    // Validate the extracted string
    if (
      typeof sessionSigString !== "string" ||
      sessionSigString.trim() === ""
    ) {
      throw new Error("Extracted session signature is empty");
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
    console.log("Sent sessionSig:", sessionSigString.substring(0, 50) + "...");
  } catch (error) {
    // Enhanced error logging
    console.error("Full error in handlePostSession:");
    console.error(
      "Error type:",
      error instanceof Error ? error.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );

    if (error instanceof Error) {
      window.parent.postMessage(
        JSON.stringify({
          type: "AUTH_ERROR",
          error: error.message,
          originalInput: JSON.stringify(sessionSig),
        }),
        "*"
      );
    }
  }
};

export const formatAddress = (value: string) => {
  return value.substring(0, 7) + "......" + value.substring(value.length - 2);
};
