export type GeneralMenuItem = {
  name: string;
  description?: string;
  price?: string;
};

export type GeneralMenuSection = {
  title: string;
  description?: string;
  items: GeneralMenuItem[];
};

export type GeneralMenuData = {
  sections: GeneralMenuSection[];
};

export const DEFAULT_GENERAL_MENU: GeneralMenuData = {
  sections: [
    {
      title: "🥗 Entrantes Fríos",
      items: [
        { name: "Ensalada estilo César", description: "Gluten, huevo, lácteos, pescado (pan, salsa césar, parmesano)", price: "11.50" },
        { name: "Ensaladilla con atún rojo", description: "Pescado, huevo, sulfitos", price: "13.50" },
        { name: "Mejillones en escabeche cítrico de cococurry", description: "Moluscos, sulfitos", price: "13.00" },
        { name: "Pulpo en carpaccio estilo feria", description: "Moluscos", price: "18.00" },
        { name: "Volandeiras ceviche", description: "Moluscos, pescado, sulfitos", price: "16.50" },
        { name: "Steak tartar de vaca", description: "Huevo, mostaza, sulfitos", price: "19.00" },
        { name: "Pizarra embutido ibérico estirpe negra", description: "Sulfitos", price: "16.50" },
        { name: "Tabla de quesos afinados", description: "Lácteos", price: "17.00" },
        { name: "1/2 tabla de quesos afinados", description: "Lácteos", price: "11.00" },
        { name: "Dados de salmón ahumado & marinado Cafetín", description: "Pescado, lácteos, sulfitos", price: "15.00" },
      ],
    },
    {
      title: "🍤 Entrantes Calientes",
      items: [
        { name: "Gambones en costra de kikos", description: "Crustáceos, frutos secos (maíz), huevo", price: "16.50" },
        { name: "Gyozas de langostino", description: "Gluten, crustáceos, soja, sésamo", price: "16.50" },
        { name: "Croquetas caseras de jamón ibérico (8 uds)", description: "Gluten, lácteos, huevo", price: "12.00" },
        { name: "Bao negro de raxo (2 uds)", description: "Gluten, soja, huevo", price: "12.00" },
        { name: "Mini burguers de vaca gallega (3 uds)", description: "Gluten, lácteos, huevo, sulfitos", price: "13.50" },
      ],
    },
    {
      title: "🍽️ Pica Platos",
      items: [
        { name: "Tataki de atún, guacamole y teriyaki", description: "Pescado, soja, sésamo", price: "19.00" },
        { name: "Costilla Duroc BBQ", description: "Sulfitos", price: "19.50" },
        { name: "Pata de pulpo asada", description: "Moluscos", price: "20.50" },
        { name: "Lomo de vaca madurada", description: "Sulfitos", price: "21.00" },
      ],
    },
    {
      title: "🍰 Postres",
      items: [
        { name: "Coulant de chocolate belga y helado", description: "Gluten, huevo, lácteos", price: "7.00" },
        { name: "Souflé de caramelo y helado", description: "Gluten, huevo, lácteos", price: "7.00" },
        { name: "Cañitas de Carballiño", description: "Gluten, huevo, lácteos", price: "6.50" },
        { name: "Tarta de quesos gallegos", description: "Lácteos, huevo, gluten (según base)", price: "6.50" },
      ],
    },
  ],
};

export function normalizeGeneralMenuData(data: unknown): GeneralMenuData {
  if (!data || typeof data !== "object") return DEFAULT_GENERAL_MENU;

  const maybeSections = (data as { sections?: unknown }).sections;
  if (!Array.isArray(maybeSections)) return DEFAULT_GENERAL_MENU;

  const sections = maybeSections
    .map((section): GeneralMenuSection | null => {
      if (!section || typeof section !== "object") return null;
      const raw = section as { title?: unknown; description?: unknown; items?: unknown };
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((item): GeneralMenuItem | null => {
              if (!item || typeof item !== "object") return null;
              const rawItem = item as { name?: unknown; description?: unknown; price?: unknown };
              return {
                name: typeof rawItem.name === "string" ? rawItem.name : "",
                description: typeof rawItem.description === "string" ? rawItem.description : "",
                price: typeof rawItem.price === "string" ? rawItem.price : "",
              };
            })
            .filter((item): item is GeneralMenuItem => Boolean(item))
        : [];

      return {
        title: typeof raw.title === "string" ? raw.title : "",
        description: typeof raw.description === "string" ? raw.description : "",
        items,
      };
    })
    .filter((section): section is GeneralMenuSection => Boolean(section));

  return sections.length ? { sections } : DEFAULT_GENERAL_MENU;
}
