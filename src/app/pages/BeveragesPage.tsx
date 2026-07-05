import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Wine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DEFAULT_BEVERAGES, beverageTitleWithEmoji, normalizeBeverageData, type BeverageData } from "../data/beverages";
import { api } from "../../utils/supabase-client";

export function BeveragesPage() {
  const [beverageData, setBeverageData] = useState<BeverageData>(DEFAULT_BEVERAGES);

  useEffect(() => {
    const local = localStorage.getItem("published:beverages");
    if (local) {
      try {
        setBeverageData(normalizeBeverageData(JSON.parse(local)));
      } catch {
        setBeverageData(DEFAULT_BEVERAGES);
      }
    }

    api.getBeverages()
      .then((data) => setBeverageData(normalizeBeverageData(data)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary mb-3">El Cafetín Pontevedra</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Carta de Bebidas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Amplia selección de bebidas, cervezas, vinos y licores
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {beverageData.sections.map((section, index) => (
            <Card key={index} className="bg-white/90 border-primary/15 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-primary/10 bg-[#fbf6ea]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl text-primary">{beverageTitleWithEmoji(section.title)}</CardTitle>
                    {section.description && (
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                  {section.title.toLowerCase().includes("vino") && (
                    <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
                      <Link to="/carta-vinos">
                        <Wine className="h-4 w-4" />
                        Ver carta extendida
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="pb-2 border-b border-primary/10 last:border-b-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                        </div>
                        {(item.price || item.terracePrice) && (
                          <div className="text-right text-sm whitespace-nowrap">
                            {item.price && (
                              <div className="font-bold text-primary">{item.price}€</div>
                            )}
                            {item.terracePrice && (
                              <div className="text-xs text-muted-foreground">Terraza {item.terracePrice}€</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-[#fbf6ea] border-primary/15 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Consulta con nuestro personal sobre disponibilidad y recomendaciones de maridaje
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
