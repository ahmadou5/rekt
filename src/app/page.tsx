"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";

const Page: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pathname === "/") {
        router.push("/login");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  return <SplashScreen />;
};

export default Page;
