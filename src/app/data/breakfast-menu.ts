import { normalizeGeneralMenuData, type GeneralMenuData } from "./general-menu";

export type BreakfastMenuData = GeneralMenuData;

export const DEFAULT_BREAKFAST_MENU: BreakfastMenuData = {
  sections: [
    {
      title: "☕ Cafés e infusiones",
      items: [
        { name: "Café solo", price: "1.40" },
        { name: "Café con leche", description: "Lácteos", price: "1.60" },
        { name: "Infusión", price: "1.80" },
      ],
    },
    {
      title: "🥐 Bollería y tostadas",
      items: [
        { name: "Croissant", description: "Gluten, lácteos, huevo", price: "2.00" },
        { name: "Tostada con tomate y aceite", description: "Gluten", price: "2.50" },
        { name: "Tostada con mantequilla y mermelada", description: "Gluten, lácteos", price: "2.80" },
      ],
    },
    {
      title: "🥤 Zumos",
      items: [
        { name: "Zumo de naranja natural", price: "3.00" },
      ],
    },
  ],
};

export function normalizeBreakfastMenuData(data: unknown): BreakfastMenuData {
  return normalizeGeneralMenuData(data);
}
