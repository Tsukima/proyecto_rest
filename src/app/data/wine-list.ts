export type WineItem = {
  name: string;
  price: string;
};

export type WineSection = {
  title: string;
  wines: WineItem[];
};

export type WineGroup = {
  title: string;
  sections: WineSection[];
};

export type WineListData = {
  groups: WineGroup[];
};

export const DEFAULT_WINE_LIST: WineListData = {
  groups: [
    {
      title: "Tintos Nacionales",
      sections: [
        {
          title: "Ribera del Duero",
          wines: [
            { name: "Carmelo Rodero", price: "22€" },
            { name: "La Planta Roble", price: "19€" },
            { name: "Caliel Roble", price: "18€" },
          ],
        },
        {
          title: "Rioja",
          wines: [
            { name: "Ramón Bilbao Crianza", price: "33€" },
            { name: "Ugarte", price: "18€" },
            { name: "Luis Cañas Reserva", price: "30€" },
            { name: "Paco García Crianza", price: "19€" },
            { name: "La Emperatriz Teruno", price: "30€" },
          ],
        },
      ],
    },
    {
      title: "Tintos Gallegos",
      sections: [
        {
          title: "Rías Baixas",
          wines: [
            { name: "Capitán Xurelo", price: "25€" },
            { name: "Albamar", price: "17€" },
          ],
        },
        {
          title: "Ribeira Sacra",
          wines: [
            { name: "La Lama", price: "33€" },
            { name: "Ponte da Boga", price: "19€" },
            { name: "Guímaro", price: "17€" },
          ],
        },
        {
          title: "Fuera de D.O.",
          wines: [{ name: "Fento Tinta", price: "27€" }],
        },
      ],
    },
    {
      title: "Blancos Gallegos",
      sections: [
        {
          title: "Monterrei",
          wines: [{ name: "Pájaro Loco", price: "18€" }],
        },
        {
          title: "Ribeira Sacra",
          wines: [
            { name: "Lapola", price: "45€" },
            { name: "Algueira Cortzada", price: "31€" },
          ],
        },
        {
          title: "Ribeiro",
          wines: [
            { name: "Formigo", price: "28€" },
            { name: "Finca Teira", price: "19,50€" },
            { name: "Lalume", price: "18€" },
          ],
        },
      ],
    },
    {
      title: "Blancos - Otras Zonas",
      sections: [
        {
          title: "Selección",
          wines: [
            { name: "Vinaredo (Valdeorras)", price: "17€" },
            { name: "Aphros Loureiro (Portugal)", price: "18,50€" },
            { name: "Butikin Wolf (Riesling)", price: "30€" },
            { name: "Bejen (Albariño)", price: "25€" },
            { name: "Landi Soul Terrumbo", price: "19,50€" },
          ],
        },
      ],
    },
    {
      title: "Espumosos",
      sections: [
        {
          title: "Champagne y burbujas",
          wines: [
            { name: "Moët Chandon Brut Imperial", price: "55€" },
            { name: "Lasseigne Extra Brut", price: "67€" },
            { name: "Pascal Doquet Horizon", price: "77€" },
            { name: "Golpe a Golpe Brut Nature", price: "26€" },
          ],
        },
      ],
    },
    {
      title: "Dulces por copa",
      sections: [
        {
          title: "Dulces",
          wines: [
            { name: "Torres Moscatel Oro", price: "4,20€" },
            { name: "Gomariz", price: "3,50€" },
            { name: "Otro Cantar (tinto)", price: "3,50€" },
          ],
        },
      ],
    },
  ],
};

export function normalizeWineListData(data: unknown): WineListData {
  if (!data || typeof data !== "object") return DEFAULT_WINE_LIST;
  const maybeGroups = (data as { groups?: unknown }).groups;
  if (!Array.isArray(maybeGroups)) return DEFAULT_WINE_LIST;

  const groups = maybeGroups
    .map((group): WineGroup | null => {
      if (!group || typeof group !== "object") return null;
      const rawGroup = group as { title?: unknown; sections?: unknown };
      const title = typeof rawGroup.title === "string" ? rawGroup.title : "";
      const sections = Array.isArray(rawGroup.sections)
        ? rawGroup.sections
            .map((section): WineSection | null => {
              if (!section || typeof section !== "object") return null;
              const rawSection = section as { title?: unknown; wines?: unknown };
              const sectionTitle = typeof rawSection.title === "string" ? rawSection.title : "";
              const wines = Array.isArray(rawSection.wines)
                ? rawSection.wines
                    .map((wine): WineItem | null => {
                      if (!wine || typeof wine !== "object") return null;
                      const rawWine = wine as { name?: unknown; price?: unknown };
                      return {
                        name: typeof rawWine.name === "string" ? rawWine.name : "",
                        price: typeof rawWine.price === "string" ? rawWine.price : "",
                      };
                    })
                    .filter((wine): wine is WineItem => Boolean(wine))
                : [];
              return { title: sectionTitle, wines };
            })
            .filter((section): section is WineSection => Boolean(section))
        : [];
      return { title, sections };
    })
    .filter((group): group is WineGroup => Boolean(group));

  return groups.length ? { groups } : DEFAULT_WINE_LIST;
}
