import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AllergenIcon } from "../components/AllergenIcon";
import { DEFAULT_BREAKFAST_MENU, normalizeBreakfastMenuData, type BreakfastMenuData } from "../data/breakfast-menu";
import { api } from "../../utils/supabase-client";

const parseAllergens = (description: string): string[] => {
  const allergensList = [
    "Gluten", "Crustáceos", "Huevos", "Huevo", "Pescado", "Cacahuetes",
    "Soja", "Lácteos", "Frutos de cáscara", "Frutos secos", "Apio",
    "Mostaza", "Sésamo", "Sulfitos", "Altramuces", "Moluscos"
  ];

  return allergensList.filter((allergen) =>
    description.toLowerCase().includes(allergen.toLowerCase())
  );
};

export function BreakfastMenuPage() {
  const [menuData, setMenuData] = useState<BreakfastMenuData>(DEFAULT_BREAKFAST_MENU);

  useEffect(() => {
    const local = localStorage.getItem("published:breakfast-menu");
    if (local) {
      try {
        setMenuData(normalizeBreakfastMenuData(JSON.parse(local)));
      } catch {
        setMenuData(DEFAULT_BREAKFAST_MENU);
      }
    }

    api.getBreakfastMenu()
      .then((data) => setMenuData(normalizeBreakfastMenuData(data)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef] px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">El Cafetín Pontevedra</p>
          <h1 className="mb-4 text-4xl font-bold text-primary md:text-5xl">Carta de Desayunos</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cafés, tostadas y opciones para empezar el día con calma.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {menuData.sections.map((section, index) => (
            <Card key={index} className="overflow-hidden border-primary/15 bg-white/90 shadow-sm">
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
                      <div key={itemIndex} className="border-b border-primary/10 pb-3 last:border-b-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="mb-1 font-medium">{item.name}</h4>
                            {allergens.length > 0 && (
                              <div className="mb-1 flex flex-wrap gap-1.5">
                                {allergens.map((allergen) => (
                                  <span key={allergen} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-1">
                                    <AllergenIcon allergen={allergen} size={20} />
                                    <span className="text-xs font-medium leading-none">{allergen}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.description && (
                              <p className="text-xs italic text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          {item.price && (
                            <span className="whitespace-nowrap font-bold text-primary">{item.price}€</span>
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
      </div>
    </div>
  );
}
