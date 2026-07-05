import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AllergenIcon } from "../components/AllergenIcon";
import { api } from "../../utils/supabase-client";

type MenuItem = { name: string; allergens: string[] };
type MenuSection = { title: string; items: MenuItem[] };
type MenuVariant = { title: string; price: string; includes: string; isVeggie: boolean; sections: MenuSection[] };
type WeekdayMenuData = { menus: MenuVariant[] };

function getSectionIcon(title: string): string {
  if (title.includes("Aperitivo")) return "🥂";
  if (title.includes("Primero")) return "🥗";
  if (title.includes("Segundo")) return "🍖";
  if (title.includes("Postre")) return "🍰";
  return "🍽️";
}

function cleanVeggieSectionTitle(title: string, isVeggie = false): string {
  if (!isVeggie) return title;
  return title
    .replace(/\s*\(a elegir\)/gi, "")
    .replace(/\s+a elegir/gi, "")
    .replace(/^Primeros$/i, "Primero")
    .replace(/^Segundos$/i, "Segundo");
}

function MenuSection({ section, compact = false, isVeggie = false }: { section: MenuSection; compact?: boolean; isVeggie?: boolean }) {
  const title = cleanVeggieSectionTitle(section.title, isVeggie);

  return (
    <div className={compact ? "mb-4 text-center" : "mb-8 last:mb-0 text-center"}>
      <h3 className={compact
        ? "text-lg font-bold text-primary mb-2"
        : "text-2xl font-bold text-primary mb-4 flex items-center justify-center gap-3"
      }>
        {!compact && <span className="text-3xl">{getSectionIcon(title)}</span>}
        {title}
      </h3>
      <div className={compact ? "space-y-3" : "space-y-4"}>
        {section.items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="max-w-2xl">
              <p className={`${compact ? "text-sm" : "text-base"} leading-relaxed text-muted-foreground mb-2`}>
                {item.name}
              </p>
              {item.allergens?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {item.allergens.map((allergen, j) => (
                    <span key={j} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border border-primary/10 text-xs ${compact ? "bg-white/70" : "bg-[#fbf6ea]"}`}>
                      <AllergenIcon allergen={allergen} size={16} />
                      <span className="font-medium leading-none">{allergen}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekdayMenuPage() {
  const [menuData, setMenuData] = useState<WeekdayMenuData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first (set by admin immediately on publish)
    const cached = localStorage.getItem("published:menu:weekday");
    if (cached) {
      try { setMenuData(JSON.parse(cached)); setLoading(false); return; } catch { /* ignore */ }
    }
    api.getWeekdayMenu()
      .then((data) => { setMenuData(data); localStorage.setItem("published:menu:weekday", JSON.stringify(data)); })
      .catch(() => setMenuData(null))
      .finally(() => setLoading(false));
  }, []);

  const mainMenu = menuData?.menus?.find((m) => !m.isVeggie);
  const veggieMenu = menuData?.menus?.find((m) => m.isVeggie);

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4f8ef]">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-block mb-4"><span className="text-6xl">🍽️</span></div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary mb-3">Oferta Gastronómica</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-primary">Menú del Día</h1>
          <p className="text-xl text-muted-foreground mb-6">De lunes a viernes</p>
          {mainMenu && (
            <div className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-full shadow-lg">
              <span className="text-4xl font-bold">{mainMenu.price}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4 italic">
            {mainMenu?.includes || "Incluye: Bebida, postre o café"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Cargando menú…</div>
        ) : (
          <>
            {/* Main menu */}
            {mainMenu && (
              <Card className="bg-white/90 backdrop-blur shadow-xl border-primary/15 mb-8">
                <CardContent className="p-8 md:p-12">
                  {mainMenu.sections.map((section, i) => (
                    <MenuSection key={i} section={section} />
                  ))}
                  <div className="mt-8 pt-6 border-t border-primary/15 text-center">
                    <p className="text-4xl font-bold text-primary">{mainMenu.price}</p>
                    <p className="text-sm text-muted-foreground italic mt-2">
                      {mainMenu.includes || "Incluye: Bebida, postre o café"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Veggie menu */}
            {veggieMenu && (
              <Card className="bg-gradient-to-br from-[#f8fff2] via-white to-[#dcefd2] border-primary/25 mb-8 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center justify-center gap-3 text-center">
                    <span className="text-3xl">🌱</span>
                    {veggieMenu.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {veggieMenu.sections.map((section, i) => (
                    <MenuSection key={i} section={section} compact isVeggie />
                  ))}
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-center font-bold text-primary text-4xl">{veggieMenu.price}</p>
                    <p className="text-center text-sm text-muted-foreground italic mt-1">{veggieMenu.includes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="p-6 bg-[#fbf6ea] rounded-xl border border-primary/15">
          <p className="text-sm font-bold mb-2 text-primary">⚠️ Información de Alergias</p>
          <p className="text-sm text-muted-foreground">
            Nuestros menús pueden contener: crustáceos, altramuces, pescado, huevo, moluscos, gluten, apio,
            frutos secos, leche, mostaza, sésamo, soja, sulfitos. Si padece alguna alergia o intolerancia
            es imprescindible comunicarlo al personal antes de realizar el pedido.
          </p>
        </div>
      </div>
    </div>
  );
}
