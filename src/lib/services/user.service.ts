import { apiResponse } from "../api.helpers";
import axios from "axios";

export class UserService {
  static async CreateUser(payload: {
    username: string;
    email: string;
    address: string;
    pin: string;
    bio?: string;
    profilePicture?: string;
  }) {
    try {
      const response = await fetch("https://infusewallet.xyz/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return apiResponse(true, "details", response.status);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return apiResponse(false, "failed  error", error.message);
      } else {
        throw new Error(
          "An unknown error occurred while creating the transaction"
        );
      }
    }
  }

  static async GetUserByMail(email: string) {
    try {
      const userData = await axios.get(
        `https://infusewallet.xyz/api/profile?email=${email}`
      );
      console.log("F Data", userData.data);
      return apiResponse(true, "details", userData.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return apiResponse(false, "failed  error", error.message);
      } else {
        throw new Error(
          "An unknown error occurred while creating the transaction"
        );
      }
    }
  }
}
