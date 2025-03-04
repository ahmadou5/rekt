"use client";

import { Dispatch, SetStateAction } from "react";

import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export default function Toaster({
  setIsToastOpen,
  isToastOpen,
  isSuccess,
  content,
}: {
  setIsToastOpen: Dispatch<SetStateAction<boolean>>;
  isToastOpen: boolean;
  content: string;
  isSuccess: boolean;
}) {
  return (
    <ToastProvider>
      <Toast isSuccess isOpen={isToastOpen} setIsOpen={setIsToastOpen}>
        <ToastTitle>{isSuccess ? "Success" : "Error"}</ToastTitle>
        <ToastDescription>{content}</ToastDescription>
      </Toast>

      <ToastViewport />
    </ToastProvider>
  );
}
