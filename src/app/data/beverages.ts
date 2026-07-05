export type BeverageItem = {
  name: string;
  description?: string;
  price?: string;
  terracePrice?: string;
};

export type BeverageSection = {
  title: string;
  description?: string;
  items: BeverageItem[];
};

export type BeverageData = {
  sections: BeverageSection[];
};

export const DEFAULT_BEVERAGES: BeverageData = {
  sections: [
    {
      title: "🥤 Refrescos",
      items: [
        { name: "Aquarius", description: "Limon, naranja, melocoton rojo" },
        { name: "Coca-Cola", description: "Original, Zero, Zero Zero" },
        { name: "Fanta", description: "Limon, naranja" },
        { name: "Fuze Tea", description: "Limon, maracuya" },
        { name: "Bitter Kas" },
        { name: "Tonica Schweppes" },
        { name: "Trina", description: "Limon, naranjus, manzana" },
        { name: "Seven Up" },
        { name: "Gaseosa Casera" },
        { name: "Gaseosa Limon Casera" },
        { name: "Cacaolat" },
      ],
    },
    {
      title: "🍺 Cervezas",
      items: [
        { name: "Estrella Galicia 0,0 Tostada" },
        { name: "Estrella Galicia 0,0 Rubia" },
        { name: "Estrella Galicia Sin Gluten" },
        { name: "Estrella Galicia Especial" },
        { name: "1906 Reserva" },
        { name: "1906 Red Vintage" },
        { name: "1906 Black" },
        { name: "Super Bock Negra" },
      ],
    },
    {
      title: "🍹 Otras Bebidas",
      items: [
        { name: "Tinto de Verano Casera" },
        { name: "Sidra Maeloc" },
        { name: "Agua Cabreiroa 500ml", description: "Plastico" },
        { name: "Agua Sin Gas Cabreiroa", description: "Cristal" },
        { name: "Agua Con Gas Cabreiroa", description: "Cristal" },
        { name: "Agua Con Gas Natural Magma Cabreiroa", description: "Cristal" },
      ],
    },
    {
      title: "🧃 Zumos",
      items: [
        { name: "Zumo Cristal", description: "Melocoton, naranja, pina, mosto" },
        { name: "Zumo Natural de Naranja" },
      ],
    },
    {
      title: "🍷 Vinos Blancos",
      description: "Disponible carta de vinos completa",
      items: [
        { name: "Albarino - Condes de Albarei" },
        { name: "Godello - Vinaredo" },
        { name: "Ribeiro - Lagar de Brais" },
      ],
    },
    {
      title: "🍷 Vinos Tintos",
      description: "Disponible carta de vinos completa",
      items: [
        { name: "Ribera del Duero - Caliel" },
        { name: "Ribera del Duero - Cair" },
        { name: "Mencia - Quinta de Tapias" },
        { name: "Mencia - Ponte da Boga" },
        { name: "Rioja - Azabache" },
        { name: "Rioja - Ramon Bilbao" },
      ],
    },
    {
      title: "🥃 Whiskies",
      items: [
        { name: "Chivas Regal", description: "12, 18 años" },
        { name: "Jack Daniel's" },
        { name: "Franciscan 12" },
        { name: "Ballantine's", description: "8, 10 y 12 años" },
        { name: "DYC" },
        { name: "Johnnie Walker Red Label" },
        { name: "Johnnie Walker Black Label" },
        { name: "Johnnie Walker White Label" },
        { name: "Lepanto" },
        { name: "Cardhu" },
        { name: "J&B" },
        { name: "Cutty Sark" },
        { name: "Dewar's White Label" },
        { name: "Jameson" },
      ],
    },
    {
      title: "🍸 Ginebras",
      items: [
        { name: "Beefeater", description: "Light, Black" },
        { name: "Larios", description: "Rosé, 12" },
        { name: "Bombay Sapphire" },
        { name: "Hendrick's" },
        { name: "Nordés" },
        { name: "Martin Millers" },
        { name: "Mombasa" },
        { name: "Tanqueray" },
        { name: "Seagram's", description: "0,0" },
        { name: "Puerto de Indias", description: "Fresa" },
      ],
    },
    {
      title: "🍹 Rones",
      items: [
        { name: "Havana Club 3" },
        { name: "Havana Club 7" },
        { name: "Habana Club 8 Años" },
        { name: "Habana Club 12 Años" },
        { name: "Habana Club 18 Años" },
        { name: "Brugal" },
        { name: "Barceló" },
        { name: "Cacique" },
        { name: "Cacique 12 Años" },
        { name: "Pampero" },
        { name: "Dos Maderas 5+2" },
        { name: "Dos Maderas" },
      ],
    },
    {
      title: "🍷 Vermuts & Aperitivos",
      items: [
        { name: "Martini Bianco" },
        { name: "Martini Rosso" },
        { name: "Martini Mezcla" },
        { name: "Aperol" },
        { name: "Atxa Blanco" },
        { name: "Entroido Blanco" },
        { name: "Petroni Rojo" },
        { name: "Petroni Blanco" },
        { name: "Petroni Mezcla" },
      ],
    },
    {
      title: "🥂 Licores & Cremas",
      items: [
        { name: "Baileys" },
        { name: "Disaronno" },
        { name: "Kahlúa" },
        { name: "Frangelico" },
        { name: "Amaretto" },
        { name: "Licor Café" },
        { name: "Licor de Hierbas" },
        { name: "Crema de Orujo" },
        { name: "Aguardiente Blanco" },
        { name: "Oporto" },
        { name: "Tío Pepe", description: "De Jerez" },
      ],
    },
    {
      title: "🍾 Vodkas",
      items: [
        { name: "Absolut" },
        { name: "Eristoff" },
      ],
    },
    {
      title: "🥃 Tequilas",
      items: [
        { name: "José Cuervo", description: "Tostada, blanca" },
      ],
    },
    {
      title: "🍶 Otros",
      items: [
        { name: "Cointreau" },
        { name: "Zoco Pacharán" },
        { name: "Jägermeister" },
      ],
    },
  ],
};

export function normalizeBeverageData(data: unknown): BeverageData {
  if (!data || typeof data !== "object") return DEFAULT_BEVERAGES;

  const maybeSections = (data as { sections?: unknown }).sections;
  if (!Array.isArray(maybeSections)) return DEFAULT_BEVERAGES;

  const sections = maybeSections
    .map((section): BeverageSection | null => {
      if (!section || typeof section !== "object") return null;
      const raw = section as { title?: unknown; description?: unknown; items?: unknown };
      const title = typeof raw.title === "string" ? raw.title : "";
      const description = typeof raw.description === "string" ? raw.description : "";
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((item): BeverageItem | null => {
              if (!item || typeof item !== "object") return null;
              const rawItem = item as { name?: unknown; description?: unknown; price?: unknown };
              return {
                name: typeof rawItem.name === "string" ? rawItem.name : "",
                description: typeof rawItem.description === "string" ? rawItem.description : "",
                price: typeof rawItem.price === "string" ? rawItem.price : "",
                terracePrice: typeof (rawItem as { terracePrice?: unknown }).terracePrice === "string"
                  ? (rawItem as { terracePrice?: string }).terracePrice
                  : "",
              };
            })
            .filter((item): item is BeverageItem => Boolean(item))
        : [];
      return { title, description, items };
    })
    .filter((section): section is BeverageSection => Boolean(section));

  return sections.length ? { sections } : DEFAULT_BEVERAGES;
}

export function beverageTitleWithEmoji(title: string): string {
  if (/^\p{Extended_Pictographic}/u.test(title.trim())) return title;

  const normalized = title.toLowerCase();
  if (normalized.includes("refresco")) return `🥤 ${title}`;
  if (normalized.includes("cerveza")) return `🍺 ${title}`;
  if (normalized.includes("zumo")) return `🧃 ${title}`;
  if (normalized.includes("vino")) return `🍷 ${title}`;
  if (normalized.includes("ron")) return `🥃 ${title}`;
  if (normalized.includes("whiskey") || normalized.includes("whisky")) return `🥃 ${title}`;
  if (normalized.includes("ginebra")) return `🍸 ${title}`;
  if (normalized.includes("vermouth") || normalized.includes("vermut")) return `🍸 ${title}`;
  if (normalized.includes("licor") || normalized.includes("crema")) return `🥂 ${title}`;
  if (normalized.includes("vodka")) return `🍾 ${title}`;
  if (normalized.includes("tequila")) return `🥃 ${title}`;
  if (normalized.includes("bebida")) return `🍹 ${title}`;
  return title;
}
