/**
 * Predefined category names for seeding the database.
 * User can edit price and add custom categories.
 */
export const PREDEFINED_CATEGORY_NAMES = [
  'Shirt',
  'T-Shirt',
  'Pant',
  'Jeans',
  'Kurta',
  'Pyjama',
  'Blazer',
  'Suit',
  'Saree',
  'Lehenga',
  'Jacket',
  'Sweater',
  'Coat',
  'Skirt',
  'Shorts',
  'Kids Wear',
  'Bedsheet',
  'Pillow Cover',
  'Curtain',
  'Other',
] as const;

/** Default price per item when seeding (user can edit) */
export const DEFAULT_CATEGORY_PRICE = 10;
