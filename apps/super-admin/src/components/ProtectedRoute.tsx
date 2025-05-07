import React from "react";
import { Redirect, useLocation } from "wouter"; // Use Redirect component

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// This component checks if the user is authenticated (has a token).
// If not, it redirects them to the login page.
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [location] = useLocation(); // Get current location to pass as state
  const token = localStorage.getItem("adminToken"); // Check for the auth token

  if (!token) {
    // Redirect to login, passing the original intended path
    return <Redirect to="/login" state={{ from: location }} />;
  }

  // If authenticated, render the child route component
  return <>{children}</>;
};
