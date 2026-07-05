import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role for admin operations
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
};

// Create Supabase client for user operations
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-8a892de6/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── DEFAULT MENU DATA ───────────────────────────────────────────────────────

const DEFAULT_WEEKDAY_MENU = {
  menus: [
    {
      title: "Menú del Día", price: "18,00 €", includes: "Bebida, postre o café", isVeggie: false,
      sections: [
        { title: "Aperitivo", items: [{ name: "Petisco de bienvenida", allergens: [] }] },
        { title: "Primeros (a elegir)", items: [
          { name: "Menestra de brécol & coliflor sobre hummus de garbanzo, ajadas y lascas de jamón serrano reserva", allergens: ["Gluten", "Sulfitos"] },
          { name: "Enchilada de pulled pork con salsa de cheddar, pico de gallo y cebolla morada encurtida", allergens: ["Gluten", "Lácteos"] },
        ]},
        { title: "Segundos (a elegir)", items: [
          { name: "Salmón sosa-sado sobre risotto marinero de algas, su crujiente y alioli de percebe", allergens: ["Pescado", "Huevos", "Moluscos", "Lácteos"] },
          { name: "Secreto de Alín a la plancha con salsa de miel & mostaza, cachelos fritos y timbal de pimientos del piquillo", allergens: ["Mostaza", "Sulfitos"] },
        ]},
        { title: "Postre (a elegir)", items: [
          { name: "Flan de huevo", allergens: ["Huevos", "Lácteos"] },
          { name: "Semifrío de limón", allergens: ["Huevos", "Lácteos", "Gluten"] },
        ]},
      ],
    },
    {
      title: "Menú Veggie", price: "18,00 €", includes: "Bebida, postre o café", isVeggie: true,
      sections: [
        { title: "Aperitivo", items: [{ name: "Petisco de bienvenida", allergens: [] }] },
        { title: "Primero", items: [{ name: "Menestra de brécol & coliflor sobre hummus y ajadas", allergens: ["Sésamo"] }] },
        { title: "Segundo", items: [{ name: "Mafalda en salsa caponata, parmesano y aceite de aromáticas", allergens: ["Gluten", "Lácteos"] }] },
        { title: "Postre", items: [{ name: "Semifrío de limón", allergens: ["Huevos", "Lácteos", "Gluten"] }] },
      ],
    },
  ],
};

const DEFAULT_WEEKEND_MENU = {
  menus: [
    {
      title: "Menú de Fin de Semana", price: "28,00 €", includes: "Bebida, postre o café", isVeggie: false,
      sections: [
        { title: "Aperitivo", items: [{ name: "Petisco de bienvenida", allergens: [] }] },
        { title: "Primeros (a elegir)", items: [
          { name: "Tiradito de salmón marinado, aguachile de melón, cremoso de aguacate, pico de gallo y cebolla morada encurtida", allergens: ["Pescado"] },
          { name: "Arroz meloso de carrillera, menestra de setas al ajillo, emulsión de yema y lascas de parmesano", allergens: ["Huevos", "Lácteos"] },
        ]},
        { title: "Segundos (a elegir)", items: [
          { name: "Lubina salvaje asada al horno, texturas de brasicáceas, guisantes y cremoso de la huerta", allergens: ["Pescado"] },
          { name: "Tataki de buey a la plancha, cremoso de chirivía, brevas caramelizadas y vinagreta de queso semicurado & miel", allergens: ["Lácteos"] },
        ]},
        { title: "Postre (a elegir)", items: [
          { name: "Flan casero", allergens: ["Huevos", "Lácteos"] },
          { name: "Vasito de limón", allergens: ["Huevos", "Lácteos"] },
        ]},
      ],
    },
    {
      title: "Menú Veggie de Fin de Semana", price: "20,00 €", includes: "Bebida, postre o café", isVeggie: true,
      sections: [
        { title: "Aperitivo", items: [{ name: "Petisco de bienvenida", allergens: [] }] },
        { title: "Primero", items: [
          { name: "Ensalada con cremoso de aguacate, pico de gallo y totopos", allergens: [] },
          { name: "Mafalda corta en salsa caponata y lascas de parmesano", allergens: ["Gluten", "Lácteos"] },
        ]},
        { title: "Segundo", items: [{ name: "Plato principal vegetariano del día", allergens: [] }] },
        { title: "Postre", items: [{ name: "Vasito de limón", allergens: ["Huevos", "Lácteos"] }] },
      ],
    },
  ],
  degustation: {
    title: "Menú Degustación de Temporada", price: "35,00 €",
    includes: "Con café 100% arábica natural · Bodega aparte",
    note: "Incremento +1,00 € en terraza · Consultar carta de vinos",
    sections: [
      { title: "De Temporada", items: [
        { name: "Caballa marinada sobre arroz glutinoso, contrapunto asiático, algas y su crujiente", allergens: ["Pescado", "Soja"] },
        { name: "Berberechos en salsa verde, ajadas, guisantes & edamame", allergens: ["Moluscos", "Soja"] },
      ]},
      { title: "Del Mar", items: [{ name: "Atún rojo sosa-sado, cremoso de coliflor, fresas en texturas y trigueros", allergens: ["Pescado"] }] },
      { title: "De la Tierra", items: [{ name: "Tataki de buey, salsa PX, brevas, angulas del monte y cremoso de chirivía", allergens: [] }] },
      { title: "Está de Dulce", items: [{ name: "Ensalada capresse", allergens: ["Lácteos"] }] },
    ],
  },
};

const DEFAULT_GASTROTECA_MENU = {
  menus: [
    {
      title: "Menú Especial Gastroteca", price: "35,00 €", includes: "Disponible de jueves a sábado · Platos disponibles por separado", isVeggie: false,
      sections: [
        { title: "Platos", items: [
          { name: "Plato 1 de temporada", allergens: [], price: "" },
          { name: "Plato 2 de temporada", allergens: [], price: "" },
          { name: "Plato 3 de temporada", allergens: [], price: "" },
          { name: "Plato 4 de temporada", allergens: [], price: "" },
        ]},
        { title: "Postre", items: [
          { name: "Postre especial de la casa", allergens: [], price: "" },
        ]},
      ],
    },
  ],
};

const DEFAULT_BEVERAGES = {
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

const DEFAULT_GENERAL_MENU = {
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

const DEFAULT_WINE_LIST = {
  groups: [
    {
      title: "Tintos Nacionales",
      sections: [
        { title: "Ribera del Duero", wines: [
          { name: "Carmelo Rodero", price: "22€" },
          { name: "La Planta Roble", price: "19€" },
          { name: "Caliel Roble", price: "18€" },
        ] },
        { title: "Rioja", wines: [
          { name: "Ramón Bilbao Crianza", price: "33€" },
          { name: "Ugarte", price: "18€" },
          { name: "Luis Cañas Reserva", price: "30€" },
          { name: "Paco García Crianza", price: "19€" },
          { name: "La Emperatriz Teruno", price: "30€" },
        ] },
      ],
    },
    {
      title: "Tintos Gallegos",
      sections: [
        { title: "Rías Baixas", wines: [
          { name: "Capitán Xurelo", price: "25€" },
          { name: "Albamar", price: "17€" },
        ] },
        { title: "Ribeira Sacra", wines: [
          { name: "La Lama", price: "33€" },
          { name: "Ponte da Boga", price: "19€" },
          { name: "Guímaro", price: "17€" },
        ] },
        { title: "Fuera de D.O.", wines: [{ name: "Fento Tinta", price: "27€" }] },
      ],
    },
    {
      title: "Blancos Gallegos",
      sections: [
        { title: "Monterrei", wines: [{ name: "Pájaro Loco", price: "18€" }] },
        { title: "Ribeira Sacra", wines: [
          { name: "Lapola", price: "45€" },
          { name: "Algueira Cortzada", price: "31€" },
        ] },
        { title: "Ribeiro", wines: [
          { name: "Formigo", price: "28€" },
          { name: "Finca Teira", price: "19,50€" },
          { name: "Lalume", price: "18€" },
        ] },
      ],
    },
    {
      title: "Blancos - Otras Zonas",
      sections: [
        { title: "Selección", wines: [
          { name: "Vinaredo (Valdeorras)", price: "17€" },
          { name: "Aphros Loureiro (Portugal)", price: "18,50€" },
          { name: "Butikin Wolf (Riesling)", price: "30€" },
          { name: "Bejen (Albariño)", price: "25€" },
          { name: "Landi Soul Terrumbo", price: "19,50€" },
        ] },
      ],
    },
    {
      title: "Espumosos",
      sections: [
        { title: "Champagne y burbujas", wines: [
          { name: "Moët Chandon Brut Imperial", price: "55€" },
          { name: "Lasseigne Extra Brut", price: "67€" },
          { name: "Pascal Doquet Horizon", price: "77€" },
          { name: "Golpe a Golpe Brut Nature", price: "26€" },
        ] },
      ],
    },
    {
      title: "Dulces por copa",
      sections: [
        { title: "Dulces", wines: [
          { name: "Torres Moscatel Oro", price: "4,20€" },
          { name: "Gomariz", price: "3,50€" },
          { name: "Otro Cantar (tinto)", price: "3,50€" },
        ] },
      ],
    },
  ],
};

// ─── PUBLIC MENU ENDPOINTS ───────────────────────────────────────────────────

app.get("/make-server-8a892de6/menus/weekday", async (c) => {
  try {
    const data = await kv.get("menu:weekday") || DEFAULT_WEEKDAY_MENU;
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener menú del día: ${error}`);
    return c.json(DEFAULT_WEEKDAY_MENU);
  }
});

app.get("/make-server-8a892de6/menus/weekend", async (c) => {
  try {
    const data = await kv.get("menu:weekend") || DEFAULT_WEEKEND_MENU;
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener menú de fin de semana: ${error}`);
    return c.json(DEFAULT_WEEKEND_MENU);
  }
});

app.get("/make-server-8a892de6/menus/gastroteca", async (c) => {
  try {
    const data = await kv.get("menu:gastroteca") || DEFAULT_GASTROTECA_MENU;
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener menú de Gastroteca: ${error}`);
    return c.json(DEFAULT_GASTROTECA_MENU);
  }
});

app.get("/make-server-8a892de6/beverages", async (c) => {
  try {
    const stored = await kv.get("beverages");
    const hasUpdatedLiquors = stored?.sections?.some((section: any) =>
      String(section?.title || "").toLowerCase().includes("whiskies")
    );
    const hasMergedLiquors = stored?.sections?.some((section: any) =>
      Array.isArray(section?.items) &&
      section.items.some((item: any) => String(item?.name || "").toLowerCase().includes("dos maderas"))
    );
    const data = stored && hasUpdatedLiquors && hasMergedLiquors ? stored : DEFAULT_BEVERAGES;
    if (stored && (!hasUpdatedLiquors || !hasMergedLiquors)) {
      await kv.set("beverages", DEFAULT_BEVERAGES);
    }
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener bebidas: ${error}`);
    return c.json(DEFAULT_BEVERAGES);
  }
});

app.get("/make-server-8a892de6/wine-list", async (c) => {
  try {
    const data = await kv.get("wine-list") || DEFAULT_WINE_LIST;
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener carta de vinos: ${error}`);
    return c.json(DEFAULT_WINE_LIST);
  }
});

app.get("/make-server-8a892de6/general-menu", async (c) => {
  try {
    const data = await kv.get("general-menu") || DEFAULT_GENERAL_MENU;
    return c.json(data);
  } catch (error) {
    console.log(`Error al obtener carta general: ${error}`);
    return c.json(DEFAULT_GENERAL_MENU);
  }
});

// ─── ADMIN MENU ENDPOINTS ────────────────────────────────────────────────────

app.put("/make-server-8a892de6/admin/menus/weekday", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("menu:weekday", body);
    console.log("Menú del día actualizado");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar menú del día: ${error}`);
    return c.json({ error: "Error al guardar el menú" }, 500);
  }
});

app.put("/make-server-8a892de6/admin/menus/weekend", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("menu:weekend", body);
    console.log("Menú de fin de semana actualizado");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar menú de fin de semana: ${error}`);
    return c.json({ error: "Error al guardar el menú" }, 500);
  }
});

app.put("/make-server-8a892de6/admin/menus/gastroteca", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("menu:gastroteca", body);
    console.log("Menú de Gastroteca actualizado");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar menú de Gastroteca: ${error}`);
    return c.json({ error: "Error al guardar el menú de Gastroteca" }, 500);
  }
});

app.put("/make-server-8a892de6/admin/beverages", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("beverages", body);
    console.log("Carta de bebidas actualizada");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar bebidas: ${error}`);
    return c.json({ error: "Error al guardar bebidas" }, 500);
  }
});

app.put("/make-server-8a892de6/admin/wine-list", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("wine-list", body);
    console.log("Carta de vinos actualizada");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar carta de vinos: ${error}`);
    return c.json({ error: "Error al guardar carta de vinos" }, 500);
  }
});

app.put("/make-server-8a892de6/admin/general-menu", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const body = await c.req.json();
    await kv.set("general-menu", body);
    console.log("Carta general actualizada");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al guardar carta general: ${error}`);
    return c.json({ error: "Error al guardar carta general" }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-8a892de6/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password y nombre son obligatorios" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Create user with admin client
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      console.log(`Error al crear usuario durante el registro: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name
      }
    });
  } catch (error) {
    console.log(`Error en signup endpoint: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-8a892de6/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email y password son obligatorios" }, 400);
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Error de autenticación durante el inicio de sesión: ${error.message}`);
      return c.json({ error: "Credenciales inválidas" }, 401);
    }

    return c.json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log(`Error en signin endpoint: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// Get user profile endpoint
app.get("/make-server-8a892de6/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Error al obtener perfil de usuario: ${error?.message}`);
      return c.json({ error: "No autorizado" }, 401);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log(`Error en profile endpoint: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

type ZoneTable = { id: string; seats: number };

// Real table inventory by zone. Tables can be joined, so availability is based
// on finding a free combination that covers the requested pax.
const ZONE_TABLES: Record<string, ZoneTable[]> = {
  terraza: [
    ...Array.from({ length: 6 }, (_, index) => ({ id: `T2-${index + 1}`, seats: 2 })),
    ...Array.from({ length: 2 }, (_, index) => ({ id: `T3-${index + 1}`, seats: 3 })),
    ...Array.from({ length: 6 }, (_, index) => ({ id: `T4-${index + 1}`, seats: 4 })),
    ...Array.from({ length: 3 }, (_, index) => ({ id: `T6-${index + 1}`, seats: 6 })),
  ],
  interior: [
    ...Array.from({ length: 8 }, (_, index) => ({ id: `I4-${index + 1}`, seats: 4 })),
    ...Array.from({ length: 4 }, (_, index) => ({ id: `I2-${index + 1}`, seats: 2 })),
  ],
  cafeteria: Array.from({ length: 14 }, (_, index) => ({ id: `C2-${index + 1}`, seats: 2 })),
};

const ZONE_CAPACITIES: Record<string, number> = Object.fromEntries(
  Object.entries(ZONE_TABLES).map(([zone, tables]) => [
    zone,
    tables.reduce((total, table) => total + table.seats, 0),
  ]),
);

type ReservationHistoryAction = "confirmed" | "restored" | "deleted";

async function addReservationHistory(action: ReservationHistoryAction, reservation: any, details?: Record<string, any>) {
  const key = "admin_reservation_history";
  const existing = await kv.get(key) || [];
  const item = {
    id: `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    created_at: new Date().toISOString(),
    reservation_id: reservation?.id || null,
    reservation_date: reservation?.date || null,
    reservation_time: reservation?.time || null,
    guest_name: reservation?.name || "Cliente",
    phone: reservation?.phone || "",
    guests: reservation?.guests || "",
    zone: reservation?.zone || "",
    status: reservation?.status || "",
    user_code: reservation?.user_code || null,
    details: details || {},
  };
  await kv.set(key, [item, ...existing].slice(0, 300));
}

function timeToMinutes(time: string) {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function getReservationTurn(time: string) {
  const minutes = timeToMinutes(time);
  if (minutes === null) return "unknown";
  if (minutes >= 13 * 60 && minutes <= 15 * 60 + 15) return "lunch";
  if (minutes >= 20 * 60 && minutes <= 22 * 60 + 45) return "dinner";
  return "other";
}

function reservationTimeIsAllowedForDate(date: string, time: string): boolean {
  const minutes = timeToMinutes(time);
  if (minutes === null) return false;

  const lunchStart = 13 * 60;
  const lunchEnd = 15 * 60 + 15;
  if (minutes >= lunchStart && minutes <= lunchEnd) return true;

  const dinnerStart = 20 * 60;
  if (minutes < dinnerStart) return false;

  const weekday = new Date(`${date}T12:00:00`).getDay();
  const dinnerEnd = weekday >= 1 && weekday <= 3 ? 21 * 60 + 30 : 22 * 60 + 45;
  return minutes <= dinnerEnd;
}

function reservationTimeErrorForDate(date: string, time: string): string {
  const turn = getReservationTurn(time);
  if (turn === "dinner") {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return weekday >= 1 && weekday <= 3
      ? "Las cenas de lunes a miércoles se pueden reservar de 20:00 a 21:30."
      : "Las cenas de jueves a sábado se pueden reservar de 20:00 a 22:45.";
  }
  return "Las reservas para comida son de 13:00 a 15:15 y las cenas empiezan a las 20:00.";
}

function isClosedReservationDate(date: string) {
  if (!date) return false;
  return new Date(`${date}T12:00:00`).getDay() === 0;
}

function isPastReservationDateTime(date: string, time: string) {
  if (!date || !time) return false;
  const reservationDate = new Date(`${date}T${time}:00`);
  return reservationDate.getTime() <= Date.now();
}

function normalizeReservationPhone(phone: any) {
  return String(phone || "").replace(/\D/g, "");
}

function reservationPhonesMatch(left: any, right: any) {
  const a = normalizeReservationPhone(left);
  const b = normalizeReservationPhone(right);
  if (a.length < 6 || b.length < 6) return false;
  const aTail = a.slice(-9);
  const bTail = b.slice(-9);
  return a === b || a.endsWith(b) || b.endsWith(a) || aTail === bTail;
}

// Helper to count reservations per zone for a full service turn.
async function countZoneReservations(date: string, time: string): Promise<Record<string, number>> {
  const allReservationIds = await kv.get('all_reservations') || [];
  const requestedTurn = getReservationTurn(time);

  const counts: Record<string, number> = { terraza: 0, interior: 0, cafeteria: 0 };

  for (const reservationId of allReservationIds) {
    const reservation = await kv.get(`reservation:${reservationId}`);
    if (!reservation || reservation.date !== date) continue;
    if (reservation.status === "cancelled") continue;

    const sameTurn = getReservationTurn(reservation.time) === requestedTurn;

    if (sameTurn && reservation.zone && counts[reservation.zone] !== undefined) {
      counts[reservation.zone] += Number(reservation.guests) || 0;
    }
  }

  return counts;
}

function findBestTableCombination(tables: ZoneTable[], guests: number) {
  const sortedTables = [...tables].sort((a, b) => b.seats - a.seats);
  let best: ZoneTable[] | null = null;
  const maxMask = 1 << sortedTables.length;

  for (let mask = 1; mask < maxMask; mask++) {
    const combo: ZoneTable[] = [];
    let seats = 0;

    for (let index = 0; index < sortedTables.length; index++) {
      if (mask & (1 << index)) {
        combo.push(sortedTables[index]);
        seats += sortedTables[index].seats;
      }
    }

    if (seats < guests) continue;
    if (!best) {
      best = combo;
      continue;
    }

    const bestSeats = best.reduce((total, table) => total + table.seats, 0);
    if (
      seats < bestSeats ||
      (seats === bestSeats && combo.length < best.length)
    ) {
      best = combo;
    }
  }

  return best;
}

async function getTableAvailability(date: string, time: string, zone: string, guests = 1, excludeReservationId?: string) {
  const inventory = ZONE_TABLES[zone] || [];
  const requestedTurn = getReservationTurn(time);
  const allReservationIds = await kv.get("all_reservations") || [];
  const occupied = new Set<string>();

  for (const reservationId of allReservationIds) {
    if (excludeReservationId && reservationId === excludeReservationId) continue;

    const reservation = await kv.get(`reservation:${reservationId}`);
    if (!reservation || reservation.date !== date) continue;
    if (reservation.status === "cancelled") continue;
    if (reservation.zone !== zone) continue;
    if (getReservationTurn(reservation.time) !== requestedTurn) continue;

    const storedTables = Array.isArray(reservation.table_ids)
      ? reservation.table_ids
      : reservation.table
        ? [String(reservation.table)]
        : [];

    if (storedTables.length > 0) {
      storedTables.forEach((tableId: string) => occupied.add(String(tableId)));
      continue;
    }

    const availableForOldReservation = inventory.filter((table) => !occupied.has(table.id));
    const fallbackCombo = findBestTableCombination(availableForOldReservation, Number(reservation.guests) || 1);
    fallbackCombo?.forEach((table) => occupied.add(table.id));
  }

  const freeTables = inventory.filter((table) => !occupied.has(table.id));
  const assignedTables = findBestTableCombination(freeTables, guests);
  const availableSeats = freeTables.reduce((total, table) => total + table.seats, 0);

  return {
    totalSeats: inventory.reduce((total, table) => total + table.seats, 0),
    availableSeats,
    reservedSeats: inventory.reduce((total, table) => total + table.seats, 0) - availableSeats,
    freeTables,
    assignedTables: assignedTables || [],
    canFit: Boolean(assignedTables),
  };
}

async function saveReservationRecord(reservation: any, source = "client") {
  const { date, time, zone } = reservation;
  const requestedGuests = Number(reservation.guests) || 0;

  if (isClosedReservationDate(date)) {
    throw new Error("Los domingos estamos cerrados. Por favor selecciona otro día.");
  }

  if (isPastReservationDateTime(date, time)) {
    throw new Error("Esa hora ya pasó. Por favor selecciona una hora posterior a la hora actual.");
  }

  if (!reservationTimeIsAllowedForDate(date, time)) {
    throw new Error(reservationTimeErrorForDate(date, time));
  }

  if (zone && ZONE_TABLES[zone]) {
    const availability = await getTableAvailability(date, time, zone, requestedGuests, reservation.id);
    if (!availability.canFit) {
      throw new Error(`La zona seleccionada está al completo para ese turno`);
    }
    reservation.table_ids = availability.assignedTables.map((table) => table.id);
    reservation.assigned_tables = availability.assignedTables;
    reservation.assigned_capacity = availability.assignedTables.reduce((total, table) => total + table.seats, 0);
  }

  const allReservationsKey = "all_reservations";
  const allReservationIds = await kv.get(allReservationsKey) || [];

  await kv.set(`reservation:${reservation.id}`, reservation);

  if (!allReservationIds.includes(reservation.id)) {
    await kv.set(allReservationsKey, [...allReservationIds, reservation.id]);
  }

  if (reservation.user_id) {
    const userKey = `user_reservations:${reservation.user_id}`;
    const existingReservations = await kv.get(userKey) || [];
    if (!existingReservations.includes(reservation.id)) {
      await kv.set(userKey, [...existingReservations, reservation.id]);
    }
  }

  if (reservation.status === "confirmed") {
    await addReservationHistory("confirmed", reservation, { source });
  }

  return reservation;
}

function dialogflowText(text: string, outputContexts: any[] = []) {
  return {
    fulfillmentMessages: [
      {
        text: {
          text: [text],
        },
      },
      {
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options: [{ text: "Limpiar chat" }],
              },
            ],
          ],
        },
      },
    ],
    outputContexts,
  };
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours || 0, minutes || 0));
  date.setUTCMinutes(date.getUTCMinutes() + minutesToAdd);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatGoogleCalendarDate(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function buildReservationCalendarLink(reservation: any, zoneLabel: string) {
  const endTime = addMinutesToTime(reservation.time, 90);
  const start = formatGoogleCalendarDate(reservation.date, reservation.time);
  const end = formatGoogleCalendarDate(reservation.date, endTime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Reserva en El Cafetín",
    dates: `${start}/${end}`,
    details: `Reserva para ${reservation.guests} persona(s). Zona: ${zoneLabel}. Nombre: ${reservation.name}.`,
    location: "El Cafetín, Pontevedra",
    ctz: "Europe/Madrid",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function dialogflowReservationDone(text: string, calendarLink?: string) {
  const richContentItems: any[] = [];
  if (calendarLink) {
    richContentItems.push({
      type: "button",
      icon: {
        type: "event",
        color: "#1f6b32",
      },
      text: "Agregar a Google Calendar",
      link: calendarLink,
    });
  }
  richContentItems.push({
    type: "chips",
    options: [
      { text: "Reservar de nuevo" },
      { text: "Limpiar chat" },
    ],
  });

  return {
    fulfillmentMessages: [
      {
        text: {
          text: [`${text} ¿Quiere hacer otra reserva o limpiar el chat?`],
        },
      },
      {
        payload: {
          richContent: [
            richContentItems,
          ],
        },
      },
    ],
    outputContexts: [],
  };
}

function dialogflowWhatsapp(text: string) {
  return {
    fulfillmentMessages: [
      {
        text: {
          text: [text],
        },
      },
      {
        payload: {
          richContent: [
            [
              {
                type: "button",
                icon: {
                  type: "chevron_right",
                  color: "#1f6b32",
                },
                text: "Contactar con el Encargado",
                link: "https://wa.me/34618044843",
              },
              {
                type: "chips",
                options: [{ text: "Limpiar chat" }],
              },
            ],
          ],
        },
      },
    ],
    outputContexts: [],
  };
}

const LUNCH_TIME_OPTIONS = [
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15",
];

function dialogflowTimeChips(text: string, outputContexts: any[] = []) {
  return {
    fulfillmentMessages: [
      {
        text: {
          text: [text],
        },
      },
      {
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options: [...LUNCH_TIME_OPTIONS.map((time) => ({ text: time })), { text: "Limpiar chat" }],
              },
            ],
          ],
        },
      },
    ],
    outputContexts,
  };
}

function collectDialogflowParameters(body: any): Record<string, any> {
  const parameters: Record<string, any> = {};
  const contexts = body?.queryResult?.outputContexts || [];
  for (const context of contexts) {
    Object.assign(parameters, context?.parameters || {});
  }
  Object.assign(parameters, body?.queryResult?.parameters || {});
  return parameters;
}

function firstDialogflowValue(value: any): any {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeDialogflowDate(value: any): string {
  const raw = String(firstDialogflowValue(value) || "").trim();
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] || "";
}

function normalizeDialogflowTime(value: any): string {
  const raw = String(firstDialogflowValue(value) || "").trim();
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  if (Number.isNaN(hours) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseHumanTime(text: string, allowBareHour = false): string {
  const raw = normalizeHumanText(text)
    .replace(/[.!]/g, ":")
    .replace(/\s+/g, " ");
  if (!raw) return "";

  const hasTimeMarker = /[:h]|\b(a\s+las|sobre\s+las|las|hora)\b/.test(raw);
  if (!hasTimeMarker && !allowBareHour) return "";

  const explicit = raw.match(/\b(?:a\s+las|sobre\s+las|las|hora|h)?\s*(\d{1,2})(?:\s*[:h]\s*(\d{1,2}))?\b/);
  if (!explicit) return "";

  const hours = Number(explicit[1]);
  const minutes = explicit[2] !== undefined ? Number(explicit[2]) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function extractLunchTimeSelection(...values: any[]): string {
  const allowed = new Set(LUNCH_TIME_OPTIONS);
  for (const value of values) {
    const raw = String(firstDialogflowValue(value) || "");
    for (const option of LUNCH_TIME_OPTIONS) {
      const [hours, minutes] = option.split(":");
      const flexiblePattern = new RegExp(`(^|\\D)${Number(hours)}\\D*${minutes}(\\D|$)`);
      if (raw.includes(option) || flexiblePattern.test(raw)) {
        return allowed.has(option) ? option : "";
      }
    }
  }
  return "";
}

function reservationTimeIsAllowed(time: string): boolean {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;
  const total = hours * 60 + minutes;
  const min = 13 * 60 + 30;
  const max = 15 * 60 + 15;
  return total >= min && total <= max;
}

function normalizeDialogflowZone(value: any): string {
  const raw = String(firstDialogflowValue(value) || "").toLowerCase();
  if (raw.includes("terraza") || raw.includes("gastro")) return "terraza";
  if (raw.includes("comedor") || raw.includes("bistro") || raw.includes("interior")) return "interior";
  if (raw.includes("cafeter")) return "cafeteria";
  return "";
}

function localMadridDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
}

function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeHumanText(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseHumanDate(text: string): string {
  const raw = normalizeHumanText(text);
  if (!raw) return "";

  const today = localMadridDate();
  const date = new Date(today);

  if (/\b(hoy|esta noche|este mediodia)\b/.test(raw)) return formatISODate(date);
  if (/\bmanana\b/.test(raw)) {
    date.setDate(date.getDate() + 1);
    return formatISODate(date);
  }
  if (/\bpasado manana\b/.test(raw)) {
    date.setDate(date.getDate() + 2);
    return formatISODate(date);
  }

  const numeric = raw.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : today.getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return formatISODate(new Date(year, month - 1, day));
    }
  }

  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const longDate = raw.match(/\b(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?\b/);
  if (longDate && months[longDate[2]] !== undefined) {
    const year = longDate[3] ? Number(longDate[3]) : today.getFullYear();
    return formatISODate(new Date(year, months[longDate[2]], Number(longDate[1])));
  }

  const weekdays: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  };
  for (const [dayName, targetDay] of Object.entries(weekdays)) {
    if (raw.includes(dayName)) {
      let diff = targetDay - today.getDay();
      if (diff < 0 || raw.includes("proximo") || raw.includes("siguiente")) diff += 7;
      date.setDate(today.getDate() + diff);
      return formatISODate(date);
    }
  }

  return "";
}

function parseHumanGuests(text: string, allowBareNumber: boolean): string {
  const raw = normalizeHumanText(text);
  const wordNumbers: Record<string, string> = {
    uno: "1", una: "1", dos: "2", tres: "3", cuatro: "4", cinco: "5",
    seis: "6", siete: "7", ocho: "8", nueve: "9", diez: "10",
  };

  for (const [word, value] of Object.entries(wordNumbers)) {
    if (new RegExp(`\\b${word}\\b`).test(raw)) return value;
  }

  const contextual = raw.match(/\b(?:somos|seremos|seriamos|para|personas|comensales|gente|mesa para|te dije|dije)\D*(\d{1,2})\b/);
  if (contextual) return contextual[1];

  if (allowBareNumber) {
    const bare = raw.match(/^\D*(\d{1,2})\D*$/);
    if (bare) return bare[1];
  }

  return "";
}

function parseHumanName(text: string, canBeName: boolean): string {
  if (!canBeName) return "";
  const raw = String(text || "").trim();
  if (!raw) return "";
  const cleaned = raw
    .replace(/^(a nombre de|mi nombre es|soy|para)\s+/i, "")
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(/\s+/).length >= 2 ? cleaned : "";
}

function parseHumanPhone(text: string): string {
  const raw = String(text || "").trim();
  const phoneMatch = raw.match(/\+?\d[\d\s().-]{4,}\d/);
  if (!phoneMatch) return "";

  const cleaned = phoneMatch[0]
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return "";

  return cleaned.startsWith("+") ? cleaned : digits;
}

function dialogflowContext(session: string, context: string, parameters: Record<string, any>) {
  return {
    name: `${session}/contexts/${context}`,
    lifespanCount: 5,
    parameters,
  };
}

function dialogflowSessionKey(session: string) {
  const safeSession = String(session || "anonymous")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(-140);
  return `dialogflow_reservation_session:${safeSession}`;
}

// Dialogflow ES webhook: confirms and saves bot reservations.
app.post("/make-server-8a892de6/dialogflow/reservation-webhook", async (c) => {
  try {
    const body = await c.req.json();
    const session = body?.session || "";
    const params = collectDialogflowParameters(body);
    const sessionKey = dialogflowSessionKey(session);
    const previousState = await kv.get(sessionKey) || {};
    const queryText = String(body?.queryResult?.queryText || "");
    const normalizedQueryText = queryText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (normalizedQueryText.includes("reservar de nuevo") || normalizedQueryText.includes("otra reserva")) {
      await kv.del(sessionKey);
      return c.json(dialogflowText(
        "Perfecto, empezamos otra reserva. Cuando quiera, indíqueme el día de la visita.",
        session ? [dialogflowContext(session, "reservar-fecha", {})] : [],
      ));
    }

    const date = normalizeDialogflowDate(params.date || params.fecha || params["date-time"]) || parseHumanDate(queryText);
    const time = extractLunchTimeSelection(queryText, params.time, params.hora, params["date-time"], JSON.stringify(body?.queryResult || {}))
      || parseHumanTime(queryText, !previousState.time)
      || normalizeDialogflowTime(params.time || params.hora || params["date-time"]);
    const guests = String(firstDialogflowValue(params.number || params.personas || params.guests) || "").trim()
      || parseHumanGuests(queryText, Boolean(previousState.date && previousState.time && !previousState.guests));
    const zone = normalizeDialogflowZone(params.zona || params.zone) || normalizeDialogflowZone(queryText);
    const name = String(firstDialogflowValue(params.nombre_apellido || params.person || params.nombre) || "").trim()
      || parseHumanName(queryText, Boolean(previousState.date && previousState.time && previousState.guests && previousState.zone && !previousState.name));
    const shouldReadPhoneFromMessage = Boolean(previousState.date && previousState.time && previousState.guests && previousState.zone && previousState.name);
    const phoneFromMessage = shouldReadPhoneFromMessage ? parseHumanPhone(queryText) : "";
    const phone = String(firstDialogflowValue(params.phone || params.telefono || params.telefono_cliente) || "").trim()
      || phoneFromMessage;

    const state = {
      ...previousState,
      ...(date && { date }),
      ...(time && { time }),
      ...(guests && { guests }),
      ...(zone && { zone }),
      ...(name && { name }),
      ...(phone && { phone }),
      updated_at: new Date().toISOString(),
    };
    await kv.set(sessionKey, state);

    const contextParams = {
      ...params,
      date: state.date || "",
      time: state.time || "",
      number: state.guests || "",
      zona: state.zone || "",
      nombre_apellido: state.name || "",
      telefono: state.phone || "",
    };

    if (state.completed_reservation_id) {
      return c.json(dialogflowText(
        `La reserva ya estaba confirmada con el código ${state.completed_reservation_id}.`,
        [],
      ));
    }

    const guestCount = Number(state.guests);
    if (!Number.isNaN(guestCount) && guestCount > 10) {
      await kv.set(sessionKey, {
        ...state,
        needs_manager_contact: true,
        completed_at: new Date().toISOString(),
      });
      return c.json(dialogflowWhatsapp(
        "Para poder realizar la reserva, debe comunicarse directamente a nuestro WhatsApp. Pulse el enlace para contactar con el Encargado.",
      ));
    }

    if (!state.date) {
      return c.json(dialogflowText(
        "Bienvenid@ al Cafetin, ¿Podría indicarme el dia que le gustaria reservar?",
        session ? [dialogflowContext(session, "reservar-fecha", contextParams)] : [],
      ));
    }

    if (!state.time) {
      return c.json(dialogflowTimeChips(
        "De acuerdo. ¿Para qué hora sería?",
        session ? [dialogflowContext(session, "reservar-hora", contextParams)] : [],
      ));
    }

    if (!reservationTimeIsAllowed(state.time)) {
      const resetTimeState = { ...state, time: "" };
      await kv.set(sessionKey, resetTimeState);
      return c.json(dialogflowTimeChips(
        "La cocina cierra a las 15:45. Las reservas para comida son de 13:30 a 15:15. ¿Qué hora dentro de ese horario prefiere?",
        session ? [dialogflowContext(session, "reservar-hora", { ...contextParams, time: "" })] : [],
      ));
    }

    if (!state.guests) {
      return c.json(dialogflowText(
        "Muy bien. ¿Cuántos comensales serán?",
        session ? [dialogflowContext(session, "reservar-personas", contextParams)] : [],
      ));
    }

    if (!state.zone) {
      return c.json(dialogflowText(
        "Gracias. ¿Le gustaría terraza o comedor?",
        session ? [dialogflowContext(session, "reservar-zona", contextParams)] : [],
      ));
    }

    if (!state.name) {
      return c.json(dialogflowText(
        "Perfecto. Ahora necesito nombre y apellido para la reserva.",
        session ? [dialogflowContext(session, "reservar-nombre", contextParams)] : [],
      ));
    }

    if (state.name.split(/\s+/).filter(Boolean).length < 2) {
      return c.json(dialogflowText(
        "Necesito nombre y apellido para confirmar la reserva, por favor.",
        session ? [dialogflowContext(session, "reservar-nombre", contextParams)] : [],
      ));
    }

    const dialogflowUserId =
      body?.queryResult?.queryParams?.payload?.userId ||
      body?.originalDetectIntentRequest?.payload?.userId ||
      "";

    let profilePhone = "";
    let userCode = null;
    if (dialogflowUserId) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.auth.admin.getUserById(dialogflowUserId);
      profilePhone = data?.user?.user_metadata?.phone || "";
      userCode = data?.user?.user_metadata?.code || null;
    }

    const reservationPhone = state.phone || profilePhone;

    if (!reservationPhone) {
      return c.json(dialogflowText(
        "Gracias. Para terminar, indíqueme un número de teléfono de contacto para la reserva.",
        session ? [dialogflowContext(session, "reservar-telefono", contextParams)] : [],
      ));
    }

    const reservation = {
      id: `RES-${Date.now()}`,
      guests: state.guests,
      date: state.date,
      time: state.time,
      zone: state.zone,
      name: state.name,
      phone: reservationPhone,
      user_id: dialogflowUserId || null,
      user_code: userCode,
      status: "confirmed",
      comments: "Reserva creada desde el chatbot",
      source: "dialogflow",
      created_at: new Date().toISOString(),
    };

    await saveReservationRecord(reservation, dialogflowUserId ? "chatbot-client" : "chatbot");
    await kv.set(sessionKey, {
      ...state,
      completed_reservation_id: reservation.id,
      completed_at: new Date().toISOString(),
    });

    const zoneLabel = state.zone === "terraza" ? "GastroGarden" : state.zone === "interior" ? "Bistro" : "Cafetería";
    const calendarLink = buildReservationCalendarLink(reservation, zoneLabel);
    return c.json(dialogflowReservationDone(
      `Reserva confirmada para ${state.name}: ${state.guests} persona(s), ${state.date} a las ${state.time}, zona ${zoneLabel}. ${dialogflowUserId ? "También aparecerá en tu perfil." : "Si inicia sesión antes de reservar, podrá verla también en su perfil."}`,
      calendarLink,
    ));
  } catch (error: any) {
    console.log(`Error en webhook de Dialogflow: ${error}`);
    return c.json(dialogflowText(error?.message || "No pude completar la reserva. Inténtelo de nuevo o contacte con el restaurante."), 200);
  }
});

// Zone availability endpoint
app.post("/make-server-8a892de6/zone-availability", async (c) => {
  try {
    const { date, time, guests } = await c.req.json();
    const requestedGuests = Number(guests) || 1;
    console.log('Calculando disponibilidad por zona:', { date, time, guests });

    const availability: Record<string, any> = {};
    for (const [zone, capacity] of Object.entries(ZONE_CAPACITIES)) {
      const tableAvailability = await getTableAvailability(date, time, zone, requestedGuests);
      availability[zone] = {
        total: capacity,
        reserved: tableAvailability.reservedSeats,
        available: tableAvailability.availableSeats,
        canFit: tableAvailability.canFit,
        assignedCapacity: tableAvailability.assignedTables.reduce((total: number, table: ZoneTable) => total + table.seats, 0),
        assignedTables: tableAvailability.assignedTables,
        freeTables: tableAvailability.freeTables.length,
      };
    }

    console.log('Disponibilidad por zona:', availability);
    return c.json({ availability });
  } catch (error) {
    console.log(`Error al calcular disponibilidad por zona: ${error}`);
    return c.json({ error: "Error al calcular disponibilidad" }, 500);
  }
});

// Check table availability endpoint (kept for backward compatibility)
app.post("/make-server-8a892de6/check-availability", async (c) => {
  try {
    const { date, time, zone, guests } = await c.req.json();
    const requestedGuests = Number(guests) || 1;
    console.log('Verificando disponibilidad de zona:', { date, time, zone, guests });

    const tableAvailability = await getTableAvailability(date, time, zone, requestedGuests);
    const available = tableAvailability.canFit;

    return c.json({ available });
  } catch (error) {
    console.log(`Error al verificar disponibilidad: ${error}`);
    return c.json({ error: "Error al verificar disponibilidad" }, 500);
  }
});

// Get occupied tables for a specific date and time
app.post("/make-server-8a892de6/occupied-tables", async (c) => {
  try {
    const { date, time } = await c.req.json();

    console.log('Obteniendo mesas ocupadas para:', { date, time });

    const allReservationsKey = 'all_reservations';
    const allReservationIds = await kv.get(allReservationsKey) || [];

    const requestedTurn = getReservationTurn(time);

    const occupiedTables: string[] = [];

    for (const reservationId of allReservationIds) {
      const reservation = await kv.get(`reservation:${reservationId}`);

      if (!reservation || reservation.date !== date) {
        continue;
      }
      if (reservation.status === "cancelled") {
        continue;
      }

      if (getReservationTurn(reservation.time) === requestedTurn) {
        const storedTables = Array.isArray(reservation.table_ids)
          ? reservation.table_ids
          : reservation.table
            ? [String(reservation.table)]
            : [];
        occupiedTables.push(...storedTables.map(String));
      }
    }

    console.log('Mesas ocupadas:', occupiedTables);
    return c.json({ occupiedTables });
  } catch (error) {
    console.log(`Error al obtener mesas ocupadas: ${error}`);
    return c.json({ error: "Error al obtener mesas ocupadas" }, 500);
  }
});

// Create reservation endpoint
app.post("/make-server-8a892de6/reservations", async (c) => {
  try {
    const reservation = await c.req.json();

    console.log('Creando reserva:', reservation);

    await saveReservationRecord(reservation, reservation.user_id ? "client" : "admin");

    return c.json({
      success: true,
      reservation
    });
  } catch (error) {
    console.log(`Error al crear reserva: ${error}`);
    return c.json({ error: error?.message || "Error al crear reserva" }, 500);
  }
});

// Get user reservations endpoint
app.get("/make-server-8a892de6/reservations", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Get user's reservation IDs
    const userKey = `user_reservations:${user.id}`;
    const storedReservationIds = await kv.get(userKey) || [];
    const linkedReservationIds = new Set<string>(storedReservationIds);
    const profilePhone = user.user_metadata?.phone || "";

    // Also claim previous guest reservations that used the same phone number.
    if (profilePhone) {
      const allReservationIds = await kv.get("all_reservations") || [];
      for (const id of allReservationIds) {
        const reservation = await kv.get(`reservation:${id}`);
        if (!reservation) continue;
        if (!reservationPhonesMatch(reservation.phone, profilePhone)) continue;
        if (reservation.user_id && reservation.user_id !== user.id) continue;

        linkedReservationIds.add(id);
        if (reservation.user_id !== user.id) {
          await kv.set(`reservation:${id}`, { ...reservation, user_id: user.id });
        }
      }
    }

    const reservationIds = Array.from(linkedReservationIds);
    if (reservationIds.length !== storedReservationIds.length) {
      await kv.set(userKey, reservationIds);
    }

    // Get all reservations
    const reservations = [];
    for (const id of reservationIds) {
      const reservation = await kv.get(`reservation:${id}`);
      if (reservation) {
        reservations.push(reservation);
      }
    }

    reservations.sort((a: any, b: any) => {
      const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCompare !== 0) return dateCompare;
      return String(b.time || "").localeCompare(String(a.time || ""));
    });

    return c.json({
      reservations
    });
  } catch (error) {
    console.log(`Error al obtener reservas: ${error}`);
    return c.json({ error: "Error al obtener reservas" }, 500);
  }
});

// Cancel reservation endpoint — marks as cancelled, keeps the record
app.delete("/make-server-8a892de6/reservations/:id", async (c) => {
  try {
    const reservationId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) return c.json({ error: "No autorizado" }, 401);

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "No autorizado" }, 401);

    // Parse optional body (reason)
    let reason = "";
    try {
      const body = await c.req.json();
      reason = body?.reason || "";
    } catch { /* no body */ }

    const reservation = await kv.get(`reservation:${reservationId}`);
    if (!reservation) return c.json({ error: "Reserva no encontrada" }, 404);

    // ── Time limit check: cannot cancel within 45 min of reservation time ──
    const [resHours, resMinutes] = (reservation.time || "00:00").split(":").map(Number);
    const reservationDate = new Date(`${reservation.date}T${reservation.time}:00`);
    const deadlineDate = new Date(reservationDate.getTime() - 45 * 60 * 1000);
    const now = new Date();

    if (now >= deadlineDate) {
      const deadlineStr = `${String(deadlineDate.getHours()).padStart(2,"0")}:${String(deadlineDate.getMinutes()).padStart(2,"0")}`;
      return c.json({
        error: `El plazo para cancelar esta reserva era las ${deadlineStr}. Ya no es posible cancelar con menos de 45 minutos de antelación.`,
        code: "TOO_LATE"
      }, 422);
    }

    // Mark as cancelled
    const cancelled = {
      ...reservation,
      status: "cancelled",
      cancel_reason: reason || null,
      cancelled_at: new Date().toISOString(),
    };
    await kv.set(`reservation:${reservationId}`, cancelled);

    // ── Store admin notification ──
    const notifKey = "admin_notifications";
    const existing = await kv.get(notifKey) || [];
    const notif = {
      id: `NOTIF-${Date.now()}`,
      type: "cancellation",
      read: false,
      created_at: new Date().toISOString(),
      reservation_id: reservationId,
      reservation_date: reservation.date,
      reservation_time: reservation.time,
      guest_name: reservation.name || "Cliente",
      guests: reservation.guests,
      zone: reservation.zone,
      reason: reason || null,
    };
    await kv.set(notifKey, [notif, ...existing].slice(0, 50)); // keep last 50

    console.log(`Reserva ${reservationId} cancelada. Motivo: ${reason}`);
    return c.json({ success: true, message: "Reserva cancelada correctamente" });
  } catch (error) {
    console.log(`Error al cancelar reserva: ${error}`);
    return c.json({ error: "Error al cancelar reserva" }, 500);
  }
});

// Admin notifications
app.get("/make-server-8a892de6/admin/notifications", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const notifications = await kv.get("admin_notifications") || [];
    return c.json({ notifications });
  } catch (error) {
    console.log(`Error al obtener notificaciones: ${error}`);
    return c.json({ error: "Error interno" }, 500);
  }
});

app.post("/make-server-8a892de6/admin/notifications/read-all", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const notifications = await kv.get("admin_notifications") || [];
    const updated = notifications.map((n: any) => ({ ...n, read: true }));
    await kv.set("admin_notifications", updated);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al marcar notificaciones: ${error}`);
    return c.json({ error: "Error interno" }, 500);
  }
});

app.get("/make-server-8a892de6/admin/reservation-history", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;
    const history = await kv.get("admin_reservation_history") || [];
    return c.json({ history });
  } catch (error) {
    console.log(`Error al obtener historial de reservas: ${error}`);
    return c.json({ error: "Error interno" }, 500);
  }
});

// ─── ADMIN ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@elcafetin.com";

async function requireAdmin(c: any): Promise<{ userId: string } | Response> {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return c.json({ error: "No autorizado" }, 401);

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return c.json({ error: "Acceso denegado" }, 403);
  }
  return { userId: user.id };
}

// One-time admin setup — creates the admin Supabase user
app.post("/make-server-8a892de6/admin/setup", async (c) => {
  try {
    const { password } = await c.req.json();
    if (!password || password.length < 8) {
      return c.json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Check if admin already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const adminExists = existing?.users?.some((u: any) => u.email === ADMIN_EMAIL);
    if (adminExists) {
      return c.json({ error: "El administrador ya existe. Usa la pantalla de login." }, 409);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      user_metadata: { name: "Administrador", role: "admin" },
      email_confirm: true,
    });

    if (error) {
      console.log(`Error al crear admin: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, message: "Administrador creado correctamente" });
  } catch (error) {
    console.log(`Error en admin/setup: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// List / search users (admin only)
app.get("/make-server-8a892de6/admin/users", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;

    const q = c.req.query("q")?.toLowerCase() || "";

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.log(`Error al listar usuarios: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    const users = (data.users || [])
      .filter((u: any) => u.email !== "admin@elcafetin.com")
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || "",
        phone: u.user_metadata?.phone || "",
        code: u.user_metadata?.code || "",
        created_at: u.created_at,
      }))
      .filter((u: any) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.code.toLowerCase().includes(q)
        );
      });

    return c.json({ users });
  } catch (error) {
    console.log(`Error en admin/users: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// Get all reservations (admin only)
app.get("/make-server-8a892de6/admin/reservations", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;

    const allReservationIds = await kv.get("all_reservations") || [];
    const reservations = [];

    for (const id of allReservationIds) {
      const reservation = await kv.get(`reservation:${id}`);
      if (reservation) reservations.push(reservation);
    }

    // Sort by date desc, then time desc
    reservations.sort((a: any, b: any) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });

    return c.json({ reservations });
  } catch (error) {
    console.log(`Error al obtener reservas (admin): ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

async function updateReservationStatus(c: any) {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;

    const reservationId = c.req.param("id");
    const { status } = await c.req.json();

    const allowed = ["confirmed", "pending", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return c.json({ error: "Estado no válido" }, 400);
    }

    const reservation = await kv.get(`reservation:${reservationId}`);
    if (!reservation) {
      return c.json({ error: "Reserva no encontrada" }, 404);
    }

    const updated = { ...reservation, status };

    if (status === "confirmed" && reservation.status === "cancelled") {
      delete updated.cancel_reason;
      delete updated.cancelled_at;
      updated.restored_at = new Date().toISOString();
      await addReservationHistory("restored", updated, {
        previous_status: reservation.status,
      });
    } else if (status === "confirmed" && reservation.status !== "confirmed") {
      await addReservationHistory("confirmed", updated, {
        previous_status: reservation.status,
      });
    }

    await kv.set(`reservation:${reservationId}`, updated);

    return c.json({ success: true, reservation: updated });
  } catch (error) {
    console.log(`Error al actualizar estado de reserva: ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
}

// Update reservation status (admin only)
app.put("/make-server-8a892de6/admin/reservations/:id", updateReservationStatus);
app.patch("/make-server-8a892de6/admin/reservations/:id", updateReservationStatus);

// Delete any reservation (admin only)
app.delete("/make-server-8a892de6/admin/reservations/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth instanceof Response) return auth;

    const reservationId = c.req.param("id");

    // Read reservation before deleting to get user_id
    const reservation = await kv.get(`reservation:${reservationId}`);

    if (reservation) {
      await addReservationHistory("deleted", reservation, {
        previous_status: reservation.status,
      });
    }

    await kv.del(`reservation:${reservationId}`);

    // Remove from global list
    const allReservationIds = await kv.get("all_reservations") || [];
    await kv.set("all_reservations", allReservationIds.filter((id: string) => id !== reservationId));

    // Remove from user's personal list if linked to a user
    if (reservation?.user_id) {
      const userKey = `user_reservations:${reservation.user_id}`;
      const userIds = await kv.get(userKey) || [];
      await kv.set(userKey, userIds.filter((id: string) => id !== reservationId));
    }

    console.log(`Reserva ${reservationId} eliminada por admin`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error al eliminar reserva (admin): ${error}`);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// ─── DESARROLLO ──────────────────────────────────────────────────────────────

// DESARROLLO: Endpoint para limpiar todas las reservas
app.delete("/make-server-8a892de6/clear-all-reservations", async (c) => {
  try {
    console.log('🗑️ Limpiando todas las reservas...');

    const allReservationsKey = 'all_reservations';
    const allReservationIds = await kv.get(allReservationsKey) || [];

    // Delete each reservation
    for (const reservationId of allReservationIds) {
      await kv.del(`reservation:${reservationId}`);
      console.log(`Eliminada reserva: ${reservationId}`);
    }

    // Clear the global list
    await kv.set(allReservationsKey, []);

    // Clear all user reservation lists (buscar todas las claves que empiecen con user_reservations:)
    // Nota: En un sistema real, necesitarías un índice de usuarios

    console.log(`✅ ${allReservationIds.length} reservas eliminadas`);
    return c.json({
      success: true,
      message: `${allReservationIds.length} reservas eliminadas exitosamente`
    });
  } catch (error) {
    console.log(`Error al limpiar reservas: ${error}`);
    return c.json({ error: "Error al limpiar reservas" }, 500);
  }
});

Deno.serve(app.fetch);
