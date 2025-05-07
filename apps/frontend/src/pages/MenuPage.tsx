import { MenuDisplay } from "@/components/MenuDisplay"; // Use alias
import React from "react";

interface MenuPageProps {
  menuId: string;
}

const MenuPage: React.FC<MenuPageProps> = ({ menuId }) => {
  if (!menuId) {
    return <div>Error: Menu ID is missing.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Menu</h1>
      {/* Render the MenuDisplay component */}
      <MenuDisplay menuId={menuId} />
    </div>
  );
};

export default MenuPage;
