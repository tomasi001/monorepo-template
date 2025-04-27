export interface CreateMenuInput {
  name: string;
  qrCode: string; // The unique string identifier (e.g., 'main-dining-hall')
  // items will be managed separately for simplicity for now
}
