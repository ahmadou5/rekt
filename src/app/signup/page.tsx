import SignUpView from "@/view/SignupView";
import React from "react";

const Page: React.FC = () => {
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
  return (
    <div
      style={{
        background: `radial-gradient(circle at center, black 20%, transparent 46%), 
        linear-gradient(135deg, 
          ${hexToRgba(currentStepData.primaryColor, 0.2)}, 
          ${hexToRgba(currentStepData.secondaryColor, 0.05)})`,
      }}
      className="flex items-center w-full justify-center min-h-screen"
    >
      <SignUpView />
    </div>
  );
};

export default Page;
