import * as React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: "10px", background: "lightblue" }}
    >
      {children}
    </button>
  );
};
