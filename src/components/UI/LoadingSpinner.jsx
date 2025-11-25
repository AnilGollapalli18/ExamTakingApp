import React from "react";

const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  const cls = `${sizeClasses[size] || sizeClasses.md} animate-spin ${className}`;

  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="4" strokeOpacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

export default LoadingSpinner;
