// ... existing code ...

export interface Menu {
  id: string;
  name: string;
  qrCode: string;
  items: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ... existing code ...
