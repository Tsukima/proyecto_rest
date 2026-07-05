import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Wine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DEFAULT_WINE_LIST, normalizeWineListData, type WineListData } from "../data/wine-list";
import { api } from "../../utils/supabase-client";

export function WineListPage() {
  const [wineList, setWineList] = useState<WineListData>(DEFAULT_WINE_LIST);

  useEffect(() => {
    const local = localStorage.getItem("published:wine-list");
    if (local) {
      try {
        setWineList(normalizeWineListData(JSON.parse(local)));
      } catch {
        setWineList(DEFAULT_WINE_LIST);
      }
    }

    api.getWineList()
      .then((data) => setWineList(normalizeWineListData(data)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef] px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Bodega El Cafetín</p>
            <h1 className="text-4xl font-bold text-primary md:text-5xl">Carta de Vinos</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Selección de tintos, blancos, espumosos y dulces para acompañar la carta.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit gap-2">
            <Link to="/beverages">
              <ArrowLeft className="h-4 w-4" />
              Volver a bebidas
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {wineList.groups.map((group) => (
            <Card key={group.title} className="overflow-hidden border-primary/15 bg-white/95 shadow-sm">
              <CardHeader className="border-b border-primary/10 bg-[#fbf6ea]">
                <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                  <Wine className="h-6 w-6" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {group.sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="mb-3 text-lg font-semibold text-foreground">{section.title}</h2>
                    <div className="space-y-2">
                      {section.wines.map((wine) => (
                        <div key={`${wine.name}-${wine.price}`} className="flex items-baseline justify-between gap-4 border-b border-primary/10 pb-2 last:border-b-0">
                          <span className="font-medium">{wine.name}</span>
                          <span className="whitespace-nowrap font-bold text-primary">{wine.price}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/15 bg-[#fbf6ea] shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Consulta disponibilidad, añadas y recomendaciones de maridaje con nuestro personal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
