import { useState, useMemo, type CSSProperties, type ReactElement } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AllergenIcon } from "./AllergenIcon";
import { Plus, Trash2, Save, ChevronDown, Check, Eye, X, Printer } from "lucide-react";
import logoImg from "../../imports/logo-transparent.png";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MenuItem = { name: string; allergens: string[] };

type MenuCourse = {
  aperitivo: MenuItem;
  primeros: MenuItem[];
  segundos: MenuItem[];
  postres: MenuItem[];
};

type MenuVariant = {
  title: string;
  price: string;
  includes: string;
  isVeggie: boolean;
  course: MenuCourse;
};

export const ALL_ALLERGENS = [
  "Gluten", "Crustáceos", "Huevos", "Pescado", "Cacahuetes",
  "Soja", "Lácteos", "Frutos secos", "Apio", "Mostaza",
  "Sésamo", "Sulfitos", "Altramuces", "Moluscos",
];

const EMPTY_ITEM: MenuItem = { name: "", allergens: [] };
const ALLERGEN_ABBR: Record<string, string> = {
  Gluten: "Glu",
  Crustáceos: "Crus",
  Huevos: "Hue",
  Pescado: "Pesc",
  Cacahuetes: "Cac",
  Soja: "Soja",
  Lácteos: "Lac",
  "Frutos secos": "F. secos",
  Apio: "Apio",
  Mostaza: "Most",
  Sésamo: "Ses",
  Sulfitos: "Sulf",
  Altramuces: "Altr",
  Moluscos: "Mol",
};
const DEFAULT_DEGUSTATION = {
  title: "Menú Degustación de Temporada",
  price: "35,00 €",
  includes: "Con café 100% arábica natural",
  note: "Bodega aparte · Consultar carta de vinos · Incremento +1,00 € en terraza",
  sections: [
    { title: "De Temporada", items: [
      { name: "Mejillones en escabeche de mango, emulsión de coco & curry y perlas cítricas", allergens: ["Moluscos"] },
      { name: "Volandeiras en ceviche de padrón con contrapunto de manzana ácida", allergens: ["Moluscos"] },
    ] },
    { title: "Del Mar", items: [
      { name: "Bonito de Burela \"todo al rojo\"", allergens: ["Pescado", "Moluscos"] },
    ] },
    { title: "De la Tierra", items: [
      { name: "Lingote de cordero deshuesado, su demiglace y cromatismos naranjas", allergens: ["Lácteos", "Gluten"] },
    ] },
    { title: "Está de Dulce", items: [
      { name: "Mil hojas de Santiago", allergens: ["Lácteos", "Gluten", "Huevos"] },
    ] },
  ],
};

const pad2 = (arr: MenuItem[]): MenuItem[] => {
  const out = arr.length ? [...arr] : [];
  while (out.length < 2) out.push({ ...EMPTY_ITEM });
  return out;
};

const singleOption = (arr: MenuItem[] = []): MenuItem[] => [arr[0] ?? { ...EMPTY_ITEM }];

const courseOptions = (arr: MenuItem[] = [], isVeggie = false): MenuItem[] =>
  isVeggie ? singleOption(arr) : pad2(arr);

function printCurrentDocument(mode: "portrait" | "landscape") {
  const styleId = "menu-print-page-style";
  const rootId = "menu-print-only-root";
  document.getElementById(styleId)?.remove();
  document.getElementById(rootId)?.remove();

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = mode === "landscape"
    ? "@page { size: A4 landscape; margin: 10mm; }"
    : "@page { size: A4; margin: 14mm; }";
  document.head.appendChild(style);

  const printArea = document.querySelector(".print-area");
  const printRoot = document.createElement("div");
  printRoot.id = rootId;
  printRoot.className = "print-only-root";
  if (printArea) {
    printRoot.appendChild(printArea.cloneNode(true));
    document.body.appendChild(printRoot);
  }

  document.body.classList.toggle("printing-landscape", mode === "landscape");
  document.body.classList.toggle("printing-portrait", mode === "portrait");
  document.body.classList.toggle("printing-clean", Boolean(printArea));

  const cleanup = () => {
    document.body.classList.remove("printing-landscape", "printing-portrait", "printing-clean");
    document.getElementById(styleId)?.remove();
    document.getElementById(rootId)?.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });
}

function normalizeItems(items: any[] = []): MenuItem[] {
  const normalized = items.map((item) => ({
    name: typeof item === "string" ? item : item?.name ?? "",
    allergens: Array.isArray(item?.allergens) ? item.allergens : [],
  }));
  return normalized.length ? normalized : [{ ...EMPTY_ITEM }];
}

function normalizeDegustation(data: any) {
  const source = data && Object.keys(data).length ? data : DEFAULT_DEGUSTATION;
  const sections = Array.isArray(source.sections) && source.sections.length
    ? source.sections
    : DEFAULT_DEGUSTATION.sections;

  return {
    title: source.title || DEFAULT_DEGUSTATION.title,
    price: source.price || DEFAULT_DEGUSTATION.price,
    includes: source.includes || "",
    note: source.note || "",
    sections: sections.map((section: any, index: number) => ({
      title: section?.title || `Sección ${index + 1}`,
      items: normalizeItems(section?.items),
    })),
  };
}

function hasPrintableDegustation(degustation?: any) {
  return Boolean(
    degustation?.sections?.some((section: any) =>
      (section.items ?? []).some((item: any) => {
        const name = typeof item === "string" ? item : item?.name;
        return Boolean(name?.trim());
      })
    )
  );
}

// ─── Allergen Picker ───────────────────────────────────────────────────────────

function AllergenPicker({ selected, onChange }: { selected: string[]; onChange: (a: string[]) => void }) {
  const toggle = (a: string) =>
    onChange(selected.includes(a) ? selected.filter((x) => x !== a) : [...selected, a]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="h-8 gap-1.5 text-xs shrink-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Sin alérgenos</span>
          ) : (
            <span className="flex items-center gap-0.5">
              {selected.map((a) => <span key={a} title={a}><AllergenIcon allergen={a} size={16} /></span>)}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Alérgenos del plato
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_ALLERGENS.map((allergen) => {
            const active = selected.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                onClick={() => toggle(allergen)}
                className={[
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left border transition-colors",
                  active ? "bg-primary/10 border-primary/30 font-semibold" : "border-transparent hover:bg-muted",
                ].join(" ")}
              >
                <AllergenIcon allergen={allergen} size={20} />
                <span className="flex-1">{allergen}</span>
                {active && <Check className="h-3 w-3 text-primary" />}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <button type="button" className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-destructive" onClick={() => onChange([])}>
            Limpiar selección
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({ item, onChange, onRemove, placeholder = "Descripción del plato…", canRemove = false, num }: {
  item: MenuItem; onChange: (item: MenuItem) => void; onRemove?: () => void;
  placeholder?: string; canRemove?: boolean; num?: number;
}) {
  return (
    <div className="flex items-start gap-2 group">
      {num !== undefined && (
        <span className="text-xs font-bold text-muted-foreground mt-2.5 w-4 shrink-0">{num}.</span>
      )}
      <div className="flex-1 space-y-1.5 min-w-0">
        <Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder={placeholder} className="h-9 text-sm" />
        <div className="flex items-center gap-2">
          <AllergenPicker selected={item.allergens} onChange={(allergens) => onChange({ ...item, allergens })} />
          {canRemove && onRemove && (
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Course block ──────────────────────────────────────────────────────────────

function CourseBlock({ label, emoji, items, onChange, multi = true, placeholders = [] }: {
  label: string; emoji: string; items: MenuItem[]; onChange: (items: MenuItem[]) => void;
  multi?: boolean; placeholders?: string[];
}) {
  const update = (i: number, item: MenuItem) => { const n = [...items]; n[i] = item; onChange(n); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { ...EMPTY_ITEM }]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b">
        <span className="text-xl">{emoji}</span>
        <Label className="text-sm font-bold">{label}</Label>
      </div>
      <div className="space-y-3 pl-2">
        {items.map((item, i) => (
          <ItemRow key={i} item={item} onChange={(u) => update(i, u)} onRemove={() => remove(i)}
            canRemove={multi && items.length > 2} placeholder={placeholders[i] ?? `Opción ${i + 1}…`}
            num={multi ? i + 1 : undefined} />
        ))}
        {multi && (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={add}>
            <Plus className="h-3 w-3" /> Añadir opción extra
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Menu variant form ─────────────────────────────────────────────────────────

function MenuVariantForm({ variant, onChange }: { variant: MenuVariant; onChange: (v: MenuVariant) => void }) {
  const c = variant.course;
  const set = (patch: Partial<MenuCourse>) => onChange({ ...variant, course: { ...c, ...patch } });
  const isVeggie = variant.isVeggie;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nombre del menú</Label>
          <Input
            value={variant.title}
            onChange={(e) => onChange({ ...variant, title: e.target.value })}
            placeholder="Menú del Día"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Precio</Label>
          <Input value={variant.price} onChange={(e) => onChange({ ...variant, price: e.target.value })} placeholder="18,00 €" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Incluye</Label>
          <Input value={variant.includes} onChange={(e) => onChange({ ...variant, includes: e.target.value })} placeholder="Bebida, postre o café" className="h-9" />
        </div>
      </div>
      <hr />
      <CourseBlock label="Aperitivo" emoji="🥂" items={[c.aperitivo]}
        onChange={([item]) => set({ aperitivo: item ?? { ...EMPTY_ITEM } })} multi={false} placeholders={["Petisco de bienvenida…"]} />
      <CourseBlock
        label={isVeggie ? "1er Plato — 1 opción" : "1er Plato — 2 opciones a elegir"}
        emoji="🥗"
        items={isVeggie ? singleOption(c.primeros) : c.primeros}
        onChange={(primeros) => set({ primeros: courseOptions(primeros, isVeggie) })}
        multi={!isVeggie}
        placeholders={isVeggie ? ["Primer plato veggie…"] : ["Opción 1 — primer plato…", "Opción 2 — primer plato…"]}
      />
      <CourseBlock
        label={isVeggie ? "2do Plato — 1 opción" : "2do Plato — 2 opciones a elegir"}
        emoji="🍖"
        items={isVeggie ? singleOption(c.segundos) : c.segundos}
        onChange={(segundos) => set({ segundos: courseOptions(segundos, isVeggie) })}
        multi={!isVeggie}
        placeholders={isVeggie ? ["Segundo plato veggie…"] : ["Opción 1 — segundo plato…", "Opción 2 — segundo plato…"]}
      />
      <CourseBlock
        label={isVeggie ? "Postre — 1 opción" : "Postre — 2 opciones a elegir"}
        emoji="🍰"
        items={isVeggie ? singleOption(c.postres) : c.postres}
        onChange={(postres) => set({ postres: courseOptions(postres, isVeggie) })}
        multi={!isVeggie}
        placeholders={isVeggie ? ["Postre veggie…"] : ["Opción 1 — postre…", "Opción 2 — postre…"]}
      />
    </div>
  );
}

function DegustationEditor({ data, onChange }: { data: any; onChange: (data: any) => void }) {
  const set = (patch: Record<string, any>) => onChange({ ...data, ...patch });
  const sections = data.sections ?? [];

  const updateSection = (index: number, patch: Record<string, any>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...patch };
    set({ sections: updated });
  };

  const addSection = () => {
    set({
      sections: [
        ...sections,
        { title: `Sección ${sections.length + 1}`, items: [{ ...EMPTY_ITEM }] },
      ],
    });
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    set({ sections: sections.filter((_: any, sectionIndex: number) => sectionIndex !== index) });
  };

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">🍷 Menú Degustación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Título</Label>
            <Input
              value={data.title ?? ""}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Menú Degustación de Temporada"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Precio</Label>
            <Input
              value={data.price ?? ""}
              onChange={(e) => set({ price: e.target.value })}
              placeholder="35,00 €"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Incluye</Label>
            <Input
              value={data.includes ?? ""}
              onChange={(e) => set({ includes: e.target.value })}
              placeholder="Con café..."
              className="h-9"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nota al pie</Label>
            <Input
              value={data.note ?? ""}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="Bodega aparte · Consultar carta de vinos"
              className="h-9"
            />
          </div>
        </div>

        <hr />

        <div className="space-y-5">
          {sections.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex} className="rounded-md border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title ?? ""}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  placeholder={`Sección ${sectionIndex + 1}`}
                  className="h-9 font-semibold"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  disabled={sections.length <= 1}
                  onClick={() => removeSection(sectionIndex)}
                  title="Eliminar sección"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CourseBlock
                label={section.title || `Sección ${sectionIndex + 1}`}
                emoji="✦"
                items={normalizeItems(section.items)}
                onChange={(items) => updateSection(sectionIndex, { items })}
                placeholders={["Plato degustación...", "Siguiente pase..."]}
              />
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" className="gap-2" onClick={addSection}>
          <Plus className="h-4 w-4" /> Añadir sección
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Preview renderer ──────────────────────────────────────────────────────────

const SECTION_ICON: Record<string, string> = {
  aperitivo: "🥂", primero: "🥗", segundo: "🍖", postre: "🍰",
};

function getSectionIcon(title: string) {
  const t = title.toLowerCase();
  for (const [k, v] of Object.entries(SECTION_ICON)) if (t.includes(k)) return v;
  return "🍽️";
}

function getVariantSections(variant: MenuVariant, printable = false) {
  const postreTitle = printable ? "Postres a elegir" : "Postre (a elegir)";
  if (variant.isVeggie) {
    return [
      { title: "Aperitivo", items: [variant.course.aperitivo] },
      { title: "Primer plato", items: singleOption(variant.course.primeros) },
      { title: "Segundo plato", items: singleOption(variant.course.segundos) },
      { title: "Postre", items: singleOption(variant.course.postres) },
    ];
  }

  return [
    { title: "Aperitivo", items: [variant.course.aperitivo] },
    { title: printable ? "Primeros a elegir" : "Primeros (a elegir)", items: variant.course.primeros },
    { title: printable ? "Segundos a elegir" : "Segundos (a elegir)", items: variant.course.segundos },
    { title: postreTitle, items: variant.course.postres },
  ];
}

function PreviewItem({ item, compact }: { item: MenuItem; compact?: boolean }) {
  const shown = item.name.trim();
  if (!shown) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary mt-0.5 shrink-0">•</span>
      <div className="flex-1">
        <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground mb-1.5`}>{shown}</p>
        {item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.allergens.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full border text-xs">
                <AllergenIcon allergen={a} size={14} />
                <span className="font-medium">{a}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewVariant({ variant, compact }: { variant: MenuVariant; compact?: boolean }) {
  const sections = getVariantSections(variant);

  return (
    <div className={variant.isVeggie ? "p-5 bg-green-50 rounded-xl border border-green-200" : "p-5 bg-white rounded-xl border"}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          {variant.isVeggie ? "🌱" : "🍽️"} {variant.title}
        </h3>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">{variant.price}</p>
          {variant.includes && <p className="text-xs text-muted-foreground">{variant.includes}</p>}
        </div>
      </div>
      <div className={compact ? "space-y-4" : "space-y-5"}>
        {sections.map((s, si) => {
          const hasItems = s.items.some((it) => it.name.trim());
          if (!hasItems) return null;
          return (
            <div key={si}>
              <h4 className={`font-bold mb-2 flex items-center gap-2 ${compact ? "text-sm" : "text-base"} text-primary`}>
                <span>{getSectionIcon(s.title)}</span> {s.title}
              </h4>
              <div className={`space-y-2 ${compact ? "ml-6" : "ml-8"}`}>
                {s.items.map((item, ii) => <PreviewItem key={ii} item={item} compact={compact} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuPreviewDialog({ open, onClose, menus, title }: {
  open: boolean; onClose: () => void; menus: MenuVariant[]; title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Vista previa — {title}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Así es como verán los clientes el menú en la web
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Header mockup */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <p className="text-4xl mb-2">🍽️</p>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground text-sm mt-1">De lunes a viernes</p>
          </div>

          {/* Menu variants */}
          {menus.map((m, i) => (
            <PreviewVariant key={i} variant={m} compact={m.isVeggie} />
          ))}

          {/* Allergen notice */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <span className="font-bold">⚠️ Información de Alergias — </span>
            Si padece alguna alergia o intolerancia es imprescindible comunicarlo al personal antes de realizar el pedido.
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cerrar vista previa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type IngredientIllustrationKind =
  | "fish"
  | "octopus"
  | "shell"
  | "meat"
  | "chicken"
  | "vegetable"
  | "cheese"
  | "dessert"
  | "egg"
  | "leaf";

const INGREDIENT_KEYWORDS: Array<{ kind: IngredientIllustrationKind; words: string[] }> = [
  { kind: "octopus", words: ["pulpo", "calamar", "chipiron", "sepia", "molusco"] },
  { kind: "shell", words: ["vieira", "zamburina", "almeja", "mejillon", "ostra", "berberecho"] },
  { kind: "fish", words: ["atun", "bonito", "merluza", "salmon", "bacalao", "pescado", "lubina", "rodaballo", "sardina", "xurelo"] },
  { kind: "chicken", words: ["pollo", "gallina", "ave", "carnitas"] },
  { kind: "meat", words: ["buey", "ternera", "secreto", "cerdo", "jamon", "pork", "carne", "costilla", "solomillo"] },
  { kind: "vegetable", words: ["zanahoria", "brocol", "coliflor", "verdura", "vegano", "veggie", "hummus", "garbanzo", "seta", "calabacin"] },
  { kind: "cheese", words: ["queso", "cheddar", "parmesano", "lacteo", "cremoso"] },
  { kind: "egg", words: ["huevo", "tortilla"] },
  { kind: "dessert", words: ["postre", "tarta", "cheesecake", "flan", "chocolate", "limon", "semifrio", "bizcocho"] },
];

function normalizeIngredientText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectIngredientIllustration(name: string): IngredientIllustrationKind {
  const normalized = normalizeIngredientText(name);
  return INGREDIENT_KEYWORDS.find((group) => group.words.some((word) => normalized.includes(word)))?.kind ?? "leaf";
}

function IngredientIllustration({ name }: { name: string }) {
  const kind = detectIngredientIllustration(name);
  const common = {
    className: "ingredient-illustration-svg",
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  const drawings: Record<IngredientIllustrationKind, ReactElement> = {
    fish: (
      <svg {...common}>
        <path d="M8 32c9-12 25-15 39-6l9-8c-1 8-1 20 0 28l-9-8C33 47 17 44 8 32Z" />
        <path d="M20 32c4-4 10-6 17-5M20 32c4 4 10 6 17 5M14 32h.1" />
      </svg>
    ),
    octopus: (
      <svg {...common}>
        <path d="M20 25c0-8 5-14 12-14s12 6 12 14c0 6-3 11-8 13H28c-5-2-8-7-8-13Z" />
        <path d="M18 42c5-3 8-2 10 2 2-4 6-4 8 0 2-4 5-5 10-2M16 50c5-5 10-5 14 0M34 50c4-5 9-5 14 0M27 25h.1M37 25h.1" />
      </svg>
    ),
    shell: (
      <svg {...common}>
        <path d="M12 45c3-18 11-28 20-28s17 10 20 28H12Z" />
        <path d="M32 17v28M20 45c2-12 6-20 12-28M44 45c-2-12-6-20-12-28M15 38h34" />
      </svg>
    ),
    meat: (
      <svg {...common}>
        <path d="M18 37c-4-9 2-20 13-23 13-4 27 4 22 17-4 12-23 22-35 6Z" />
        <path d="M22 35c6 5 17 4 24-4M13 45l-5 6M18 49l-5 6" />
      </svg>
    ),
    chicken: (
      <svg {...common}>
        <path d="M16 39c2-13 11-21 24-18 11 3 15 14 8 22-7 9-26 9-32-4Z" />
        <path d="M43 24c4-8 12-8 14-1M49 29c5 0 8 4 7 9M22 42c-2 5-5 8-10 9" />
      </svg>
    ),
    vegetable: (
      <svg {...common}>
        <path d="M34 12c8 8 8 18 0 30-8-12-8-22 0-30Z" />
        <path d="M34 42c-10-3-17-10-20-22 12 2 19 9 20 22ZM34 42c10-3 17-10 20-22-12 2-19 9-20 22ZM34 42v12" />
      </svg>
    ),
    cheese: (
      <svg {...common}>
        <path d="M12 42 44 18l8 8v20H12v-4Z" />
        <path d="M20 41h.1M31 36h.1M42 43h.1M44 18v28" />
      </svg>
    ),
    dessert: (
      <svg {...common}>
        <path d="M14 43h36l-4 8H18l-4-8Z" />
        <path d="M18 43c2-11 8-18 14-18s12 7 14 18M25 25c0-7 3-12 7-12s7 5 7 12" />
      </svg>
    ),
    egg: (
      <svg {...common}>
        <path d="M18 38c0-13 7-27 14-27s14 14 14 27c0 9-6 15-14 15s-14-6-14-15Z" />
        <path d="M27 39c0-4 2-7 5-7s5 3 5 7-2 6-5 6-5-2-5-6Z" />
      </svg>
    ),
    leaf: (
      <svg {...common}>
        <path d="M14 43c3-18 18-27 36-27-1 18-11 32-29 34" />
        <path d="M18 48c9-11 19-19 31-30M29 37l-10-2M37 29l-2-10" />
      </svg>
    ),
  };

  return drawings[kind];
}

function PrintableItem({ item }: { item: MenuItem }) {
  const shown = item.name.trim();
  if (!shown) return null;

  return (
    <li className="print-menu-item">
      <span className="print-ingredient-illustration">
        <IngredientIllustration name={shown} />
      </span>
      <span className="print-menu-item-name">{shown}</span>
      {item.allergens.length > 0 && (
        <span className="print-allergens">
          <span className="print-allergen-abbr">
            ({item.allergens.map((allergen) => ALLERGEN_ABBR[allergen] || allergen).join(", ")})
          </span>
          <span className="print-allergen-icons">
            {item.allergens.map((allergen) => (
              <span key={allergen} title={allergen}>
                <AllergenIcon allergen={allergen} size={22} />
              </span>
            ))}
          </span>
        </span>
      )}
    </li>
  );
}

function PrintableVariant({ variant }: { variant: MenuVariant }) {
  const sections = getVariantSections(variant, true)
    .filter((section) => section.items.some((item) => item.name.trim()));

  return (
    <section className={`print-menu-variant${variant.isVeggie ? " print-menu-variant-veggie" : ""}`}>
      <header className="print-menu-variant-header">
        <div>
          <h3>{variant.title}</h3>
        </div>
      </header>
      <div className="print-menu-sections">
        {sections.map((section) => {
          const isDessertChoice = !variant.isVeggie && section.title.toLowerCase().includes("postre");

          return (
          <div
            key={section.title}
            className={`print-menu-section${isDessertChoice ? " print-menu-section-desserts" : ""}`}
          >
            <h4>{section.title}</h4>
            <ul>
              {section.items.map((item, index) => (
                <PrintableItem key={index} item={item} />
              ))}
            </ul>
          </div>
          );
        })}
      </div>
      {(variant.includes || variant.price) && (
        <div className="print-menu-price-block">
          {variant.includes && <p className="print-menu-includes">{variant.includes}</p>}
          {variant.price && <strong className="print-menu-price">{variant.price}</strong>}
        </div>
      )}
      {variant.isVeggie && <img className="print-menu-veggie-bottom-logo" src={logoImg} alt="El Cafetín" />}
    </section>
  );
}

function PrintableDegustation({ degustation }: { degustation?: any }) {
  if (!hasPrintableDegustation(degustation)) return null;

  const sections = degustation.sections
    .map((section: any) => ({
      ...section,
      items: (section.items ?? []).filter((item: any) => {
        const name = typeof item === "string" ? item : item?.name;
        return Boolean(name?.trim());
      }),
    }))
    .filter((section: any) => section.items.length);

  return (
    <section className="print-menu-variant">
      <header className="print-menu-variant-header">
        <div>
          <h3>{degustation.title || "Menú Degustación de Temporada"}</h3>
          {degustation.includes && <p>{degustation.includes}</p>}
        </div>
      </header>
      <div className="print-menu-sections">
        {sections.map((section: any, sectionIndex: number) => (
          <div key={`${section.title}-${sectionIndex}`} className="print-menu-section">
            <h4>{section.title}</h4>
            <ul>
              {(section.items ?? []).map((item: any, itemIndex: number) => (
                <PrintableItem
                  key={itemIndex}
                  item={{
                    name: typeof item === "string" ? item : item.name || "",
                    allergens: Array.isArray(item?.allergens) ? item.allergens : [],
                  }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {degustation.price && <strong className="print-menu-price">{degustation.price}</strong>}
      {degustation.note && <p className="print-menu-note">{degustation.note}</p>}
    </section>
  );
}

function getPrintableAllergens(menus: MenuVariant[], degustation?: any) {
  const seen = new Set<string>();
  const add = (item: MenuItem) => item.allergens.forEach((allergen) => seen.add(allergen));

  menus.forEach((menu) => {
    add(menu.course.aperitivo);
    menu.course.primeros.forEach(add);
    menu.course.segundos.forEach(add);
    menu.course.postres.forEach(add);
  });

  degustation?.sections?.forEach((section: any) => {
    (section.items ?? []).forEach((item: any) => {
      const allergens = Array.isArray(item?.allergens) ? item.allergens : [];
      allergens.forEach((allergen: string) => seen.add(allergen));
    });
  });

  return ALL_ALLERGENS.filter((allergen) => seen.has(allergen));
}

function PrintableMenuDialog({ open, onClose, menus, title, subtitle, degustation }: {
  open: boolean;
  onClose: () => void;
  menus: MenuVariant[];
  title: string;
  subtitle: string;
  degustation?: any;
}) {
  const printDate = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const print = () => {
    printCurrentDocument("portrait");
  };
  const allergens = getPrintableAllergens(menus, degustation);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[96vw] max-w-7xl max-h-[94vh] overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Formato imprimible — {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Vista preparada para A4. Puedes imprimirla o guardarla como PDF desde el navegador.
          </p>
        </DialogHeader>

        <div className="print-preview-frame">
          <div className="print-area bg-white text-neutral-950 rounded-md border p-8 shadow-sm">
            <div className="print-menu-document">
            <header className="print-menu-header">
              <img className="print-menu-logo" src={logoImg} alt="El Cafetín" />
              <p>Oferta gastronómica</p>
              <h2>{title}</h2>
              <div>
                <span>{subtitle}</span>
                <span>{printDate}</span>
              </div>
            </header>

            <main className="print-menu-body">
              {menus.map((menu, index) => (
                <PrintableVariant key={index} variant={menu} />
              ))}
              <PrintableDegustation degustation={degustation} />
            </main>

            <footer className="print-menu-footer">
              {allergens.length > 0 && (
                <div className="print-allergen-legend">
                  {allergens.map((allergen) => (
                    <span key={allergen} className="print-allergen-legend-item">
                      <AllergenIcon allergen={allergen} size={22} />
                      <span>{allergen}</span>
                    </span>
                  ))}
                </div>
              )}
              <p>
                Si padece alguna alergia o intolerancia, comuníquelo al personal antes de realizar el pedido.
              </p>
            </footer>
            </div>
          </div>
        </div>

        <div className="print:hidden flex flex-col sm:flex-row gap-2 pt-3 border-t bg-background">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cerrar
          </Button>
          <Button className="flex-1 gap-2" onClick={print}>
            <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HorizontalDocumentDialog({ open, onClose, weekdayMenus, weekendMenus, degustation }: {
  open: boolean;
  onClose: () => void;
  weekdayMenus?: MenuVariant[];
  weekendMenus?: MenuVariant[];
  degustation?: any;
}) {
  const printDate = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const columns = [
    ...(weekdayMenus?.map((menu) => ({
      type: "variant" as const,
      menu,
      group: menu.title || (menu.isVeggie ? "Menú Veggie" : "Menú del Día"),
    })) ?? []),
    ...(weekendMenus?.map((menu) => ({
      type: "variant" as const,
      menu,
      group: menu.title || "Menú Fin de Semana",
    })) ?? []),
    ...(hasPrintableDegustation(degustation) ? [{
      type: "degustation" as const,
      degustation,
      group: degustation?.title || "Menú Degustación",
    }] : []),
  ];
  const isWeekendDocument = Boolean(weekendMenus?.length);
  const documentTitle = isWeekendDocument ? "Menú fin de semana" : "Menú del día";
  const documentKicker = isWeekendDocument ? "Especial sábado" : "Cocina en movimiento";

  const print = () => {
    printCurrentDocument("landscape");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[98vw] max-w-[1500px] max-h-[94vh] overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Imprimir
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Vista general con todos los menús en columnas para revisar, imprimir o guardar como PDF.
          </p>
        </DialogHeader>

        <div className="print-preview-frame print-preview-frame-landscape">
          <div className="print-area print-landscape bg-white text-neutral-950 rounded-md border p-6 shadow-sm">
            <div className="print-menu-document print-menu-document-landscape print-editorial-menu-document">
            <header className="print-menu-header print-menu-header-landscape">
              <img className="print-menu-logo" src={logoImg} alt="El Cafetín" />
              <p>Oferta gastronómica</p>
            </header>
            <div className="print-editorial-heading">
              <div>
                <h2>{documentTitle}</h2>
                <p>{documentKicker}</p>
              </div>
            </div>
            <img className="print-menu-watermark" src={logoImg} alt="" aria-hidden="true" />

            <main
              className={`print-menu-horizontal${columns.length >= 3 ? " print-menu-horizontal-three" : ""}`}
              data-column-count={columns.length}
              style={{ "--print-menu-column-count": columns.length } as CSSProperties}
            >
              {columns.map((column, index) => (
                <div key={index} className="print-menu-column">
                  <p className="print-menu-column-label">{column.group}</p>
                  {column.type === "variant" ? (
                    <PrintableVariant variant={column.menu} />
                  ) : (
                    <PrintableDegustation degustation={column.degustation} />
                  )}
                </div>
              ))}
            </main>

            <footer className="print-menu-footer">
              <div className="print-editorial-footer-grid">
                <span className="print-poster-brand">
                  <img src={logoImg} alt="El Cafetín Pontevedra" />
                </span>
                <span className="print-poster-reserve"><em>Reserva tu mesa</em> 986 84 78 74</span>
                <span className="print-poster-social">@elcafetinpontevedra · El Cafetín Pontevedra</span>
              </div>
            </footer>
            </div>
          </div>
        </div>

        <div className="print:hidden flex flex-col sm:flex-row gap-2 pt-3 border-t bg-background">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cerrar
          </Button>
          <Button className="flex-1 gap-2" onClick={print}>
            <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Data conversion ───────────────────────────────────────────────────────────

function rawToVariant(raw: any): MenuVariant {
  if (raw.course) {
    const isVeggie = raw.isVeggie ?? false;
    return {
      title: raw.title ?? "", price: raw.price ?? "", includes: raw.includes ?? "", isVeggie,
      course: {
        aperitivo: raw.course.aperitivo ?? { ...EMPTY_ITEM },
        primeros: courseOptions(raw.course.primeros ?? [], isVeggie),
        segundos: courseOptions(raw.course.segundos ?? [], isVeggie),
        postres: courseOptions(raw.course.postres ?? [], isVeggie),
      },
    };
  }
  const sections: any[] = raw.sections ?? [];
  const find = (keys: string[]) => sections.find((s) => keys.some((k) => (s.title ?? "").toLowerCase().includes(k)));
  const toItems = (s: any): MenuItem[] =>
    (s?.items ?? []).map((it: any) => ({
      name: typeof it === "string" ? it : (it.name ?? ""),
      allergens: Array.isArray(it?.allergens) ? it.allergens : [],
    }));
  const isVeggie = raw.isVeggie ?? false;
  return {
    title: raw.title ?? "", price: raw.price ?? "", includes: raw.includes ?? "", isVeggie,
    course: {
      aperitivo: toItems(find(["aperitivo"]))[0] ?? { ...EMPTY_ITEM },
      primeros: courseOptions(toItems(find(["primer", "primero", "primeros"])), isVeggie),
      segundos: courseOptions(toItems(find(["segundo", "segundos"])), isVeggie),
      postres: courseOptions(toItems(find(["postre"])), isVeggie),
    },
  };
}

function variantToRaw(v: MenuVariant): any {
  const c = v.course;
  const items = (arr: MenuItem[]) => v.isVeggie ? singleOption(arr) : arr;
  return {
    title: v.title, price: v.price, includes: v.includes, isVeggie: v.isVeggie,
    sections: [
      { title: "Aperitivo", items: [c.aperitivo] },
      { title: v.isVeggie ? "Primero" : "Primeros (a elegir)", items: items(c.primeros) },
      { title: v.isVeggie ? "Segundo" : "Segundos (a elegir)", items: items(c.segundos) },
      { title: v.isVeggie ? "Postre" : "Postre (a elegir)", items: items(c.postres) },
    ],
  };
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={["flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:border-primary/40"].join(" ")}>
      {children}
    </button>
  );
}

function ActionRow({ saving, saved, publishLabel, onPreview, onHorizontalPreview, onSave }: {
  saving: boolean; saved: boolean; publishLabel: string; onPreview: () => void; onHorizontalPreview: () => void; onSave: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Button type="button" variant="outline" size="lg" className="gap-2" onClick={onPreview}>
        <Eye className="h-4 w-4" /> Vista previa
      </Button>
      <Button type="button" variant="outline" size="lg" className="gap-2" onClick={onHorizontalPreview}>
        <Printer className="h-4 w-4" /> Imprimir
      </Button>
      <Button type="button" size="lg" className="gap-2" disabled={saving} onClick={onSave}>
        <Save className="h-4 w-4" />
        {saving ? "Publicando…" : saved ? "✓ Publicado" : publishLabel}
      </Button>
    </div>
  );
}

// ─── Weekday Menu Editor ───────────────────────────────────────────────────────

export function WeekdayMenuEditor({ data, onSave }: {
  data: any;
  onSave: (data: any) => Promise<void>;
}) {
  const [menus, setMenus] = useState<MenuVariant[]>(() => (data?.menus ?? []).map(rawToVariant));
  const [deg, setDeg] = useState<any>(() => normalizeDegustation(data?.degustation));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [horizontalOpen, setHorizontalOpen] = useState(false);

  const tabs = useMemo(() => [
    ...menus.map((m, i) => ({ label: `${m.isVeggie ? "🌱 " : "🍽️ "}${m.title}`, menuIdx: i, isDeg: false })),
    { label: "🍷 Degustación", menuIdx: -1, isDeg: true },
  ], [menus]);

  const activeTab = tabs[active] ?? tabs[0];

  const update = (i: number, v: MenuVariant) => { setMenus((prev) => { const n = [...prev]; n[i] = v; return n; }); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try { await onSave({ menus: menus.map(variantToRaw), degustation: deg }); setSaved(true); setTimeout(() => setSaved(false), 4000); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => <TabBtn key={i} active={active === i} onClick={() => setActive(i)}>{t.label}</TabBtn>)}
      </div>

      {!activeTab.isDeg && activeTab.menuIdx >= 0 && menus[activeTab.menuIdx] && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {menus[activeTab.menuIdx].isVeggie ? "🌱" : "🍽️"} {menus[activeTab.menuIdx].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MenuVariantForm variant={menus[activeTab.menuIdx]} onChange={(v) => update(activeTab.menuIdx, v)} />
          </CardContent>
        </Card>
      )}

      {activeTab.isDeg && (
        <DegustationEditor
          data={deg}
          onChange={(updated) => {
            setDeg(updated);
            setSaved(false);
          }}
        />
      )}

      <ActionRow
        saving={saving}
        saved={saved}
        publishLabel="Guardar y Publicar"
        onPreview={() => setPreview(true)}
        onHorizontalPreview={() => setHorizontalOpen(true)}
        onSave={save}
      />

      <MenuPreviewDialog open={preview} onClose={() => setPreview(false)} menus={menus} title="Menú del Día" />
      <HorizontalDocumentDialog
        open={horizontalOpen}
        onClose={() => setHorizontalOpen(false)}
        weekdayMenus={menus}
        degustation={deg}
      />
    </div>
  );
}

// ─── Weekend Menu Editor ───────────────────────────────────────────────────────

export function WeekendMenuEditor({ data, onSave }: {
  data: any;
  onSave: (data: any) => Promise<void>;
}) {
  const [menus, setMenus] = useState<MenuVariant[]>(() => (data?.menus ?? []).map(rawToVariant));
  const [deg, setDeg] = useState<any>(() => normalizeDegustation(data?.degustation));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [horizontalOpen, setHorizontalOpen] = useState(false);

  const tabs = useMemo(() => [
    ...menus.map((m, i) => ({ label: `${m.isVeggie ? "🌱 " : "🍽️ "}${m.title}`, menuIdx: i, isDeg: false })),
    { label: "🍷 Degustación", menuIdx: -1, isDeg: true },
  ], [menus]);

  const activeTab = tabs[active] ?? tabs[0];

  const update = (i: number, v: MenuVariant) => { setMenus((prev) => { const n = [...prev]; n[i] = v; return n; }); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try { await onSave({ menus: menus.map(variantToRaw), degustation: deg }); setSaved(true); setTimeout(() => setSaved(false), 4000); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => <TabBtn key={i} active={active === i} onClick={() => setActive(i)}>{t.label}</TabBtn>)}
      </div>

      {!activeTab.isDeg && activeTab.menuIdx >= 0 && menus[activeTab.menuIdx] && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {menus[activeTab.menuIdx].isVeggie ? "🌱" : "🍽️"} {menus[activeTab.menuIdx].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MenuVariantForm variant={menus[activeTab.menuIdx]} onChange={(v) => update(activeTab.menuIdx, v)} />
          </CardContent>
        </Card>
      )}

      {activeTab.isDeg && (
        <DegustationEditor
          data={deg}
          onChange={(updated) => {
            setDeg(updated);
            setSaved(false);
          }}
        />
      )}

      <ActionRow
        saving={saving}
        saved={saved}
        publishLabel="Guardar y Publicar"
        onPreview={() => setPreview(true)}
        onHorizontalPreview={() => setHorizontalOpen(true)}
        onSave={save}
      />

      <MenuPreviewDialog open={preview} onClose={() => setPreview(false)} menus={menus} title="Menú de Fin de Semana" />
      <HorizontalDocumentDialog
        open={horizontalOpen}
        onClose={() => setHorizontalOpen(false)}
        weekendMenus={menus}
        degustation={deg}
      />
    </div>
  );
}

// ─── Gastroteca Special Menu Editor ───────────────────────────────────────────

type GastrotecaItem = MenuItem & { price?: string };
type GastrotecaMenu = {
  title: string;
  price: string;
  includes: string;
  items: GastrotecaItem[];
  dessert: GastrotecaItem;
};

const EMPTY_GASTROTECA_ITEM: GastrotecaItem = { name: "", allergens: [], price: "" };

function normalizeGastrotecaItem(item: any): GastrotecaItem {
  return {
    name: typeof item === "string" ? item : item?.name ?? "",
    allergens: Array.isArray(item?.allergens) ? item.allergens : [],
    price: item?.price ?? "",
  };
}

function normalizeGastrotecaMenus(data: any): GastrotecaMenu[] {
  const sourceMenus = Array.isArray(data?.menus) && data.menus.length
    ? data.menus
    : [{
        title: "Menú Especial Gastroteca",
        price: "35,00 €",
        includes: "Disponible de jueves a sábado · Platos disponibles por separado",
        sections: [
          { title: "Platos", items: [{ ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }] },
          { title: "Postre", items: [{ ...EMPTY_GASTROTECA_ITEM }] },
        ],
      }];

  return sourceMenus.map((menu: any) => {
    const sections = Array.isArray(menu?.sections) ? menu.sections : [];
    const platos = sections.find((section: any) => String(section?.title ?? "").toLowerCase().includes("plato"))?.items
      ?? sections.flatMap((section: any) => section?.title !== "Postre" ? (section?.items ?? []) : []);
    const postres = sections.find((section: any) => String(section?.title ?? "").toLowerCase().includes("postre"))?.items ?? [];
    const items = platos.map(normalizeGastrotecaItem).slice(0, 4);
    while (items.length < 4) items.push({ ...EMPTY_GASTROTECA_ITEM });

    return {
      title: menu?.title ?? "Menú Especial Gastroteca",
      price: menu?.price ?? "35,00 €",
      includes: menu?.includes ?? "Disponible de jueves a sábado · Platos disponibles por separado",
      items,
      dessert: normalizeGastrotecaItem(postres[0] ?? { ...EMPTY_GASTROTECA_ITEM }),
    };
  });
}

function gastrotecaToRaw(menu: GastrotecaMenu) {
  return {
    title: menu.title,
    price: menu.price,
    includes: menu.includes,
    isVeggie: false,
    serviceDays: "jueves-sabado",
    separateOrdering: true,
    sections: [
      { title: "Platos", items: menu.items },
      { title: "Postre", items: [menu.dessert] },
    ],
  };
}

function GastrotecaItemRow({ label, item, onChange }: {
  label: string;
  item: GastrotecaItem;
  onChange: (item: GastrotecaItem) => void;
}) {
  return (
    <div className="grid gap-3 rounded-md bg-muted/30 p-3 md:grid-cols-[110px_1fr_120px_auto] md:items-end">
      <div className="text-sm font-semibold text-primary md:pb-2">{label}</div>
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input
          value={item.name}
          onChange={(event) => onChange({ ...item, name: event.target.value })}
          placeholder={`${label} de la Gastroteca`}
        />
      </div>
      <div className="space-y-2">
        <Label>Precio separado</Label>
        <Input
          value={item.price || ""}
          onChange={(event) => onChange({ ...item, price: event.target.value })}
          placeholder="12,00 €"
        />
      </div>
      <div className="space-y-2">
        <Label>Alérgenos</Label>
        <AllergenPicker selected={item.allergens} onChange={(allergens) => onChange({ ...item, allergens })} />
      </div>
    </div>
  );
}

function getGastrotecaAllergens(menus: GastrotecaMenu[]) {
  const seen = new Set<string>();
  menus.forEach((menu) => {
    [...menu.items, menu.dessert].forEach((item) => {
      item.allergens.forEach((allergen) => seen.add(allergen));
    });
  });
  return ALL_ALLERGENS.filter((allergen) => seen.has(allergen));
}

function PrintableGastrotecaDialog({ open, onClose, menus }: {
  open: boolean;
  onClose: () => void;
  menus: GastrotecaMenu[];
}) {
  const printDate = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const allergens = getGastrotecaAllergens(menus);
  const print = () => printCurrentDocument("landscape");
  const columnCount = Math.min(Math.max(menus.length, 1), 2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[98vw] max-w-[1500px] max-h-[94vh] overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Formato imprimible — Gastroteca
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Menú de 4 platos y postre, con precios individuales para pedir por separado.
          </p>
        </DialogHeader>

        <div className="print-preview-frame print-preview-frame-landscape">
          <div className="print-area print-area-landscape-preview bg-white text-neutral-950 rounded-md border p-8 shadow-sm">
            <div
              className="print-menu-document print-menu-document-landscape print-gastroteca-document"
              style={{ "--print-menu-column-count": columnCount } as CSSProperties}
            >
            <header className="print-menu-header">
              <img className="print-menu-logo" src={logoImg} alt="El Cafetín" />
              <p>Oferta gastronómica</p>
              <h2>Gastroteca</h2>
              <div>
                <span>Jueves a sábado</span>
                <span>{printDate}</span>
              </div>
            </header>

            <main className="print-menu-body print-gastroteca-body">
              {menus.map((menu, index) => (
                <section key={index} className="print-menu-variant print-gastroteca-variant">
                  <header className="print-menu-variant-header">
                    <div>
                      <h3>{menu.title}</h3>
                      {menu.includes && <p>{menu.includes}</p>}
                    </div>
                  </header>

                  <div className="print-menu-section">
                    <h4>4 platos</h4>
                    <ul className="print-gastroteca-list">
                      {menu.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="print-menu-item print-gastroteca-item">
                          <span className="print-ingredient-illustration">
                            <IngredientIllustration name={item.name || "plato"} />
                          </span>
                          <span className="print-menu-item-name">
                            <strong>Plato {itemIndex + 1}.</strong> {item.name || "Sin definir"}
                          </span>
                          {item.price && <span className="print-gastroteca-item-price">{item.price}</span>}
                          {item.allergens.length > 0 && (
                            <span className="print-allergens">
                              <span className="print-allergen-icons">
                                {item.allergens.map((allergen) => (
                                  <span key={allergen} title={allergen}>
                                    <AllergenIcon allergen={allergen} size={22} />
                                  </span>
                                ))}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="print-menu-section">
                    <h4>Postre</h4>
                    <ul className="print-gastroteca-list">
                      <li className="print-menu-item print-gastroteca-item">
                        <span className="print-ingredient-illustration">
                          <IngredientIllustration name={menu.dessert.name || "postre"} />
                        </span>
                        <span className="print-menu-item-name">{menu.dessert.name || "Sin definir"}</span>
                        {menu.dessert.price && <span className="print-gastroteca-item-price">{menu.dessert.price}</span>}
                        {menu.dessert.allergens.length > 0 && (
                          <span className="print-allergens">
                            <span className="print-allergen-icons">
                              {menu.dessert.allergens.map((allergen) => (
                                <span key={allergen} title={allergen}>
                                  <AllergenIcon allergen={allergen} size={22} />
                                </span>
                              ))}
                            </span>
                          </span>
                        )}
                      </li>
                    </ul>
                  </div>

                  {menu.price && <strong className="print-menu-price">{menu.price}</strong>}
                </section>
              ))}
            </main>

            <footer className="print-menu-footer">
              {allergens.length > 0 && (
                <div className="print-allergen-legend">
                  {allergens.map((allergen) => (
                    <span key={allergen} className="print-allergen-legend-item">
                      <AllergenIcon allergen={allergen} size={22} />
                      <span>{allergen}</span>
                    </span>
                  ))}
                </div>
              )}
              <p>
                Si padece alguna alergia o intolerancia, comuníquelo al personal antes de realizar el pedido.
              </p>
            </footer>
            </div>
          </div>
        </div>

        <div className="print:hidden flex flex-col sm:flex-row gap-2 pt-3 border-t bg-background">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cerrar
          </Button>
          <Button className="flex-1 gap-2" onClick={print}>
            <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GastrotecaMenuEditor({ data, onSave }: {
  data: any;
  onSave: (data: any) => Promise<void>;
}) {
  const [menus, setMenus] = useState<GastrotecaMenu[]>(() => normalizeGastrotecaMenus(data));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const tabs = useMemo(() => [
    ...menus.map((m, i) => ({ label: `🍷 ${m.title || `Menú ${i + 1}`}`, menuIdx: i })),
  ], [menus]);

  const activeTab = tabs[active] ?? tabs[0];

  const update = (i: number, v: GastrotecaMenu) => {
    setMenus((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
    setSaved(false);
  };

  const addMenu = () => {
    setMenus((prev) => [
      ...prev,
      {
        title: "Menú Especial Gastroteca",
        price: "35,00 €",
        includes: "Disponible de jueves a sábado · Platos disponibles por separado",
        items: [{ ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }, { ...EMPTY_GASTROTECA_ITEM }],
        dessert: { ...EMPTY_GASTROTECA_ITEM },
      },
    ]);
    setActive(menus.length);
    setSaved(false);
  };

  const removeMenu = (index: number) => {
    setMenus((prev) => prev.filter((_, i) => i !== index));
    setActive((current) => Math.max(0, Math.min(current, menus.length - 2)));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ menus: menus.map(gastrotecaToRaw) });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <TabBtn key={i} active={active === i} onClick={() => setActive(i)}>
            {t.label}
          </TabBtn>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addMenu}>
          <Plus className="h-4 w-4" /> Añadir menú
        </Button>
      </div>

      {activeTab && menus[activeTab.menuIdx] && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">🍷 {menus[activeTab.menuIdx].title}</CardTitle>
              {menus.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMenu(activeTab.menuIdx)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={menus[activeTab.menuIdx].title}
                    onChange={(event) => update(activeTab.menuIdx, { ...menus[activeTab.menuIdx], title: event.target.value })}
                    placeholder="Menú Especial Gastroteca"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio del menú completo</Label>
                  <Input
                    value={menus[activeTab.menuIdx].price}
                    onChange={(event) => update(activeTab.menuIdx, { ...menus[activeTab.menuIdx], price: event.target.value })}
                    placeholder="35,00 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incluye / nota</Label>
                  <Input
                    value={menus[activeTab.menuIdx].includes}
                    onChange={(event) => update(activeTab.menuIdx, { ...menus[activeTab.menuIdx], includes: event.target.value })}
                    placeholder="Disponible de jueves a sábado"
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-primary">4 platos</h3>
                  <p className="text-sm text-muted-foreground">Cada plato puede tener precio individual para pedirlo por separado.</p>
                </div>
                {menus[activeTab.menuIdx].items.map((item, itemIndex) => (
                  <GastrotecaItemRow
                    key={itemIndex}
                    label={`Plato ${itemIndex + 1}`}
                    item={item}
                    onChange={(updated) => {
                      const items = [...menus[activeTab.menuIdx].items];
                      items[itemIndex] = updated;
                      update(activeTab.menuIdx, { ...menus[activeTab.menuIdx], items });
                    }}
                  />
                ))}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-primary">Postre</h3>
                <GastrotecaItemRow
                  label="Postre"
                  item={menus[activeTab.menuIdx].dessert}
                  onChange={(dessert) => update(activeTab.menuIdx, { ...menus[activeTab.menuIdx], dessert })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end flex-wrap">
        <Button type="button" variant="outline" size="lg" className="gap-2" onClick={() => setPreview(true)}>
          <Eye className="h-4 w-4" /> Vista previa
        </Button>
        <Button type="button" variant="outline" size="lg" className="gap-2" onClick={() => setPrintOpen(true)}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
        <Button type="button" size="lg" className="gap-2" disabled={saving} onClick={save}>
          <Save className="h-4 w-4" />
          {saving ? "Publicando…" : saved ? "✓ Publicado" : "Guardar y Publicar"}
        </Button>
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menús Especiales Gastroteca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {menus.map((menu, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-primary">{menu.title}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{menu.price}</p>
                  <p className="text-sm text-muted-foreground">{menu.includes}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...menu.items, menu.dessert].map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between gap-4 border-b last:border-b-0 pb-2">
                      <div>
                        <p className="font-medium">{itemIndex < 4 ? `Plato ${itemIndex + 1}` : "Postre"} · {item.name || "Sin definir"}</p>
                        {item.allergens.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {item.allergens.map((allergen) => <AllergenIcon key={allergen} allergen={allergen} size={18} />)}
                          </div>
                        )}
                      </div>
                      {item.price && <span className="font-bold text-primary whitespace-nowrap">{item.price}</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <PrintableGastrotecaDialog open={printOpen} onClose={() => setPrintOpen(false)} menus={menus} />
    </div>
  );
}
