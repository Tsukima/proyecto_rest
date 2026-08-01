import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, CalendarX } from "lucide-react";
import { AllergenIcon } from "../components/AllergenIcon";
import { api } from "../../utils/supabase-client";

type MenuItem = { name: string; allergens: string[] };
type MenuSection = { title: string; items: MenuItem[] };
type MenuVariant = { title: string; price: string; includes: string; isVeggie: boolean; sections: MenuSection[] };
type DegustationMenu = { title: string; price: string; includes: string; note?: string; sections: MenuSection[] };
type WeekendMenuData = { menus: MenuVariant[]; degustation: DegustationMenu };

function cleanVeggieSectionTitle(title: string, isVeggie = false): string {
  if (!isVeggie) return title;
  return title
    .replace(/\s*\(a elegir\)/gi, "")
    .replace(/\s+a elegir/gi, "")
    .replace(/^Primeros$/i, "Primero")
    .replace(/^Segundos$/i, "Segundo");
}

function ItemRow({ item }: { item: MenuItem }) {
  return (
    <div className="pl-3 border-l-2 border-primary/20 space-y-1.5">
      <p className="text-sm leading-relaxed">{item.name}</p>
      {item.allergens?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.allergens.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-[#fbf6ea] px-2 py-0.5 rounded-full border border-primary/10 text-xs">
              <AllergenIcon allergen={a} size={14} />
              <span className="font-medium leading-none">{a}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function WeekendMenuPage() {
  const [menuData, setMenuData] = useState<WeekendMenuData | null>(null);
  const [loading, setLoading] = useState(true);

  // Saturday gate
  const today = new Date();
  const isSaturday = today.getDay() === 6;

  useEffect(() => {
    const cached = localStorage.getItem("published:menu:weekend");
    if (cached) {
      try { setMenuData(JSON.parse(cached)); setLoading(false); return; } catch { /* ignore */ }
    }
    api.getWeekendMenu()
      .then((data) => { setMenuData(data); localStorage.setItem("published:menu:weekend", JSON.stringify(data)); })
      .catch(() => setMenuData(null))
      .finally(() => setLoading(false));
  }, []);

  // ─── Saturday gate ───────────────────────────────────────────────────────
  if (!isSaturday) {
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    return (
      <div className="min-h-screen flex items-center justify-center py-16 px-4 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef]">
        <div className="text-center max-w-md">
          <div className="mb-6 text-6xl">📅</div>
          <h1 className="text-3xl font-bold mb-3 text-primary">Menú de Fin de Semana</h1>
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 rounded-full px-6 py-3 mb-6 shadow-sm">
            <CalendarX className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">Disponible solo los sábados</span>
          </div>
          <p className="text-muted-foreground mb-8">
            Este menú especial estará disponible el próximo sábado
            {daysUntilSaturday === 1 ? " (¡mañana!)" : ` (en ${daysUntilSaturday} días)`}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/menu-dia">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Ver Menú del Día
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Saturday: show menu ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary mb-3">Oferta Gastronómica</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Menú de Fin de Semana</h1>
          <p className="text-lg text-muted-foreground mb-4">Sábado · Menús especiales con ingredientes premium</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Cargando menú…</div>
        ) : (
          <>
            {/* Main menus grid */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {menuData?.menus?.map((menu, idx) => (
                <Card key={idx} className={menu.isVeggie
                  ? "bg-gradient-to-br from-[#f8fff2] via-white to-[#dcefd2] border-primary/25 shadow-lg overflow-hidden"
                  : "bg-white/90 border-primary/15 shadow-lg overflow-hidden"
                }>
                  <CardHeader className="bg-[#fbf6ea] border-b border-primary/10">
                    <CardTitle className="text-2xl text-center flex items-center justify-center gap-2 text-primary">
                      {menu.isVeggie && <span>🌱</span>}
                      {menu.title}
                    </CardTitle>
                    {menu.includes && (
                      <p className="text-center text-sm text-muted-foreground italic mt-2">{menu.includes}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {menu.sections.map((section, si) => (
                      <div key={si} className="space-y-3">
                        <h4 className="font-bold text-base uppercase tracking-wide text-primary border-b-2 border-primary/20 pb-2">
                          {cleanVeggieSectionTitle(section.title, menu.isVeggie)}
                        </h4>
                        <div className="space-y-3">
                          {section.items.map((item, ii) => (
                            <ItemRow key={ii} item={item} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Degustation menu */}
            {menuData?.degustation && (
              <Card className="mb-12 bg-gradient-to-br from-[#fff3d8] via-white to-[#dcefd2] border-primary/25 shadow-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl text-primary">🍷 {menuData.degustation.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Experiencia gastronómica completa</p>
                </CardHeader>
                <CardContent>
                  <Card className="bg-white/90 border-primary/15">
                    <CardHeader className="bg-[#fbf6ea] border-b border-primary/10">
                      <p className="text-center text-sm text-muted-foreground italic mt-2">{menuData.degustation.includes}</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {menuData.degustation.sections.map((section, si) => (
                        <div key={si} className="space-y-3">
                          <h4 className="font-bold text-base uppercase tracking-wide text-primary border-b-2 border-primary/20 pb-2">
                            {section.title}
                          </h4>
                          <div className="space-y-3">
                            {section.items.map((item, ii) => (
                              <ItemRow key={ii} item={item} />
                            ))}
                          </div>
                        </div>
                      ))}
                      {menuData.degustation.note && (
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground italic">{menuData.degustation.note}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="p-6 bg-[#fbf6ea] rounded-lg border border-primary/15">
          <p className="text-sm font-medium mb-2 text-primary">⚠️ Información de Alergias</p>
          <p className="text-xs text-muted-foreground">
            Nuestros menús pueden contener: crustáceos, altramuces, pescado, huevo, moluscos, gluten, apio,
            frutos secos, leche, mostaza, sésamo, soja, sulfitos. Si padece alguna alergia o intolerancia
            es imprescindible comunicarlo al personal antes de realizar el pedido.
          </p>
        </div>
      </div>
    </div>
  );
}
