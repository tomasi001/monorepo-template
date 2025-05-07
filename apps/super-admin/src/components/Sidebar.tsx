import React from "react";
import { Link, useLocation } from "wouter";
// Import UI components from shared package
import { updateGqlClientHeaders } from "@/lib/gqlClient"; // Use alias
import { Button } from "@packages/ui";
import { toast } from "sonner";

// Import icons (install lucide-react: yarn add lucide-react)
import { CreditCard, LayoutDashboard, LogOut, Settings } from "lucide-react";

export const Sidebar: React.FC = () => {
  const [location, setLocation] = useLocation(); // For active link styling and logout redirect

  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Clear the token
    updateGqlClientHeaders(); // Update gqlClient to remove auth header
    toast.success("Logged out successfully");
    setLocation("/login"); // Redirect to login page using wouter
  };

  // Define navigation items
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/commission", label: "Commission", icon: Settings },
    { href: "/payments", label: "Payments", icon: CreditCard },
    // Add future links here (e.g., Restaurants)
  ];

  return (
    <div className="w-60 bg-gray-900 text-gray-100 h-screen flex flex-col p-4 shadow-lg">
      {/* Portal Title/Logo */}
      <div className="border-b border-gray-700 pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-center text-white">
          QR Menu Admin
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {/* Use an anchor tag inside Link for styling and accessibility */}
            <a
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                // Added transition
                location === item.href
                  ? "bg-gray-700 text-white shadow-inner" // Style for active link
                  : "text-gray-400 hover:bg-gray-800 hover:text-white" // Style for inactive link
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>

      {/* Logout Button at the bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <Button
          onClick={handleLogout}
          variant="destructive" // Use destructive variant
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};
