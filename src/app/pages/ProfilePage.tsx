import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import { User, Calendar, Clock, MapPin, Mail, Phone, BadgeCheck, History, AlertTriangle, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "../../utils/supabase-client";

const ZONE_LABELS: Record<string, string> = {
  terraza: "GastroGarden",
  interior: "Bistro",
  cafeteria: "Cafetería",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmada", variant: "default" },
  pending:   { label: "Pendiente",  variant: "secondary" },
  cancelled: { label: "Cancelada",  variant: "destructive" },
  completed: { label: "Completada", variant: "outline" },
};

type Reservation = {
  id: string;
  date: string;
  time: string;
  guests: string | number;
  zone: string;
  status: string;
  comments?: string;
  created_at?: string;
};

function ReservationCard({
  reservation,
  isPastReservation,
  onCancel,
  canceling,
}: {
  reservation: Reservation;
  isPastReservation: boolean;
  onCancel: (r: Reservation) => void;
  canceling: boolean;
}) {
  const statusInfo = STATUS_BADGE[reservation.status] || { label: reservation.status, variant: "outline" as const };
  const dateFormatted = reservation.date
    ? format(parseISO(reservation.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    : reservation.date;

  return (
    <Card className={isPastReservation ? "opacity-75" : "hover:shadow-md transition-shadow"}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base font-semibold capitalize">{dateFormatted}</CardTitle>
            <CardDescription className="mt-0.5">
              {reservation.time} · {reservation.guests}{" "}
              {Number(reservation.guests) === 1 ? "persona" : "personas"}
            </CardDescription>
          </div>
          <Badge variant={statusInfo.variant} className="shrink-0">{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{ZONE_LABELS[reservation.zone] || reservation.zone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{reservation.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>{reservation.guests} {Number(reservation.guests) === 1 ? "persona" : "personas"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-mono">{reservation.id.replace("RES-", "#")}</span>
          </div>
        </div>

        {reservation.comments && (
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-700 whitespace-pre-wrap">{reservation.comments}</p>
          </div>
        )}

        {!isPastReservation && reservation.status !== "cancelled" && reservation.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => onCancel(reservation)}
            disabled={canceling}
          >
            {canceling ? "Cancelando…" : "Cancelar reserva"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; phone?: string; code?: string } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadReservations = async () => {
    try {
      const data = await api.getUserReservations();
      setReservations(data.reservations || []);
    } catch {
      setReservations([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!api.isAuthenticated()) { navigate("/login"); return; }
        const profileData = await api.getProfile();
        setUser(profileData.user);
        await loadReservations();
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const openCancelDialog = (reservation: Reservation) => {
    setCancelTarget(reservation);
    setCancelReason("");
    setCancelError(null);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) { setCancelError("Por favor indica el motivo de la cancelación"); return; }

    setCancelingId(cancelTarget.id);
    setCancelError(null);
    try {
      await api.cancelReservation(cancelTarget.id, cancelReason.trim());
      await loadReservations();
      setCancelTarget(null);
    } catch (err: any) {
      setCancelError(err.message || "No se pudo cancelar la reserva");
    } finally {
      setCancelingId(null);
    }
  };

  const handleLogout = async () => {
    await api.signout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = reservations
    .filter((r) => {
      if (!r.date) return false;
      const d = parseISO(r.date);
      return d >= today && r.status !== "cancelled";
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const history = reservations
    .filter((r) => {
      if (!r.date) return true;
      const d = parseISO(r.date);
      return d < today || r.status === "cancelled" || r.status === "completed";
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  return (
    <div className="min-h-screen py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-center">{user.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="break-all">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.code && (
                  <div className="flex flex-col gap-1 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Código de cliente
                    </div>
                    <p className="font-mono font-bold text-lg text-primary tracking-widest">
                      {user.code}
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t space-y-2">
                  {user.email === "admin@elcafetin.com" && (
                    <Link to="/admin" className="block">
                      <Button className="w-full gap-2 bg-primary/90">
                        <ShieldCheck className="h-4 w-4" />
                        Panel de Administración
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Cerrar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Mis Reservas</h2>
              <p className="text-muted-foreground mt-1">
                {upcoming.length} próxima{upcoming.length !== 1 ? "s" : ""} · {history.length} en historial
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
              <button
                onClick={() => setTab("upcoming")}
                className={[
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === "upcoming"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Calendar className="h-4 w-4" />
                Próximas
                {upcoming.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                    {upcoming.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("history")}
                className={[
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <History className="h-4 w-4" />
                Historial
                {history.length > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {/* Upcoming */}
            {tab === "upcoming" && (
              <div className="space-y-4">
                {upcoming.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-14 w-14 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-bold mb-2">No tienes reservas próximas</h3>
                      <p className="text-muted-foreground text-center mb-6">
                        {history.length > 0
                          ? "No hay reservas activas en este momento. Revisa la pestaña Historial para ver reservas anteriores."
                          : "No hay reservas activas en este momento"}
                      </p>
                      {history.length > 0 && (
                        <Button variant="outline" onClick={() => setTab("history")}>
                          Ver historial
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  upcoming.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      isPastReservation={false}
                      onCancel={openCancelDialog}
                      canceling={cancelingId === r.id}
                    />
                  ))
                )}
              </div>
            )}

            {/* History */}
            {tab === "history" && (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <History className="h-14 w-14 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-bold mb-2">Sin historial todavía</h3>
                      <p className="text-muted-foreground text-center">
                        Aquí aparecerán tus visitas pasadas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  history.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      isPastReservation={true}
                      onCancel={openCancelDialog}
                      canceling={cancelingId === r.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  {format(parseISO(cancelTarget.date), "EEEE d 'de' MMMM", { locale: es })} a las {cancelTarget.time}
                  {" · "}{cancelTarget.guests} {Number(cancelTarget.guests) === 1 ? "persona" : "personas"}
                  {" · "}{ZONE_LABELS[cancelTarget.zone] || cancelTarget.zone}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800">
                Solo puedes cancelar hasta <strong>45 minutos antes</strong> de la hora de tu reserva.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo de la cancelación *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Ej: Cambio de planes, no podemos asistir, urgencia familiar…"
                rows={3}
                className="resize-none"
                value={cancelReason}
                onChange={(e) => { setCancelReason(e.target.value); setCancelError(null); }}
              />
            </div>

            {cancelError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{cancelError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!!cancelingId}
            >
              {cancelingId ? "Cancelando…" : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
