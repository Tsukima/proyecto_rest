import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { CalendarIcon, Check, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "../../utils/supabase-client";

type ZoneInfo = { total: number; reserved: number; available: number; canFit?: boolean };
type ZoneAvailability = Record<string, ZoneInfo>;

type ReservationForm = {
  guests: string;
  date: Date;
  time: string;
  zone: string;
  comments?: string;
};

const ZONE_LABELS: Record<string, string> = {
  terraza: "GastroGarden",
  interior: "Bistro",
  cafeteria: "Cafetería",
};

const ZONE_DESCRIPTIONS: Record<string, string> = {
  terraza: "Terraza exterior",
  interior: "Comedor interior",
  cafeteria: "Zona cafetería",
};

function isSunday(date: Date) {
  return date.getDay() === 0;
}

function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

function isPastReservationDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const reservationDate = new Date(date);
  reservationDate.setHours(hours, minutes, 0, 0);
  return reservationDate.getTime() <= Date.now();
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function toICSDate(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function addMinutes(date: Date, time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m + mins, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function googleCalendarUrl(data: ReservationForm & { date: Date }): string {
  const start = toICSDate(data.date, data.time);
  const end = addMinutes(data.date, data.time, 120);
  const zone = ZONE_LABELS[data.zone] || data.zone;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Reserva · El Cafetín de Pontevedra",
    dates: `${start}/${end}`,
    details: `Mesa para ${data.guests} persona(s) · Zona ${zone}${data.comments ? `\n\nNota: ${data.comments}` : ""}`,
    location: "El Cafetín de Pontevedra, Pontevedra, España",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(data: ReservationForm & { date: Date }) {
  const start = toICSDate(data.date, data.time);
  const end = addMinutes(data.date, data.time, 120);
  const zone = ZONE_LABELS[data.zone] || data.zone;
  const description = `Mesa para ${data.guests} persona(s) · Zona ${zone}${data.comments ? ` · Nota: ${data.comments}` : ""}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//El Cafetín//Reservas//ES",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SUMMARY:Reserva · El Cafetín de Pontevedra",
    `DESCRIPTION:${description}`,
    "LOCATION:El Cafetín de Pontevedra\\, Pontevedra\\, España",
    `UID:${Date.now()}@elcafetin`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reserva-elcafetin.ics";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReservationsPage() {
  const [date, setDate] = useState<Date>();
  const [confirmed, setConfirmed] = useState(false);
  const [reservationData, setReservationData] = useState<(ReservationForm & { date: Date }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoneAvailability, setZoneAvailability] = useState<ZoneAvailability>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; phone: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ReservationForm>();

  useEffect(() => {
    api.getProfile()
      .then((p) => setUserProfile({ name: p.user.name || "", phone: p.user.phone || "" }))
      .catch(() => {});
  }, []);

  const selectedZone = watch("zone");
  const selectedTime = watch("time");
  const selectedGuests = watch("guests");

  useEffect(() => {
    if (!date || !selectedTime) { setZoneAvailability({}); return; }
    const dateStr = format(date, "yyyy-MM-dd");
    setLoadingAvailability(true);
    api.getZoneAvailability(dateStr, selectedTime, selectedGuests)
      .then(setZoneAvailability)
      .finally(() => setLoadingAvailability(false));
  }, [date, selectedTime, selectedGuests]);

  useEffect(() => {
    if (selectedZone && zoneAvailability[selectedZone]?.canFit === false) {
      setValue("zone", "");
    }
  }, [zoneAvailability, selectedZone, setValue]);

  const onSubmit = async (data: ReservationForm) => {
    if (!date)        { setError("Por favor selecciona una fecha"); return; }
    if (isSunday(date)) { setError("Los domingos estamos cerrados. Por favor selecciona otro día."); return; }
    if (!data.guests) { setError("Por favor selecciona el número de personas"); return; }
    if (!data.time)   { setError("Por favor selecciona una hora"); return; }
    if (isPastReservationDateTime(date, data.time)) { setError("Esa hora ya pasó. Por favor selecciona una hora posterior a la hora actual."); return; }
    if (!data.zone)   { setError("Por favor selecciona una zona"); return; }

    setLoading(true);
    setError(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      await api.createReservation({
        ...data,
        date: dateStr,
        name: userProfile?.name || "",
        phone: userProfile?.phone || "",
      });
      setReservationData({ ...data, date });
      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || "Error al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmation screen ───────────────────────────────────────────────────

  if (confirmed && reservationData) {
    const rd = reservationData;

    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/30">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">¡Reserva Confirmada!</CardTitle>
            <CardDescription className="text-lg">Te esperamos en El Cafetín</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-muted/50 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Personas</p>
                  <p className="font-medium">
                    {rd.guests} {parseInt(rd.guests) === 1 ? "persona" : "personas"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="font-medium">{ZONE_LABELS[rd.zone] || rd.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{format(rd.date, "PPP", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora de llegada</p>
                  <p className="font-medium">{rd.time}</p>
                </div>
              </div>
            </div>

            {rd.comments && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Nota:</p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{rd.comments}</p>
              </div>
            )}

            {/* Calendar buttons */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-center">Añadir al calendario</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => window.open(googleCalendarUrl(rd), "_blank")}
                >
                  {/* Google Calendar icon */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Google Calendar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => downloadICS(rd)}
                >
                  {/* Apple / iCal icon */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple / iCal
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                El archivo .ics también funciona en Outlook y otros calendarios
              </p>
            </div>

            {/* Nav buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => (window.location.href = "/")}>
                Volver al Inicio
              </Button>
              <Button className="flex-1" onClick={() => (window.location.href = "/profile")}>
                Ver Mis Reservas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  const bistroFull = zoneAvailability["interior"]?.canFit === false && date && selectedTime;

  return (
    <div className="min-h-screen py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Reserva tu Mesa</h1>
          <p className="text-lg text-muted-foreground">Completa el formulario y asegura tu lugar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Reserva</CardTitle>
            <CardDescription>Todos los campos son obligatorios</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="guests">Número de personas</Label>
                  <Select onValueChange={(value) => setValue("guests", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "persona" : "personas"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => isBeforeToday(d) || isSunday(d)}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="time">Hora</Label>
                  <Select onValueChange={(value) => setValue("time", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} disabled={date ? isPastReservationDateTime(date, time) : false}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Zona */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Zona preferida</Label>
                  {loadingAvailability && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Actualizando disponibilidad…
                    </span>
                  )}
                </div>

                {bistroFull && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Bistro al completo</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        No hay capacidad suficiente en el Bistro para ese número de personas en este turno. Puedes reservar en GastroGarden.
                      </p>
                    </div>
                  </div>
                )}

                <RadioGroup
                  onValueChange={(value) => setValue("zone", value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {(["terraza", "interior"] as const).map((zone) => {
                    const info = zoneAvailability[zone];
                    const isFull = info?.canFit === false && date && selectedTime;
                    const showCount = !!info && date && selectedTime;
                    return (
                      <div key={zone}>
                        <RadioGroupItem value={zone} id={zone} className="peer sr-only" disabled={!!isFull} />
                        <Label
                          htmlFor={zone}
                          className={[
                            "flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all",
                            isFull
                              ? "border-muted bg-muted/40 opacity-50 cursor-not-allowed"
                              : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer",
                          ].join(" ")}
                        >
                          <span className="text-lg font-medium">{ZONE_LABELS[zone]}</span>
                          <span className="text-sm text-muted-foreground text-center mt-1">
                            {ZONE_DESCRIPTIONS[zone]}
                          </span>
                          {showCount ? (
                            <span className={[
                              "mt-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                              isFull ? "bg-red-100 text-red-700"
                                : info.available <= 8 ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800",
                            ].join(" ")}>
                              {isFull ? "Sin disponibilidad" : `${info.available} de ${info.total} plazas libres`}
                            </span>
                          ) : (
                            <span className="mt-2 text-xs text-muted-foreground">
                              {zone === "terraza" ? "17 mesas · 60 plazas" : zone === "interior" ? "12 mesas · 40 plazas" : "14 mesas · 28 plazas"}
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comentarios adicionales (opcional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Celebración especial, alergias, petición de mesa…"
                  rows={3}
                  className="resize-none"
                  {...register("comments")}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading || !date}>
                {loading ? "Creando reserva..." : "Confirmar Reserva"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const timeSlots = [
  "13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15",
  "20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45","22:00",
];
