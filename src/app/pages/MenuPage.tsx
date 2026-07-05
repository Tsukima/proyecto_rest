import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AllergenIcon } from "../components/AllergenIcon";
import { Button } from "../components/ui/button";
import { DEFAULT_GENERAL_MENU, normalizeGeneralMenuData, type GeneralMenuData } from "../data/general-menu";
import { api } from "../../utils/supabase-client";

const parseAllergens = (description: string): string[] => {
  const allergensList = [
    "Gluten", "Crustáceos", "Huevos", "Huevo", "Pescado", "Cacahuetes",
    "Soja", "Lácteos", "Frutos de cáscara", "Frutos secos", "Apio",
    "Mostaza", "Sésamo", "Sulfitos", "Altramuces", "Moluscos"
  ];
  const found: string[] = [];

  allergensList.forEach(allergen => {
    if (description.toLowerCase().includes(allergen.toLowerCase())) {
      found.push(allergen);
    }
  });

  return found;
};

export function MenuPage() {
  const [menuData, setMenuData] = useState<GeneralMenuData>(DEFAULT_GENERAL_MENU);

  useEffect(() => {
    const local = localStorage.getItem("published:general-menu");
    if (local) {
      try {
        setMenuData(normalizeGeneralMenuData(JSON.parse(local)));
      } catch {
        setMenuData(DEFAULT_GENERAL_MENU);
      }
    }

    api.getGeneralMenu()
      .then((data) => setMenuData(normalizeGeneralMenuData(data)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary mb-3">El Cafetín Pontevedra</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Nuestra Carta</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestras tapas y platos elaborados con productos frescos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-[#fff3d8] via-[#f8fff2] to-[#cfe9c3] border-primary/40 hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                onClick={() => window.location.href = '/menu-dia'}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4 text-primary">🍽️ Menú del Día</CardTitle>
              <p className="text-lg font-medium text-foreground/80">Lunes a Viernes</p>
              <p className="text-4xl font-bold text-primary mt-4">18,00 €</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground mb-4">
                Menús que cambian diariamente con ingredientes de temporada
              </p>
              <p className="text-sm italic">
                Incluye: Bebida, postre o café
              </p>
              <Button variant="outline" className="border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground">
                Ver Menú
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#dcefd2] via-[#fffaf0] to-[#f2ddb7] border-primary/40 hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                onClick={() => window.location.href = '/menu-fin-de-semana'}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4 text-primary">🍷 Menú Fin de Semana</CardTitle>
              <p className="text-lg font-medium text-foreground/80">Sábado y Domingo</p>
              <p className="text-4xl font-bold text-primary mt-4">28,00 €</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground mb-4">
                Menús especiales con ingredientes premium
              </p>
              <p className="text-sm italic">
                Incluye: Bebida, postre o café
              </p>
              <Button variant="outline" className="border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground">
                Ver Menú
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/85 border-primary/15 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">☕ La Cafetería</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-sm font-medium">Horario General</p>
              <p className="text-lg font-bold">Lunes - Sábado</p>
              <p className="text-muted-foreground">10:00 - 23:00</p>
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">Cocina nocturna</p>
                <p className="text-sm font-medium">Lunes - Miércoles</p>
                <p className="text-xs">20:00 - 21:50</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85 border-primary/15 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">🍽️ El Bistro</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-sm font-medium">Horario de Servicio</p>
              <p className="text-lg font-bold">Lunes - Sábado</p>
              <p className="text-muted-foreground">13:30 - 17:00</p>
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">Cocina abierta</p>
                <p className="text-sm font-medium">13:00 - 16:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85 border-primary/15 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">🍷 La Gastroteca</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-sm font-medium">Horario de Servicio</p>
              <p className="text-lg font-bold">Jueves - Sábado</p>
              <p className="text-muted-foreground">20:00 - 00:00</p>
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">Cocina abierta</p>
                <p className="text-sm font-medium">20:30 - 23:50</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {menuData.sections.map((section, index) => (
            <Card key={index} className="bg-white/90 border-primary/15 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-primary/10 bg-[#fbf6ea]">
                <CardTitle className="text-2xl text-primary">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => {
                    const allergens = item.description ? parseAllergens(item.description) : [];
                    return (
                      <div key={itemIndex} className="pb-3 border-b border-primary/10 last:border-b-0">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{item.name}</h4>
                            {allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                {allergens.map((allergen, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full border"
                                  >
                                    <AllergenIcon allergen={allergen} size={20} />
                                    <span className="text-xs font-medium leading-none">{allergen}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.description && (
                              <p className="text-xs text-muted-foreground italic">{item.description}</p>
                            )}
                          </div>
                          {item.price && (
                            <span className="font-bold text-primary whitespace-nowrap">{item.price}€</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-white/90 border-primary/15 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">📘 Información sobre Alérgenos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              A continuación se detallan los 14 alérgenos oficiales de la Unión Europea.
              Todos nuestros platos están etiquetados con sus alérgenos correspondientes.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allergens.map((allergen, index) => (
                <div key={index} className="flex items-center gap-3">
                  <AllergenIcon allergen={allergen} size={40} />
                  <span className="text-sm font-medium">{allergen}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6 italic">
              Si tiene alguna alergia o intolerancia alimentaria, por favor consulte con nuestro personal antes de realizar su pedido.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const allergens = [
  "Gluten",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Lácteos",
  "Frutos de cáscara",
  "Apio",
  "Mostaza",
  "Sésamo",
  "Sulfitos",
  "Altramuces",
  "Moluscos",
];
