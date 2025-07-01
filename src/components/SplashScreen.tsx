"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const currentStepData = {
    primaryColor: "#3c82d5",
    secondaryColor: "#3c82d5",
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        background: `radial-gradient(circle at center, black 20%, transparent 46%), 
        linear-gradient(135deg, 
          ${hexToRgba(currentStepData.primaryColor, 0.2)}, 
          ${hexToRgba(currentStepData.secondaryColor, 0.05)})`,
      }}
      className={cn(
        "fixed inset-0 z-[999] flex items-center justify-center bg-background transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative"></div>
    </div>
  );
}
