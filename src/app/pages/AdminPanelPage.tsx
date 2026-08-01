import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { recognize } from "tesseract.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  CalendarIcon, Search, Filter, Users, CheckCircle, XCircle,
  ShieldCheck, RefreshCw, Trash2, MessageSquare, Plus, BadgeCheck, UserSearch, Bell, UtensilsCrossed, History, Wine,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Camera,
} from "lucide-react";
import { GastrotecaMenuEditor, WeekdayMenuEditor, WeekendMenuEditor } from "../components/MenuEditor";
import { AllergenIcon } from "../components/AllergenIcon";
import { DEFAULT_BEVERAGES, beverageTitleWithEmoji, normalizeBeverageData, type BeverageData, type BeverageItem, type BeverageSection } from "../data/beverages";
import { DEFAULT_GENERAL_MENU, normalizeGeneralMenuData, type GeneralMenuData, type GeneralMenuItem, type GeneralMenuSection } from "../data/general-menu";
import { DEFAULT_BREAKFAST_MENU, normalizeBreakfastMenuData, type BreakfastMenuData } from "../data/breakfast-menu";
import { DEFAULT_WINE_LIST, normalizeWineListData, type WineGroup, type WineItem, type WineListData, type WineSection } from "../data/wine-list";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { api, getSupabase } from "../../utils/supabase-client";

type ClientUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  created_at: string;
};

type Reservation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: string | number;
  zone: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  comments?: string;
  table_ids?: string[];
  assigned_capacity?: number;
  created_at?: string;
};

const ZONE_LABELS: Record<string, string> = {
  terraza: "GastroGarden",
  interior: "Bistro",
  cafeteria: "Cafetería",
};

const ZONE_COLOR_STYLES: Record<string, string> = {
  terraza: "bg-emerald-100 text-emerald-900 border-emerald-300",
  interior: "bg-amber-100 text-amber-900 border-amber-300",
  cafeteria: "bg-sky-100 text-sky-900 border-sky-300",
};

const RESERVABLE_ZONES = ["interior", "cafeteria", "terraza"] as const;

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  completed: "Completada",
};

const TIME_SLOTS = [
  "13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15",
  "20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45","22:00","22:15","22:30","22:45",
];

const ADMIN_ZONE_CAPACITIES: Record<string, number> = {
  interior: 40,
  cafeteria: 28,
  terraza: 60,
};

const ADMIN_ZONE_TABLES: Record<string, { id: string; seats: number }[]> = {
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

const LUNCH_CALENDAR_SLOTS = [
  "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00", "15:15",
];
const DINNER_CALENDAR_SLOTS = [
  "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45", "22:00", "22:15", "22:30", "22:45",
];

function getCalendarTurn(time: string) {
  const totalMinutes = timeToMinutes(time);
  if (totalMinutes >= 13 * 60 && totalMinutes <= 15 * 60 + 15) return "lunch";
  if (totalMinutes >= 20 * 60 && totalMinutes <= 22 * 60 + 45) return "dinner";
  return "other";
}

function getReservationZoneLabel(reservation: Pick<Reservation, "zone" | "time">) {
  if (reservation.zone === "interior" && getCalendarTurn(reservation.time) === "dinner") {
    return "Gastroteca";
  }
  return ZONE_LABELS[reservation.zone] || reservation.zone;
}

const RESERVATION_DURATION_MINUTES = 120;

function timeToMinutes(time?: string) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function reservationOverlapsSlot(reservation: Reservation, slot: string) {
  const slotStart = timeToMinutes(slot);
  const reservationStart = timeToMinutes(reservation.time);
  const reservationEnd = reservationStart + RESERVATION_DURATION_MINUTES;
  return slotStart >= reservationStart && slotStart < reservationEnd;
}

function findAdminTableCombination(tables: { id: string; seats: number }[], guests: number) {
  const sortedTables = [...tables].sort((a, b) => b.seats - a.seats);
  let best: { id: string; seats: number }[] | null = null;
  const maxMask = 1 << sortedTables.length;

  for (let mask = 1; mask < maxMask; mask++) {
    const combo: { id: string; seats: number }[] = [];
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
    if (seats < bestSeats || (seats === bestSeats && combo.length < best.length)) {
      best = combo;
    }
  }

  return best || [];
}

function calculateAvailableTablesForTurn(
  reservations: Reservation[],
  dateKey: string,
  turn: string,
  selectedZone: string,
) {
  const zones = selectedZone === "all" ? Object.keys(ADMIN_ZONE_TABLES) : [selectedZone];

  return zones.reduce((totalAvailable, zone) => {
    const inventory = ADMIN_ZONE_TABLES[zone] || [];
    const freeTableIds = new Set(inventory.map((table) => table.id));

    reservations
      .filter((reservation) =>
        reservation.status !== "cancelled" &&
        reservation.date === dateKey &&
        reservation.zone === zone &&
        getCalendarTurn(reservation.time) === turn
      )
      .forEach((reservation) => {
        if (reservation.table_ids?.length) {
          reservation.table_ids.forEach((tableId) => freeTableIds.delete(String(tableId)));
          return;
        }

        const freeTables = inventory.filter((table) => freeTableIds.has(table.id));
        findAdminTableCombination(freeTables, Number(reservation.guests) || 1)
          .forEach((table) => freeTableIds.delete(table.id));
      });

    return totalAvailable + freeTableIds.size;
  }, 0);
}

// ─── New Reservation Dialog ───────────────────────────────────────────────────

type NewReservationForm = {
  name: string;
  phone: string;
  guests: string;
  date: Date | undefined;
  time: string;
  zone: string;
  comments: string;
};

function NewReservationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const empty: NewReservationForm = {
    name: "", phone: "", guests: "", date: undefined,
    time: "", zone: "", comments: "",
  };
  const [form, setForm] = useState<NewReservationForm>(empty);
  const [linkedUser, setLinkedUser] = useState<ClientUser | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<ClientUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof NewReservationForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleUserSearch = async (q: string) => {
    setUserQuery(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
      const results = await api.searchUsers(q);
      setUserResults(results);
    } catch { setUserResults([]); }
    finally { setSearchingUsers(false); }
  };

  const selectUser = (u: ClientUser) => {
    setLinkedUser(u);
    setForm((prev) => ({ ...prev, name: u.name, phone: u.phone }));
    setUserQuery("");
    setUserResults([]);
  };

  const clearUser = () => {
    setLinkedUser(null);
    setForm((prev) => ({ ...prev, name: "", phone: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) { setError("Selecciona una fecha"); return; }
    if (!form.guests) { setError("Selecciona el número de personas"); return; }
    if (!form.time) { setError("Selecciona una hora"); return; }
    if (!form.zone) { setError("Selecciona una zona"); return; }

    setLoading(true);
    setError(null);
    try {
      await api.createReservation({
        ...form,
        date: format(form.date, "yyyy-MM-dd"),
        comments: form.comments || undefined,
        ...(linkedUser ? { user_id: linkedUser.id, user_code: linkedUser.code } : {}),
      });
      setForm(empty);
      setLinkedUser(null);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Reserva Manual</DialogTitle>
          <DialogDescription>
            Añade una reserva directamente desde el panel de administración.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User search */}
          <div className="space-y-2 p-3 bg-muted/40 rounded-lg border">
            <Label className="flex items-center gap-1.5">
              <UserSearch className="h-4 w-4" />
              Vincular a cliente registrado (opcional)
            </Label>
            {linkedUser ? (
              <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md">
                <div>
                  <p className="text-sm font-medium">{linkedUser.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{linkedUser.code} · {linkedUser.phone}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearUser}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono o código CAF-…"
                  value={userQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="pl-9"
                />
                {userResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => selectUser(u)}
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">{u.code}</span>
                        <span className="text-muted-foreground ml-2">{u.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchingUsers && (
                  <p className="text-xs text-muted-foreground mt-1">Buscando…</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre completo *</Label>
              <Input
                placeholder="Juan Pérez"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Teléfono *</Label>
              <Input
                type="tel"
                placeholder="+34 612 345 678"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Personas *</Label>
              <Select onValueChange={(v) => set("guests", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "persona" : "personas"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Zona *</Label>
              <Select onValueChange={(v) => set("zone", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terraza">GastroGarden</SelectItem>
                  <SelectItem value="interior">Bistro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, "dd/MM/yyyy") : "Selecciona"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(d) => set("date", d)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label>Hora *</Label>
              <Select onValueChange={(v) => set("time", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Comentarios (opcional)</Label>
              <Textarea
                placeholder="Notas especiales, alergias, celebración…"
                rows={3}
                className="resize-none"
                value={form.comments}
                onChange={(e) => set("comments", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main admin panel ─────────────────────────────────────────────────────────

function CanceladasTab({
  reservations,
  loading,
  onRestore,
}: {
  reservations: Reservation[];
  loading: boolean;
  onRestore: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const cancelled = reservations
    .filter((r) => r.status === "cancelled")
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await onRestore(id);
    } catch (err: any) {
      alert(err.message || "No se pudo restaurar la reserva");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          Reservas Canceladas
        </CardTitle>
        <CardDescription>{cancelled.length} cancelaciones registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando…</div>
        ) : cancelled.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay reservas canceladas
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="whitespace-nowrap">Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelled.map((r) => {
                  const reason = (r as any).cancel_reason;
                  const isRestoring = restoringId === r.id;
                  return (
                    <TableRow key={r.id} className="bg-red-50/40">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.id.replace("RES-", "#")}
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm">{r.phone}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {r.date ? format(new Date(r.date + "T12:00:00"), "dd MMM yyyy", { locale: es }) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{r.time}</TableCell>
                      <TableCell className="text-center">{r.guests}</TableCell>
                      <TableCell className="text-sm">{getReservationZoneLabel(r)}</TableCell>
                      <TableCell className="max-w-[180px]">
                        {reason ? (
                          <div>
                            <button
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setExpandedReason(expandedReason === r.id ? null : r.id)}
                            >
                              <MessageSquare className="h-3 w-3" />
                              Ver motivo
                            </button>
                            {expandedReason === r.id && (
                              <p className="mt-1 text-xs text-muted-foreground italic break-words leading-relaxed border-l-2 border-muted pl-2">
                                "{reason}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Restaurar como confirmada"
                          disabled={isRestoring}
                          onClick={() => handleRestore(r.id)}
                          className="gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {isRestoring ? "Restaurando…" : "Restaurar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClientesTab() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const results = await api.searchUsers(q);
      setUsers(results);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { search(""); }, [search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Registrados</CardTitle>
        <CardDescription>{users.length} clientes en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o código CAF-…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            className="pl-10"
          />
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Buscando…</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No se encontraron clientes</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="whitespace-nowrap">Fecha registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-primary text-sm">
                        {u.code || <span className="text-muted-foreground text-xs italic">Sin código</span>}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {u.created_at
                        ? format(new Date(u.created_at), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Menus Tab ────────────────────────────────────────────────────────────────

const ALLERGEN_OPTIONS = [
  "Gluten",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Lácteos",
  "Frutos secos",
  "Apio",
  "Mostaza",
  "Sésamo",
  "Sulfitos",
  "Altramuces",
  "Moluscos",
];

function getSelectedAllergens(description = "") {
  const value = description.toLowerCase();
  return ALLERGEN_OPTIONS.filter((allergen) => value.includes(allergen.toLowerCase()));
}

function addAllergenToDescription(description = "", allergen: string) {
  if (!allergen) return description;
  const selected = getSelectedAllergens(description);
  if (selected.includes(allergen)) return description;
  const cleaned = description.trim();
  return cleaned ? `${cleaned}, ${allergen}` : allergen;
}

function removeAllergenFromDescription(description = "", allergen: string) {
  return description
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== allergen.toLowerCase())
    .join(", ");
}

// ─── Default menu data (frontend fallback) ───────────────────────────────────

const DEFAULT_WEEKDAY: any = {
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
        { title: "Primero", items: [
          { name: "Menestra de brécol & coliflor sobre hummus y ajadas", allergens: ["Sésamo"] },
          { name: "", allergens: [] },
        ]},
        { title: "Segundo", items: [
          { name: "Mafalda en salsa caponata, parmesano y aceite de aromáticas", allergens: ["Gluten", "Lácteos"] },
          { name: "", allergens: [] },
        ]},
        { title: "Postre", items: [
          { name: "Semifrío de limón", allergens: ["Huevos", "Lácteos", "Gluten"] },
          { name: "", allergens: [] },
        ]},
      ],
    },
  ],
};

const DEFAULT_WEEKEND: any = {
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
        { title: "Segundo", items: [
          { name: "Plato principal vegetariano del día", allergens: [] },
          { name: "", allergens: [] },
        ]},
        { title: "Postre", items: [
          { name: "Vasito de limón", allergens: ["Huevos", "Lácteos"] },
          { name: "", allergens: [] },
        ]},
      ],
    },
  ],
  degustation: {
    title: "Menú Degustación de Temporada", price: "35,00 €",
    includes: "Con café 100% arábica natural · Bodega aparte",
    note: "Incremento +1,00 € en terraza · Consultar carta de vinos",
    sections: [
      { title: "De Temporada", items: [
        { name: "Caballa marinada sobre arroz glutinoso, contrapunto asiático, algas y su crujiente", allergens: ["Pescado"] },
        { name: "Berberechos en salsa verde, ajadas, guisantes & edamame", allergens: ["Moluscos"] },
      ]},
      { title: "Del Mar", items: [
        { name: "Atún rojo sosa-sado, cremoso de coliflor, fresas en texturas y trigueros", allergens: ["Pescado"] },
        { name: "", allergens: [] },
      ]},
      { title: "De la Tierra", items: [
        { name: "Tataki de buey, salsa PX, brevas, angulas del monte y cremoso de chirivía", allergens: [] },
        { name: "", allergens: [] },
      ]},
      { title: "Está de Dulce", items: [
        { name: "Ensalada capresse", allergens: ["Lácteos"] },
        { name: "", allergens: [] },
      ]},
    ],
  },
};

const DEFAULT_GASTROTECA: any = {
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

function GeneralMenuEditor({
  data,
  onSave,
  title = "Carta general",
  description = "Edita las secciones y platos que se muestran en la pagina publica de carta.",
  savedLabel = "Carta general guardada.",
  saveLabel = "Guardar y publicar carta",
}: {
  data: GeneralMenuData;
  onSave: (data: GeneralMenuData) => Promise<void>;
  title?: string;
  description?: string;
  savedLabel?: string;
  saveLabel?: string;
}) {
  const [sections, setSections] = useState<GeneralMenuSection[]>(normalizeGeneralMenuData(data).sections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSections(normalizeGeneralMenuData(data).sections);
  }, [data]);

  const updateSection = (sectionIndex: number, patch: Partial<GeneralMenuSection>) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex ? { ...section, ...patch } : section
    )));
    setSaved(false);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, patch: Partial<GeneralMenuItem>) => {
    setSections((prev) => prev.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        items: section.items.map((item, itemPosition) => (
          itemPosition === itemIndex ? { ...item, ...patch } : item
        )),
      };
    }));
    setSaved(false);
  };

  const addSection = () => {
    setSections((prev) => [...prev, { title: "Nueva seccion", description: "", items: [{ name: "", description: "", price: "" }] }]);
    setSaved(false);
  };

  const removeSection = (sectionIndex: number) => {
    setSections((prev) => prev.filter((_, index) => index !== sectionIndex));
    setSaved(false);
  };

  const addItem = (sectionIndex: number) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex
        ? { ...section, items: [...section.items, { name: "", description: "", price: "" }] }
        : section
    )));
    setSaved(false);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex
        ? { ...section, items: section.items.filter((_, itemPosition) => itemPosition !== itemIndex) }
        : section
    )));
    setSaved(false);
  };

  const cleanData = (): GeneralMenuData => ({
    sections: sections
      .map((section) => ({
        title: section.title.trim(),
        description: section.description?.trim() || "",
        items: section.items
          .map((item) => ({
            name: item.name.trim(),
            description: item.description?.trim() || "",
            price: item.price?.trim() || "",
          }))
          .filter((item) => item.name),
      }))
      .filter((section) => section.title && section.items.length),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(cleanData());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir sección
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="rounded-lg border bg-background p-4 space-y-4">
            <h3 className="font-semibold text-primary">{section.title || "Nueva seccion"}</h3>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Titulo de seccion</Label>
                <Input
                  value={section.title}
                  onChange={(event) => updateSection(sectionIndex, { title: event.target.value })}
                  placeholder="Ej. Entrantes frios"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripcion opcional</Label>
                <Input
                  value={section.description || ""}
                  onChange={(event) => updateSection(sectionIndex, { description: event.target.value })}
                  placeholder="Nota de la seccion"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSection(sectionIndex)}
                aria-label="Eliminar seccion"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid gap-3 rounded-md bg-muted/30 p-3 md:grid-cols-[1.2fr_1.2fr_110px_auto] md:items-start">
                  <div className="space-y-2">
                    <Label>Plato</Label>
                    <Input
                      value={item.name}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { name: event.target.value })}
                      placeholder="Nombre del plato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alérgenos</Label>
                    <Select
                      value=""
                      onValueChange={(allergen) => updateItem(sectionIndex, itemIndex, {
                        description: addAllergenToDescription(item.description, allergen),
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Añadir alérgeno" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLERGEN_OPTIONS.map((allergen) => (
                          <SelectItem key={allergen} value={allergen}>
                            <span className="inline-flex items-center gap-2">
                              <AllergenIcon allergen={allergen} size={18} />
                              <span>{allergen}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedAllergens(item.description).map((allergen) => (
                        <Badge key={allergen} variant="secondary" className="gap-1">
                          {allergen}
                          <button
                            type="button"
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            onClick={() => updateItem(sectionIndex, itemIndex, {
                              description: removeAllergenFromDescription(item.description, allergen),
                            })}
                            aria-label={`Quitar ${allergen}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      value={item.price || ""}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { price: event.target.value })}
                      placeholder="12.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="md:mt-6"
                    onClick={() => removeItem(sectionIndex, itemIndex)}
                    aria-label="Eliminar plato"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => addItem(sectionIndex)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir plato
            </Button>
          </div>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {saved && <span className="text-sm text-primary">{savedLabel}</span>}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : saveLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralMenuTab() {
  const [generalMenuData, setGeneralMenuData] = useState<GeneralMenuData>(DEFAULT_GENERAL_MENU);
  const [breakfastMenuData, setBreakfastMenuData] = useState<BreakfastMenuData>(DEFAULT_BREAKFAST_MENU);
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "offline">("loading");
  const [section, setSection] = useState<"general" | "breakfast">("general");

  useEffect(() => {
    const local = localStorage.getItem("published:general-menu");
    if (local) {
      try {
        setGeneralMenuData(normalizeGeneralMenuData(JSON.parse(local)));
      } catch {
        setGeneralMenuData(DEFAULT_GENERAL_MENU);
      }
    }

    const localBreakfast = localStorage.getItem("published:breakfast-menu");
    if (localBreakfast) {
      try {
        setBreakfastMenuData(normalizeBreakfastMenuData(JSON.parse(localBreakfast)));
      } catch {
        setBreakfastMenuData(DEFAULT_BREAKFAST_MENU);
      }
    }

    api.getGeneralMenu()
      .then((data) => {
        setGeneralMenuData(normalizeGeneralMenuData(data));
        setApiStatus("ok");
      })
      .catch(() => setApiStatus("offline"));

    api.getBreakfastMenu()
      .then((data) => {
        setBreakfastMenuData(normalizeBreakfastMenuData(data));
        setApiStatus("ok");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const saveGeneralMenu = async (data: GeneralMenuData) => {
    setGeneralMenuData(data);
    localStorage.setItem("published:general-menu", JSON.stringify(data));
    try {
      await api.saveGeneralMenu(data);
      setApiStatus("ok");
    } catch {
      setApiStatus("offline");
    }
  };

  const saveBreakfastMenu = async (data: BreakfastMenuData) => {
    setBreakfastMenuData(data);
    localStorage.setItem("published:breakfast-menu", JSON.stringify(data));
    try {
      await api.saveBreakfastMenu(data);
      setApiStatus("ok");
    } catch {
      setApiStatus("offline");
    }
  };

  return (
    <div className="space-y-6">
      {apiStatus === "offline" && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span>⚠️</span>
          <span>El servidor no está disponible. Los cambios se guardarán localmente hasta que se restablezca la conexión.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={section === "general" ? "default" : "outline"}
          onClick={() => setSection("general")}
        >
          Carta general
        </Button>
        <Button
          type="button"
          variant={section === "breakfast" ? "default" : "outline"}
          onClick={() => setSection("breakfast")}
        >
          Desayunos
        </Button>
      </div>

      {section === "general" ? (
        <GeneralMenuEditor data={generalMenuData} onSave={saveGeneralMenu} />
      ) : (
        <GeneralMenuEditor
          data={breakfastMenuData}
          onSave={saveBreakfastMenu}
          title="Carta de desayunos"
          description="Edita las secciones y productos que se muestran en la carta publica de desayunos."
          savedLabel="Carta de desayunos guardada."
          saveLabel="Guardar y publicar desayunos"
        />
      )}
    </div>
  );
}

function BeveragesEditor({
  data,
  onSave,
}: {
  data: BeverageData;
  onSave: (data: BeverageData) => Promise<void>;
}) {
  const [sections, setSections] = useState<BeverageSection[]>(normalizeBeverageData(data).sections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSections(normalizeBeverageData(data).sections);
  }, [data]);

  const updateSection = (sectionIndex: number, patch: Partial<BeverageSection>) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex ? { ...section, ...patch } : section
    )));
    setSaved(false);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, patch: Partial<BeverageItem>) => {
    setSections((prev) => prev.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        items: section.items.map((item, itemPosition) => (
          itemPosition === itemIndex ? { ...item, ...patch } : item
        )),
      };
    }));
    setSaved(false);
  };

  const addSection = () => {
    setSections((prev) => [...prev, { title: "Nueva seccion", description: "", items: [{ name: "", description: "", price: "", terracePrice: "" }] }]);
    setSaved(false);
  };

  const removeSection = (sectionIndex: number) => {
    setSections((prev) => prev.filter((_, index) => index !== sectionIndex));
    setSaved(false);
  };

  const addItem = (sectionIndex: number) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex
        ? { ...section, items: [...section.items, { name: "", description: "", price: "", terracePrice: "" }] }
        : section
    )));
    setSaved(false);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setSections((prev) => prev.map((section, index) => (
      index === sectionIndex
        ? { ...section, items: section.items.filter((_, itemPosition) => itemPosition !== itemIndex) }
        : section
    )));
    setSaved(false);
  };

  const cleanData = (): BeverageData => ({
    sections: sections
      .map((section) => ({
        title: section.title.trim(),
        description: section.description?.trim() || "",
        items: section.items
          .map((item) => ({
            name: item.name.trim(),
            description: item.description?.trim() || "",
            price: item.price?.trim() || "",
            terracePrice: item.terracePrice?.trim() || "",
          }))
          .filter((item) => item.name),
      }))
      .filter((section) => section.title && section.items.length),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(cleanData());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              Carta de bebidas
            </CardTitle>
            <CardDescription>Edita las secciones y bebidas que se muestran en la pagina publica.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir sección
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="rounded-lg border bg-background p-4 space-y-4">
            <h3 className="font-semibold text-primary">{beverageTitleWithEmoji(section.title || "Nueva seccion")}</h3>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Titulo de seccion</Label>
                <Input
                  value={section.title}
                  onChange={(event) => updateSection(sectionIndex, { title: event.target.value })}
                  placeholder="Ej. Refrescos"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripcion opcional</Label>
                <Input
                  value={section.description || ""}
                  onChange={(event) => updateSection(sectionIndex, { description: event.target.value })}
                  placeholder="Ej. Disponible carta de vinos completa"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSection(sectionIndex)}
                aria-label="Eliminar seccion"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid gap-3 rounded-md bg-muted/30 p-3 md:grid-cols-[1.1fr_1.3fr_110px_110px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Bebida</Label>
                    <Input
                      value={item.name}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { name: event.target.value })}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Detalle</Label>
                    <Input
                      value={item.description || ""}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { description: event.target.value })}
                      placeholder="Sabores, formato o nota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      value={item.price || ""}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { price: event.target.value })}
                      placeholder="2,50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Terraza</Label>
                    <Input
                      value={item.terracePrice || ""}
                      onChange={(event) => updateItem(sectionIndex, itemIndex, { terracePrice: event.target.value })}
                      placeholder="2,80"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(sectionIndex, itemIndex)}
                    aria-label="Eliminar bebida"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => addItem(sectionIndex)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir bebida
            </Button>
          </div>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {saved && <span className="text-sm text-primary">Carta de bebidas guardada.</span>}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar y publicar bebidas"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BeveragesTab() {
  const [beverageData, setBeverageData] = useState<BeverageData>(DEFAULT_BEVERAGES);
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "offline">("loading");

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
      .then((data) => {
        setBeverageData(normalizeBeverageData(data));
        setApiStatus("ok");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const saveBeverages = async (data: BeverageData) => {
    setBeverageData(data);
    localStorage.setItem("published:beverages", JSON.stringify(data));
    try {
      await api.saveBeverages(data);
      setApiStatus("ok");
    } catch {
      setApiStatus("offline");
    }
  };

  return (
    <div className="space-y-6">
      {apiStatus === "offline" && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span>⚠️</span>
          <span>El servidor no está disponible. Los cambios se guardarán localmente hasta que se restablezca la conexión.</span>
        </div>
      )}

      <BeveragesEditor data={beverageData} onSave={saveBeverages} />
    </div>
  );
}

function WineListEditor({
  data,
  onSave,
}: {
  data: WineListData;
  onSave: (data: WineListData) => Promise<void>;
}) {
  const [groups, setGroups] = useState<WineGroup[]>(normalizeWineListData(data).groups);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGroups(normalizeWineListData(data).groups);
  }, [data]);

  const updateGroup = (groupIndex: number, patch: Partial<WineGroup>) => {
    setGroups((prev) => prev.map((group, index) => (
      index === groupIndex ? { ...group, ...patch } : group
    )));
    setSaved(false);
  };

  const updateSection = (groupIndex: number, sectionIndex: number, patch: Partial<WineSection>) => {
    setGroups((prev) => prev.map((group, index) => {
      if (index !== groupIndex) return group;
      return {
        ...group,
        sections: group.sections.map((section, sectionPosition) => (
          sectionPosition === sectionIndex ? { ...section, ...patch } : section
        )),
      };
    }));
    setSaved(false);
  };

  const updateWine = (groupIndex: number, sectionIndex: number, wineIndex: number, patch: Partial<WineItem>) => {
    setGroups((prev) => prev.map((group, index) => {
      if (index !== groupIndex) return group;
      return {
        ...group,
        sections: group.sections.map((section, sectionPosition) => {
          if (sectionPosition !== sectionIndex) return section;
          return {
            ...section,
            wines: section.wines.map((wine, winePosition) => (
              winePosition === wineIndex ? { ...wine, ...patch } : wine
            )),
          };
        }),
      };
    }));
    setSaved(false);
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, { title: "Nueva categoría", sections: [{ title: "Nueva zona", wines: [{ name: "", price: "" }] }] }]);
    setSaved(false);
  };

  const removeGroup = (groupIndex: number) => {
    setGroups((prev) => prev.filter((_, index) => index !== groupIndex));
    setSaved(false);
  };

  const addSection = (groupIndex: number) => {
    setGroups((prev) => prev.map((group, index) => (
      index === groupIndex
        ? { ...group, sections: [...group.sections, { title: "Nueva zona", wines: [{ name: "", price: "" }] }] }
        : group
    )));
    setSaved(false);
  };

  const removeSection = (groupIndex: number, sectionIndex: number) => {
    setGroups((prev) => prev.map((group, index) => (
      index === groupIndex
        ? { ...group, sections: group.sections.filter((_, sectionPosition) => sectionPosition !== sectionIndex) }
        : group
    )));
    setSaved(false);
  };

  const addWine = (groupIndex: number, sectionIndex: number) => {
    setGroups((prev) => prev.map((group, index) => {
      if (index !== groupIndex) return group;
      return {
        ...group,
        sections: group.sections.map((section, sectionPosition) => (
          sectionPosition === sectionIndex
            ? { ...section, wines: [...section.wines, { name: "", price: "" }] }
            : section
        )),
      };
    }));
    setSaved(false);
  };

  const removeWine = (groupIndex: number, sectionIndex: number, wineIndex: number) => {
    setGroups((prev) => prev.map((group, index) => {
      if (index !== groupIndex) return group;
      return {
        ...group,
        sections: group.sections.map((section, sectionPosition) => (
          sectionPosition === sectionIndex
            ? { ...section, wines: section.wines.filter((_, winePosition) => winePosition !== wineIndex) }
            : section
        )),
      };
    }));
    setSaved(false);
  };

  const cleanData = (): WineListData => ({
    groups: groups
      .map((group) => ({
        title: group.title.trim(),
        sections: group.sections
          .map((section) => ({
            title: section.title.trim(),
            wines: section.wines
              .map((wine) => ({
                name: wine.name.trim(),
                price: wine.price.trim(),
              }))
              .filter((wine) => wine.name),
          }))
          .filter((section) => section.title && section.wines.length),
      }))
      .filter((group) => group.title && group.sections.length),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(cleanData());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              Carta de vinos
            </CardTitle>
            <CardDescription>Edita las categorías, zonas y precios de la carta extendida de vinos.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir categoría
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="rounded-lg border bg-background p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input
                  value={group.title}
                  onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                  placeholder="Ej. Tintos Nacionales"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeGroup(groupIndex)}
                aria-label="Eliminar categoría"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {group.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="rounded-md bg-muted/30 p-3 space-y-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <div className="space-y-2">
                      <Label>Zona / D.O.</Label>
                      <Input
                        value={section.title}
                        onChange={(event) => updateSection(groupIndex, sectionIndex, { title: event.target.value })}
                        placeholder="Ej. Ribera del Duero"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addWine(groupIndex, sectionIndex)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir vino
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(groupIndex, sectionIndex)}
                      aria-label="Eliminar zona"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {section.wines.map((wine, wineIndex) => (
                      <div key={wineIndex} className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
                        <div className="space-y-2">
                          <Label>Vino</Label>
                          <Input
                            value={wine.name}
                            onChange={(event) => updateWine(groupIndex, sectionIndex, wineIndex, { name: event.target.value })}
                            placeholder="Nombre del vino"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio</Label>
                          <Input
                            value={wine.price}
                            onChange={(event) => updateWine(groupIndex, sectionIndex, wineIndex, { price: event.target.value })}
                            placeholder="22€"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWine(groupIndex, sectionIndex, wineIndex)}
                          aria-label="Eliminar vino"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => addSection(groupIndex)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir zona
            </Button>
          </div>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {saved && <span className="text-sm text-primary">Carta de vinos guardada.</span>}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar y publicar vinos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WineListTab() {
  const [wineListData, setWineListData] = useState<WineListData>(DEFAULT_WINE_LIST);
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "offline">("loading");

  useEffect(() => {
    const local = localStorage.getItem("published:wine-list");
    if (local) {
      try {
        setWineListData(normalizeWineListData(JSON.parse(local)));
      } catch {
        setWineListData(DEFAULT_WINE_LIST);
      }
    }

    api.getWineList()
      .then((data) => {
        setWineListData(normalizeWineListData(data));
        setApiStatus("ok");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const saveWineList = async (data: WineListData) => {
    setWineListData(data);
    localStorage.setItem("published:wine-list", JSON.stringify(data));
    try {
      await api.saveWineList(data);
      setApiStatus("ok");
    } catch {
      setApiStatus("offline");
    }
  };

  return (
    <div className="space-y-6">
      {apiStatus === "offline" && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span>⚠️</span>
          <span>El servidor no está disponible. Los cambios se guardarán localmente hasta que se restablezca la conexión.</span>
        </div>
      )}

      <WineListEditor data={wineListData} onSave={saveWineList} />
    </div>
  );
}

function MenusTab() {
  const [menuTab, setMenuTab] = useState<"weekday" | "weekend" | "gastroteca">("weekday");
  const [weekdayData, setWeekdayData] = useState<any>(DEFAULT_WEEKDAY);
  const [weekendData, setWeekendData] = useState<any>(DEFAULT_WEEKEND);
  const [gastrotecaData, setGastrotecaData] = useState<any>(DEFAULT_GASTROTECA);
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "offline">("loading");

  useEffect(() => {
    Promise.all([
      api.getWeekdayMenu().catch(() => null),
      api.getWeekendMenu().catch(() => null),
      api.getGastrotecaMenu().catch(() => null),
    ]).then(([wd, we, ga]) => {
      if (wd) setWeekdayData(wd);
      if (we) setWeekendData(we);
      if (ga) setGastrotecaData(ga);
      setApiStatus(wd || we || ga ? "ok" : "offline");
    });
  }, []);

  const saveWeekday = async (data: any) => {
    setWeekdayData(data);
    // Write to localStorage so the public menu page updates immediately
    localStorage.setItem("published:menu:weekday", JSON.stringify(data));
    try { await api.saveWeekdayMenu(data); }
    catch { /* localStorage is the fallback */ }
  };

  const saveWeekend = async (data: any) => {
    setWeekendData(data);
    localStorage.setItem("published:menu:weekend", JSON.stringify(data));
    try { await api.saveWeekendMenu(data); }
    catch { /* localStorage is the fallback */ }
  };

  const saveGastroteca = async (data: any) => {
    setGastrotecaData(data);
    localStorage.setItem("published:menu:gastroteca", JSON.stringify(data));
    try { await api.saveGastrotecaMenu(data); }
    catch { /* localStorage is the fallback */ }
  };

  return (
    <div className="space-y-6">
      {apiStatus === "offline" && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span>⚠️</span>
          <span>El servidor no está disponible. Los cambios se guardarán localmente hasta que se restablezca la conexión.</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: "weekday", label: "Menú del Día (L-V)" },
          { key: "weekend", label: "Fin de Semana (Sábado)" },
          { key: "gastroteca", label: "Gastroteca (J-S)" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMenuTab(key)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              menuTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {menuTab === "weekday" && (
        <WeekdayMenuEditor
          key="weekday"
          data={weekdayData}
          onSave={saveWeekday}
        />
      )}
      {menuTab === "weekend" && (
        <WeekendMenuEditor
          key="weekend"
          data={weekendData}
          onSave={saveWeekend}
        />
      )}
      {menuTab === "gastroteca" && (
        <GastrotecaMenuEditor
          key="gastroteca"
          data={gastrotecaData}
          onSave={saveGastroteca}
        />
      )}
    </div>
  );
}

type AdminNotification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  reservation_id: string;
  reservation_date: string;
  reservation_time: string;
  guest_name: string;
  guests: string | number;
  zone: string;
  reason: string | null;
};

type ReservationHistory = {
  id: string;
  action: "confirmed" | "restored" | "deleted";
  created_at: string;
  reservation_id: string | null;
  reservation_date: string | null;
  reservation_time: string | null;
  guest_name: string;
  phone: string;
  guests: string | number;
  zone: string;
  status: string;
  user_code?: string | null;
  details?: Record<string, any>;
};

function NotificacionesTab({
  notifications,
  onMarkRead,
}: {
  notifications: AdminNotification[];
  onMarkRead: () => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones de Cancelación
            </CardTitle>
            <CardDescription>
              {notifications.length} cancelaciones · {unread} sin leer
            </CardDescription>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={[
                  "flex gap-4 p-4 rounded-lg border transition-colors",
                  n.read ? "bg-background" : "bg-amber-50 border-amber-200",
                ].join(" ")}
              >
                <div className={[
                  "mt-0.5 h-2 w-2 rounded-full shrink-0",
                  n.read ? "bg-muted-foreground/30" : "bg-amber-500",
                ].join(" ")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">
                      <span className="text-destructive">Cancelación</span>
                      {" — "}{n.guest_name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(n.created_at), "dd MMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {n.reservation_date
                      ? format(new Date(n.reservation_date + "T12:00:00"), "d 'de' MMMM", { locale: es })
                      : n.reservation_date}
                    {" a las "}{n.reservation_time}
                    {" · "}{n.guests} {Number(n.guests) === 1 ? "persona" : "personas"}
                    {" · "}{ZONE_LABELS[n.zone] || n.zone}
                  </p>
                  {n.reason && (
                    <div className="mt-2 px-3 py-2 bg-muted/60 rounded text-sm italic text-muted-foreground">
                      "{n.reason}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const HISTORY_LABELS: Record<ReservationHistory["action"], string> = {
  confirmed: "Confirmada",
  restored: "Restaurada",
  deleted: "Eliminada",
};

function HistorialReservasTab({
  history,
  loading,
}: {
  history: ReservationHistory[];
  loading: boolean;
}) {
  const [filter, setFilter] = useState<"all" | ReservationHistory["action"]>("all");
  const filtered = history.filter((item) => filter === "all" || item.action === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Historial de Reservas
        </CardTitle>
        <CardDescription>
          Movimientos registrados de reservas confirmadas, restauradas y eliminadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground">{filtered.length} eventos</p>
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="restored">Restauradas</SelectItem>
              <SelectItem value="deleted">Eliminadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando historial…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movimiento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="whitespace-nowrap">Reserva</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead className="whitespace-nowrap">Fecha movimiento</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge
                        variant={
                          item.action === "deleted"
                            ? "destructive"
                            : item.action === "restored"
                              ? "secondary"
                              : "default"
                        }
                        className="whitespace-nowrap"
                      >
                        {HISTORY_LABELS[item.action]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.guest_name}</div>
                    </TableCell>
                    <TableCell className="text-sm">{item.phone || "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.reservation_date
                        ? format(new Date(item.reservation_date + "T12:00:00"), "dd MMM yyyy", { locale: es })
                        : "—"}
                      {item.reservation_time ? ` · ${item.reservation_time}` : ""}
                    </TableCell>
                    <TableCell className="text-center">{item.guests || "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {ZONE_LABELS[item.zone] || item.zone || "—"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.created_at
                        ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: es })
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {item.reservation_id ? item.reservation_id.replace("RES-", "#") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function prepareOcrImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo preparar la imagen para OCR."));
      image.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("No se pudo procesar la imagen en este navegador."));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), milliseconds);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function ReservationCalendarView({
  reservations,
  weekDate,
  onWeekDateChange,
  selectedDay,
  onSelectedDayChange,
  selectedZone,
  onSelectedZoneChange,
  isOpen,
  onToggleOpen,
  focusedReservationId,
}: {
  reservations: Reservation[];
  weekDate: Date;
  onWeekDateChange: (date: Date) => void;
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
  selectedZone: string;
  onSelectedZoneChange: (zone: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  focusedReservationId?: string | null;
}) {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const days = selectedDay === "week"
    ? weekDays
    : weekDays.filter((day) => format(day, "yyyy-MM-dd") === selectedDay);
  const isSingleDay = days.length === 1;
  const isGastrotecaView = selectedZone === "gastroteca";
  const activeReservations = reservations.filter((reservation) => reservation.status !== "cancelled");
  const visibleZones = selectedZone === "all" || isGastrotecaView
    ? [...RESERVABLE_ZONES]
    : [selectedZone];
  const visibleReservations = activeReservations.filter(
    (reservation) => {
      if (isGastrotecaView) return getCalendarTurn(reservation.time) === "dinner";
      return selectedZone === "all" || reservation.zone === selectedZone;
    },
  );

  const reservationsForDay = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return visibleReservations.filter((reservation) => reservation.date === dateKey);
  };

  const reservationsForSlot = (day: Date, slot: string) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return visibleReservations
      .filter((reservation) => reservation.date === dateKey && reservation.time === slot)
      .sort((a, b) => String(a.zone).localeCompare(String(b.zone)));
  };

  const occupancyForTurn = (day: Date, slot: string) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const turn = getCalendarTurn(slot);
    const occupancy: Record<string, number> = { interior: 0, cafeteria: 0, terraza: 0 };

    activeReservations
      .filter((reservation) => reservation.date === dateKey && getCalendarTurn(reservation.time) === turn)
      .forEach((reservation) => {
        if (occupancy[reservation.zone] !== undefined) {
          occupancy[reservation.zone] += Number(reservation.guests) || 0;
        }
      });

    return occupancy;
  };

  const zoneTone = (zone: string, current: number) => {
    const capacity = ADMIN_ZONE_CAPACITIES[zone] || 1;
    const ratio = current / capacity;
    if (ratio >= 1) return "bg-red-100 text-red-800 border-red-200";
    if (ratio >= 0.75) return "bg-amber-100 text-amber-800 border-amber-200";
    return ZONE_COLOR_STYLES[zone] || "bg-emerald-50 text-emerald-800 border-emerald-200";
  };

  const renderSlotRow = (slot: string, isLast = false) => (
    <div
      key={slot}
      className={[
        "grid min-h-[104px]",
        isLast ? "" : "border-b",
        isSingleDay ? "grid-cols-[76px_minmax(380px,1fr)]" : "grid-cols-[76px_repeat(7,minmax(140px,1fr))]",
      ].join(" ")}
    >
      <div className="px-3 py-3 text-xs font-semibold text-muted-foreground bg-muted/20">
        {slot}
      </div>
      {days.map((day) => {
        const slotReservations = reservationsForSlot(day, slot);
        const occupancy = occupancyForTurn(day, slot);
        return (
          <div key={`${day.toISOString()}-${slot}`} className="p-2 border-l space-y-2">
            <div className="flex flex-wrap gap-1">
              {visibleZones.map((zone) => {
                const capacity = ADMIN_ZONE_CAPACITIES[zone];
                return (
                  <span
                    key={zone}
                    className={[
                      "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      zoneTone(zone, occupancy[zone] || 0),
                    ].join(" ")}
                  >
                    {ZONE_LABELS[zone]} {occupancy[zone] || 0}/{capacity} pax
                  </span>
                );
              })}
            </div>

            {slotReservations.length > 0 ? (
              <div className="space-y-1.5">
                {slotReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className={[
                      "rounded-md border p-2 transition-colors",
                      focusedReservationId === reservation.id
                        ? "border-primary bg-primary/15 ring-2 ring-primary/30"
                        : "border-primary/15 bg-primary/5",
                    ].join(" ")}
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded border bg-background/80 px-2 py-1 min-w-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase text-muted-foreground">Nombre</div>
                            <div className="truncate text-[15px] font-semibold leading-tight">{reservation.name}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase text-muted-foreground">Teléfono</div>
                            <div className="truncate text-[15px] font-medium leading-tight">{reservation.phone || "—"}</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded border bg-primary/10 border-primary/25 px-2 py-1 text-center flex flex-col items-center justify-center">
                          <div className="text-[10px] uppercase text-muted-foreground">Pax</div>
                          <div className="text-4xl font-bold leading-none text-primary">{reservation.guests}</div>
                        </div>
                        <div className={[
                          "rounded border px-2 py-1 text-center flex items-center justify-center text-xs font-bold leading-tight",
                          ZONE_COLOR_STYLES[reservation.zone] || "bg-muted text-foreground border-border",
                        ].join(" ")}>
                          {getReservationZoneLabel(reservation)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground truncate">
                      {reservation.table_ids?.length ? `Mesas ${reservation.table_ids.join(" + ")}` : ""}
                      {reservation.assigned_capacity ? ` · ${reservation.assigned_capacity} plazas asignadas` : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground/70">Sin reservas</div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_auto_minmax(420px,1fr)] xl:items-center">
          <div className="min-w-0">
            <CardTitle>Calendario de reservas</CardTitle>
            <CardDescription>
              Vista por hora · la ocupación cuenta por turno completo
            </CardDescription>
          </div>
          <div className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto">
            {[
              { key: "all", label: "Todas" },
              { key: "interior", label: "Bistro" },
              { key: "terraza", label: "Terraza" },
              { key: "gastroteca", label: "Gastroteca" },
            ].map((zone) => (
              <Button
                key={zone.key}
                type="button"
                size="sm"
                className="shrink-0"
                variant={selectedZone === zone.key ? "default" : "outline"}
                onClick={() => onSelectedZoneChange(zone.key)}
              >
                {zone.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2">
            <select
              value={selectedDay}
              onChange={(event) => onSelectedDayChange(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-[210px]"
              aria-label="Filtrar calendario por día"
            >
              <option value="week">Toda la semana</option>
              {weekDays.map((day) => (
                <option key={day.toISOString()} value={format(day, "yyyy-MM-dd")}>
                  {format(day, "EEEE d MMM", { locale: es })}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onWeekDateChange(addDays(weekDate, -7));
                onSelectedDayChange("week");
              }}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                onWeekDateChange(today);
                onSelectedDayChange(format(today, "yyyy-MM-dd"));
              }}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onWeekDateChange(addDays(weekDate, 7));
                onSelectedDayChange("week");
              }}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onToggleOpen}>
              {isOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              {isOpen ? "Ocultar" : "Ver calendario"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen && <CardContent>
        <div className="rounded-md border overflow-x-auto bg-background">
          <div className={isSingleDay ? "min-w-[520px]" : "min-w-[1120px]"}>
            <div
              className={[
                "grid border-b bg-muted/30",
                isSingleDay ? "grid-cols-[76px_minmax(380px,1fr)]" : "grid-cols-[76px_repeat(7,minmax(140px,1fr))]",
              ].join(" ")}
            >
              <div className="p-3 text-xs font-semibold text-muted-foreground">Hora</div>
              {days.map((day) => {
                const dayReservations = reservationsForDay(day);
                return (
                  <div key={day.toISOString()} className="p-3 border-l">
                    <div className="text-sm font-semibold capitalize">
                      {format(day, "EEE d", { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dayReservations.length} reserva{dayReservations.length === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isGastrotecaView && <>
              <div className="grid grid-cols-[76px_1fr] border-b bg-primary/10">
                <div className="px-3 py-2 text-xs font-semibold text-primary">Comida</div>
                <div className="px-3 py-2 border-l text-xs font-semibold text-primary">
                  Reservas de comida · 13:00 a 15:15
                </div>
              </div>
              {LUNCH_CALENDAR_SLOTS.map((slot) => renderSlotRow(slot))}
            </>}

            {(isGastrotecaView || selectedZone === "all") && <div className={isGastrotecaView ? "border-t-4 border-primary/30" : "mt-8 border-t-4 border-primary/30"}>
              <div className="grid grid-cols-[76px_1fr] border-b bg-primary/15">
                <div className="px-3 py-3 text-xs font-semibold text-primary">Noche</div>
                <div className="px-3 py-3 border-l text-xs font-semibold text-primary">
                  Cenas Gastroteca · solo servicio nocturno · 20:00 a 22:45
                </div>
              </div>
              {DINNER_CALENDAR_SLOTS.map((slot, index) =>
                renderSlotRow(slot, index === DINNER_CALENDAR_SLOTS.length - 1)
              )}
            </div>}
          </div>
        </div>
      </CardContent>}
    </Card>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reservas" | "canceladas" | "historial" | "notificaciones" | "menus" | "carta" | "bebidas" | "vinos" | "clientes">("reservas");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [history, setHistory] = useState<ReservationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date>();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());
  const [calendarSelectedDay, setCalendarSelectedDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calendarSelectedZone, setCalendarSelectedZone] = useState("all");
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [focusedReservationId, setFocusedReservationId] = useState<string | null>(null);
  const calendarSectionRef = useRef<HTMLDivElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrResult, setOcrResult] = useState<{
    open: boolean;
    loading: boolean;
    success: boolean;
    title: string;
    message: string;
    processed?: number;
    cancelled?: number;
  }>({
    open: false,
    loading: false,
    success: false,
    title: "",
    message: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, notifData, historyData] = await Promise.all([
        api.getAllReservations(),
        api.getAdminNotifications().catch(() => []),
        api.getReservationHistory().catch(() => []),
      ]);
      setReservations(resData);
      setNotifications(notifData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id + "delete");
    try {
      await api.adminDeleteReservation(deleteTarget.id);
      setReservations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const handleOcrImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const selectedDate = filterDate
      ? format(filterDate, "yyyy-MM-dd")
      : calendarSelectedDay === "week"
        ? format(new Date(), "yyyy-MM-dd")
        : calendarSelectedDay;

    setOcrLoading(true);
    setOcrStatus("Leyendo imagen...");
    setError(null);
    setOcrResult({
      open: true,
      loading: true,
      success: false,
      title: "Procesando foto",
      message: "Estamos preparando la imagen para leer la reserva. No cierres esta ventana.",
    });

    try {
      if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
        throw new Error("El formato HEIC/HEIF de iPhone no es compatible con el OCR. Cambia la cámara a formato JPEG o sube una captura en JPG/PNG.");
      }

      const preparedImage = await withTimeout(
        prepareOcrImage(file),
        15000,
        "La imagen tardó demasiado en prepararse. Intenta tomar la foto de nuevo o usa una imagen más clara.",
      );
      setOcrResult((current) => ({
        ...current,
        title: "Leyendo reserva",
        message: "El OCR está extrayendo el texto de la foto.",
      }));

      const result = await withTimeout(
        recognize(preparedImage, "eng", {
          workerBlobURL: false,
          logger: (message) => {
            if (message.status === "recognizing text") {
              const progressText = `Leyendo texto ${Math.round((message.progress || 0) * 100)}%`;
              setOcrStatus(progressText);
              setOcrResult((current) => ({
                ...current,
                message: progressText,
              }));
            }
          },
        }),
        45000,
        "El OCR tardó demasiado en leer la foto. Intenta con una imagen más nítida, tomada de frente y con buena luz.",
      );
      const text = result.data.text.trim();
      if (!text) throw new Error("No se detectó texto en la imagen.");

      setOcrStatus("Guardando reservas...");
      setOcrResult((current) => ({
        ...current,
        title: "Guardando reserva",
        message: "Ya leímos el texto. Estamos cargando la reserva en el panel.",
      }));
      const response = await withTimeout(
        api.processOcrReservations(selectedDate, text),
        20000,
        "La reserva fue leída, pero el servidor tardó demasiado en responder. Revisa la conexión y vuelve a intentarlo.",
      );
      await withTimeout(load(), 20000, "La reserva se guardó, pero no se pudo actualizar la lista automáticamente.");
      const processed = Number(response.reservasProcesadas) || 0;
      const cancelled = Number(response.reservasCanceladas) || 0;
      setOcrResult({
        open: true,
        loading: false,
        success: processed > 0,
        title: processed > 0 ? "Reserva cargada correctamente" : "No se detectaron reservas",
        message: processed > 0
          ? "La lectura OCR terminó y las reservas se guardaron en el panel."
          : "La foto se leyó, pero no se encontró ninguna línea con hora y cantidad de personas.",
        processed,
        cancelled,
      });
    } catch (err: any) {
      const message = err.message === "The string did not match the expected pattern."
        ? "No se pudo leer la foto en este navegador. Intenta tomarla de nuevo, con buena luz y el papel completo dentro de la imagen."
        : err.message || "No se pudo procesar la imagen OCR";
      setError(message);
      setOcrResult({
        open: true,
        loading: false,
        success: false,
        title: "No se pudo subir la reserva",
        message,
      });
    } finally {
      setOcrLoading(false);
      setOcrStatus("");
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem("supabase_session");
    navigate("/login");
  };

  const filtered = reservations.filter((r) => {
    if (r.status === "cancelled") return false; // cancelled have their own tab
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.id.toLowerCase().includes(q);
    const matchDate = !filterDate || r.date === format(filterDate, "yyyy-MM-dd");
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchZone = filterZone === "all" || r.zone === filterZone;
    return matchSearch && matchDate && matchStatus && matchZone;
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const active = reservations.filter((r) => r.status !== "cancelled");
  const availabilityDate = calendarSelectedDay === "week" ? today : calendarSelectedDay;
  const availabilityZones = calendarSelectedZone === "all" || calendarSelectedZone === "gastroteca"
    ? [...RESERVABLE_ZONES]
    : [calendarSelectedZone];
  const availableTablesByZone = availabilityZones.map((zone) => ({
    zone,
    label: ZONE_LABELS[zone] || zone,
    lunch: calculateAvailableTablesForTurn(reservations, availabilityDate, "lunch", zone),
    dinner: calculateAvailableTablesForTurn(reservations, availabilityDate, "dinner", zone),
  }));
  const stats = {
    total: active.length,
    confirmed: active.filter((r) => r.status === "confirmed").length,
    today: active.filter((r) => r.date === today).length,
  };

  const focusReservationInCalendar = (reservation: Reservation) => {
    if (!reservation.date) return;
    setCalendarWeekDate(new Date(`${reservation.date}T12:00:00`));
    setCalendarSelectedDay(reservation.date);
    setCalendarSelectedZone(reservation.zone || "all");
    setCalendarOpen(true);
    setFocusedReservationId(reservation.id);
    window.setTimeout(() => {
      calendarSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Panel de Administración
            </h1>
            <p className="text-muted-foreground mt-1">El Cafetín de Pontevedra · Gestión de reservas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          {([
            { key: "reservas",        label: "Reservas",       icon: <CalendarIcon className="h-4 w-4" />,      badge: null },
            { key: "canceladas",      label: "Canceladas",     icon: <XCircle className="h-4 w-4" />,          badge: reservations.filter(r => r.status === "cancelled").length },
            { key: "historial",       label: "Historial",      icon: <History className="h-4 w-4" />,          badge: null },
            { key: "notificaciones",  label: "Notificaciones", icon: <Bell className="h-4 w-4" />,             badge: notifications.filter(n => !n.read).length },
            { key: "menus",           label: "Menús",          icon: <UtensilsCrossed className="h-4 w-4" />,  badge: null },
            { key: "carta",           label: "Carta",          icon: <UtensilsCrossed className="h-4 w-4" />,  badge: null },
            { key: "bebidas",         label: "Bebidas",        icon: <Wine className="h-4 w-4" />,             badge: null },
            { key: "vinos",           label: "Vinos",          icon: <Wine className="h-4 w-4" />,             badge: null },
            { key: "clientes",        label: "Clientes",       icon: <Users className="h-4 w-4" />,            badge: null },
          ] as const).map(({ key, label, icon, badge }) => (
            <button
              key={key}
              onClick={async () => {
                setActiveTab(key);
                // Auto-clear notification badge when entering Canceladas
                if (key === "canceladas" && notifications.some((n) => !n.read)) {
                  await api.markAllNotificationsRead().catch(() => {});
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }
              }}
              className={[
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {icon}{label}
              {badge !== null && badge > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "clientes" && <ClientesTab />}

        {activeTab === "menus" && <MenusTab />}

        {activeTab === "carta" && <GeneralMenuTab />}

        {activeTab === "bebidas" && <BeveragesTab />}

        {activeTab === "vinos" && <WineListTab />}

        {activeTab === "notificaciones" && (
          <NotificacionesTab
            notifications={notifications}
            onMarkRead={async () => {
              await api.markAllNotificationsRead();
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
          />
        )}

        {activeTab === "historial" && (
          <HistorialReservasTab history={history} loading={loading} />
        )}

        {activeTab === "canceladas" && (
          <CanceladasTab
            reservations={reservations}
            loading={loading}
            onRestore={async (id) => {
              const data = await api.updateReservationStatus(id, "confirmed");
              setReservations((prev) =>
                prev.map((reservation) =>
                  reservation.id === id
                    ? { ...reservation, ...data.reservation, status: "confirmed" }
                    : reservation
                )
              );
              await load();
              setActiveTab("reservas");
            }}
          />
        )}


        {activeTab === "reservas" && <>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
            { label: "Confirmadas", value: stats.confirmed, icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
            {
              label: "Mesas disponibles",
              value: availableTablesByZone.reduce((total, item) => total + item.lunch, 0),
              hint: "Comida / noche",
              details: availableTablesByZone.map((item) => ({
                label: item.label,
                value: `${item.lunch}/${item.dinner}`,
                className: ZONE_COLOR_STYLES[item.zone] || "bg-muted text-foreground border-border",
              })),
              icon: <UtensilsCrossed className="h-4 w-4 text-primary" />,
            },
            { label: "Hoy", value: stats.today, icon: <CalendarIcon className="h-4 w-4 text-blue-600" /> },
          ].map(({ label, value, hint, details, icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "–" : value}</div>
                {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
                {details && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {details.map((detail) => (
                      <div
                        key={detail.label}
                        className={[
                          "rounded border px-2 py-1.5 text-center font-semibold",
                          detail.className,
                        ].join(" ")}
                      >
                        <div className="text-[10px] leading-none truncate">{detail.label}</div>
                        <div className="mt-1 text-xl font-bold leading-none">{detail.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
            <CardDescription>Lista completa · {filtered.length} resultados</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nombre, email, teléfono, ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <input
                ref={ocrInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleOcrImage}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2 shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => ocrInputRef.current?.click()}
                disabled={ocrLoading}
              >
                {ocrLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {ocrLoading ? ocrStatus || "Escaneando..." : "Escanear reserva"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0">
                    <CalendarIcon className="h-4 w-4" />
                    {filterDate ? format(filterDate, "dd/MM/yyyy") : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} locale={es} />
                  {filterDate && (
                    <div className="p-3 border-t">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterDate(undefined)}>
                        Limpiar
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  <SelectItem value="terraza">GastroGarden</SelectItem>
                  <SelectItem value="interior">Bistro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Cargando reservas…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No se encontraron reservas con los filtros seleccionados
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="whitespace-nowrap">Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/60"
                        title="Ver esta reserva en el calendario"
                        onClick={() => focusReservationInCalendar(r)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {r.id.replace("RES-", "#")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          {r.comments && (
                            <button
                              className="flex items-center gap-1 text-xs text-primary mt-0.5"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedComments(expandedComments === r.id ? null : r.id);
                              }}
                            >
                              <MessageSquare className="h-3 w-3" />
                              Nota
                            </button>
                          )}
                          {expandedComments === r.id && r.comments && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] break-words">
                              {r.comments}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{r.phone}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {r.date
                            ? format(new Date(r.date + "T12:00:00"), "dd MMM yyyy", { locale: es })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{r.time}</TableCell>
                        <TableCell className="text-center">{r.guests}</TableCell>
                        <TableCell>
                          <span className="text-sm whitespace-nowrap">
                            {getReservationZoneLabel(r)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "confirmed" ? "default"
                              : r.status === "pending" ? "secondary"
                              : r.status === "cancelled" ? "destructive"
                              : "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {STATUS_LABELS[r.status] || r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Eliminar reserva"
                              disabled={!!actionLoading}
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(r);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div ref={calendarSectionRef}>
          <ReservationCalendarView
            reservations={reservations}
            weekDate={calendarWeekDate}
            onWeekDateChange={setCalendarWeekDate}
            selectedDay={calendarSelectedDay}
            onSelectedDayChange={setCalendarSelectedDay}
            selectedZone={calendarSelectedZone}
            onSelectedZoneChange={setCalendarSelectedZone}
            isOpen={calendarOpen}
            onToggleOpen={() => setCalendarOpen((open) => !open)}
            focusedReservationId={focusedReservationId}
          />
        </div>

        </>}
      </div>

      <NewReservationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreated={load}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la reserva de <strong>{deleteTarget?.name}</strong> del{" "}
              {deleteTarget?.date} a las {deleteTarget?.time}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={ocrResult.open}
        onOpenChange={(open) => setOcrResult((current) => ({ ...current, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {ocrResult.loading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              ) : ocrResult.success ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {ocrResult.title}
            </DialogTitle>
            <DialogDescription>{ocrResult.message}</DialogDescription>
          </DialogHeader>

          {ocrResult.processed !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-primary/10 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{ocrResult.processed}</div>
                <div className="text-xs text-muted-foreground">Procesadas</div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-center">
                <div className="text-2xl font-bold">{ocrResult.cancelled || 0}</div>
                <div className="text-xs text-muted-foreground">Canceladas</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={ocrResult.loading}
              onClick={() => setOcrResult((current) => ({ ...current, open: false }))}
            >
              {ocrResult.loading ? "Procesando..." : "Entendido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page entry ───────────────────────────────────────────────────────────────

export function AdminPanelPage() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }
        if (session.user.email !== "admin@elcafetin.com") {
          setAuthState("denied");
          return;
        }
        localStorage.setItem("supabase_session", JSON.stringify(session));
        setAuthState("ok");
      });
  }, [navigate]);

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verificando acceso…</p>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              Tu cuenta no tiene permisos de administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate("/profile")}>Ir a mi perfil</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await getSupabase().auth.signOut();
                localStorage.removeItem("supabase_session");
                navigate("/login");
              }}
            >
              Cambiar de cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}
