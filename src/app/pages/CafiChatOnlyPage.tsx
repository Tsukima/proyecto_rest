import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, BadgeCheck, CalendarDays, Clock, Send, Trash2, Users } from "lucide-react";
import cafiAvatar from "../../imports/cafi-avatar-transparent.png";
import { api } from "../../utils/supabase-client";

type ChatStep = "idle" | "date" | "service" | "time" | "guests" | "zone" | "name" | "phone" | "done";
type Message = {
  id: string;
  from: "bot" | "user";
  text: string;
  actions?: ChatAction[];
  showRegisterCard?: boolean;
};
type ChatAction = {
  label: string;
  value?: string;
  href?: string;
  kind?: "calendar";
  tone?: "primary" | "soft";
};
type ReservationDraft = {
  date?: string;
  dateLabel?: string;
  service?: "comida" | "cena";
  time?: string;
  guests?: number;
  zone?: "terraza" | "interior" | "cafeteria";
  name?: string;
  phone?: string;
};

const CHAT_OPTIONS: ChatAction[] = [
  { label: "Quiero hacer una reserva", value: "Quiero hacer una reserva", tone: "primary" },
  { label: "Grupo de más de 10 personas", value: "Quiero reservar para un grupo de mas de 10 personas" },
  { label: "Catering / Evento", value: "Quiero hacer un Catering/Evento" },
];

const LUNCH_TIME_OPTIONS = [
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
];

const DINNER_TIME_OPTIONS = [
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
  "22:15",
  "22:30",
  "22:45",
];

const DINNER_TIME_OPTIONS_MONDAY_TO_WEDNESDAY = [
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
];

const DINNER_TIME_OPTIONS_THURSDAY_TO_SATURDAY = [
  "20:00",
  "20:15",
  "20:30",
  "20:45",
  "21:00",
  "21:15",
  "21:30",
  "21:45",
  "22:00",
  "22:15",
  "22:30",
  "22:45",
];

const TIME_OPTIONS = [...LUNCH_TIME_OPTIONS, ...DINNER_TIME_OPTIONS];

const SERVICE_OPTIONS: ChatAction[] = [
  { label: "Comida", value: "Comida", tone: "primary" },
  { label: "Cena", value: "Cena" },
];

const GUEST_OPTIONS: ChatAction[] = Array.from({ length: 10 }, (_, index) => {
  const guests = index + 1;
  return {
    label: String(guests),
    value: String(guests),
    tone: guests === 2 ? "primary" : "soft",
  };
});

const ZONE_OPTIONS: ChatAction[] = [
  { label: "Terraza", value: "Terraza", tone: "primary" },
  { label: "Comedor", value: "Comedor" },
];

const DINNER_MONDAY_TO_WEDNESDAY_ZONE_OPTIONS: ChatAction[] = [
  { label: "Terraza", value: "Terraza", tone: "primary" },
  { label: "Cafetería", value: "Cafetería" },
];

const DINNER_THURSDAY_TO_SATURDAY_ZONE_OPTIONS: ChatAction[] = [
  { label: "Terraza", value: "Terraza", tone: "primary" },
  { label: "Gastroteca", value: "Gastroteca" },
];

const zoneLabels: Record<NonNullable<ReservationDraft["zone"]>, string> = {
  terraza: "GastroGarden",
  interior: "Bistro",
  cafeteria: "Cafetería",
};

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function firstNameFromProfileName(name?: string) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSundayIsoDate(date: string) {
  return new Date(`${date}T12:00:00`).getDay() === 0;
}

function getDinnerTimeOptionsForDate(date?: string) {
  if (!date) return DINNER_TIME_OPTIONS;
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return weekday >= 1 && weekday <= 3
    ? DINNER_TIME_OPTIONS_MONDAY_TO_WEDNESDAY
    : DINNER_TIME_OPTIONS_THURSDAY_TO_SATURDAY;
}

function getDinnerHoursLabel(date?: string) {
  if (!date) return "Horas cenas: lunes a miércoles 20:00 - 21:30; jueves a sábado 20:00 - 22:45.";
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return weekday >= 1 && weekday <= 3
    ? "Horas cenas: 20:00 - 21:30."
    : "Horas cenas: 20:00 - 22:45.";
}

function isDinnerMondayToWednesday(draft: ReservationDraft) {
  if (draft.service !== "cena" || !draft.date) return false;
  const weekday = new Date(`${draft.date}T12:00:00`).getDay();
  return weekday >= 1 && weekday <= 3;
}

function isDinnerThursdayToSaturday(draft: ReservationDraft) {
  if (draft.service !== "cena" || !draft.date) return false;
  const weekday = new Date(`${draft.date}T12:00:00`).getDay();
  return weekday >= 4 && weekday <= 6;
}

function getZoneOptionsForDraft(draft: ReservationDraft) {
  if (isDinnerMondayToWednesday(draft)) return DINNER_MONDAY_TO_WEDNESDAY_ZONE_OPTIONS;
  if (isDinnerThursdayToSaturday(draft)) return DINNER_THURSDAY_TO_SATURDAY_ZONE_OPTIONS;
  return ZONE_OPTIONS;
}

function getZonePromptForDraft(draft: ReservationDraft) {
  if (isDinnerMondayToWednesday(draft)) {
    return "Gracias. Para cenas de lunes a miércoles, ¿le gustaría terraza o cafetería?";
  }
  if (isDinnerThursdayToSaturday(draft)) {
    return "Gracias. Para cenas de jueves a sábado, ¿le gustaría terraza o Gastroteca?";
  }
  return "Gracias. ¿Le gustaría terraza o comedor?";
}

function getZoneLabelForDraft(draft: ReservationDraft) {
  if (draft.zone === "interior" && isDinnerThursdayToSaturday(draft)) return "Gastroteca";
  return draft.zone ? zoneLabels[draft.zone] : "";
}

function isPastReservationDateTime(date: string, time: string) {
  const reservationDate = new Date(`${date}T${time}:00`);
  return reservationDate.getTime() <= Date.now();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseDate(text: string) {
  const value = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const now = new Date();
  const addDays = (days: number) => {
    const date = new Date(now);
    date.setDate(now.getDate() + days);
    return { iso: toIsoDate(date), label: days === 0 ? "hoy" : days === 1 ? "mañana" : toIsoDate(date) };
  };

  if (value.includes("hoy")) return addDays(0);
  if (value.includes("pasado manana")) return addDays(2);
  if (value.includes("manana")) return addDays(1);

  const iso = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return { iso: toIsoDate(date), label: toIsoDate(date) };
  }

  const slash = value.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (slash) {
    const date = new Date(Number(slash[3] || now.getFullYear()), Number(slash[2]) - 1, Number(slash[1]));
    return { iso: toIsoDate(date), label: toIsoDate(date) };
  }

  const weekdays = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const weekdayIndex = weekdays.findIndex((day) => value.includes(day));
  if (weekdayIndex >= 0) {
    const date = new Date(now);
    const diff = (weekdayIndex - now.getDay() + 7) % 7 || 7;
    date.setDate(now.getDate() + diff);
    return { iso: toIsoDate(date), label: capitalize(weekdays[weekdayIndex]) };
  }

  return null;
}

function parseTime(text: string) {
  const value = text.toLowerCase();
  const match = value.match(/\b([01]?\d|2[0-3])(?::|\.|h)?\s*([0-5]\d)?\b/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const normalizedMinutes = Math.round(minutes / 15) * 15;
  const safeMinutes = normalizedMinutes === 60 ? 0 : normalizedMinutes;
  const safeHour = normalizedMinutes === 60 ? hour + 1 : hour;
  const time = `${String(safeHour).padStart(2, "0")}:${String(safeMinutes).padStart(2, "0")}`;
  return TIME_OPTIONS.includes(time) ? time : null;
}

function parseService(text: string): ReservationDraft["service"] | null {
  const value = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (value.includes("comida") || value.includes("comer") || value.includes("mediodia") || value.includes("almuerzo")) return "comida";
  if (value.includes("cena") || value.includes("cenar") || value.includes("noche") || value.includes("gastroteca")) return "cena";
  return null;
}

function parseGuests(text: string) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function parseZone(text: string): ReservationDraft["zone"] | null {
  const value = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (value.includes("gastroteca")) return "interior";
  if (value.includes("terraza") || value.includes("garden") || value.includes("gastro")) return "terraza";
  if (value.includes("comedor") || value.includes("bistro") || value.includes("interior") || value.includes("dentro")) return "interior";
  if (value.includes("cafeter")) return "cafeteria";
  return null;
}

function isValidPhone(text: string) {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 18;
}

function buildCalendarLink(draft: Required<Pick<ReservationDraft, "date" | "time" | "guests" | "zone" | "name">>) {
  const start = `${draft.date.replace(/-/g, "")}T${draft.time.replace(":", "")}00`;
  const [hour, minute] = draft.time.split(":").map(Number);
  const endDate = new Date(`${draft.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
  endDate.setMinutes(endDate.getMinutes() + 90);
  const end = `${toIsoDate(endDate).replace(/-/g, "")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Reserva en El Cafetín",
    dates: `${start}/${end}`,
    details: `Reserva para ${draft.guests} persona(s). Zona: ${zoneLabels[draft.zone]}. Nombre: ${draft.name}.`,
    location: "El Cafetín Pontevedra",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function CafiChatOnlyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<ReservationDraft>({});
  const [step, setStep] = useState<ChatStep>("idle");
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [customerFirstName, setCustomerFirstName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const initialActions = useMemo(() => CHAT_OPTIONS, []);

  const initialWelcomeText = (name = customerFirstName) =>
    name
      ? `Hola ${name}, bienvenid@ al Cafetín. Soy Cafi y puedo ayudarle con una reserva o derivarle con el encargado para grupos y eventos.`
      : "Bienvenid@ al Cafetín. Soy Cafi y puedo ayudarle con una reserva o derivarle con el encargado para grupos y eventos.";

  const reservationWelcomeText = () =>
    customerFirstName
      ? `Hola ${customerFirstName}, bienvenid@ al Cafetín. ¿Podría indicarme el día que le gustaría reservar?`
      : "Bienvenid@ al Cafetín, ¿podría indicarme el día que le gustaría reservar?";

  useEffect(() => {
    setMessages([
      {
        id: messageId(),
        from: "bot",
        text: initialWelcomeText(""),
        actions: initialActions,
      },
    ]);
  }, [initialActions]);

  useEffect(() => {
    let isMounted = true;

    api.getProfile()
      .then((profile) => {
        if (!isMounted) return;
        const firstName = firstNameFromProfileName(profile.user?.name);
        if (!firstName) return;

        setCustomerFirstName(firstName);
        setMessages((prev) => {
          if (prev.length !== 1 || prev[0]?.from !== "bot" || step !== "idle") return prev;
          return [{ ...prev[0], text: initialWelcomeText(firstName) }];
        });
      })
      .catch(() => {
        // Invitados: se mantiene el saludo general.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const clockTime = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const clockDate = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const addBot = (text: string, actions?: ChatAction[]) => {
    setMessages((prev) => [...prev, { id: messageId(), from: "bot", text, actions }]);
  };

  const addBotWithRegisterCard = (text: string, actions?: ChatAction[]) => {
    setMessages((prev) => [...prev, { id: messageId(), from: "bot", text, actions, showRegisterCard: true }]);
  };

  const addUser = (text: string) => {
    setMessages((prev) => [...prev, { id: messageId(), from: "user", text }]);
  };

  const resetChat = () => {
    setDraft({});
    setStep("idle");
    setInput("");
    setMessages([
      {
        id: messageId(),
        from: "bot",
        text: customerFirstName ? `Chat limpio, ${customerFirstName}. ¿En qué puedo ayudarle?` : "Chat limpio. ¿En qué puedo ayudarle?",
        actions: CHAT_OPTIONS,
      },
    ]);
  };

  const showContactManager = () => {
    setStep("done");
    addBot("Para poder realizar la reserva, debe comunicarse directamente a nuestro WhatsApp. Pulse el enlace para contactar con el Encargado.", [
      { label: "Contactar con el Encargado", href: "https://wa.me/34618044843", tone: "primary" },
      { label: "Limpiar chat", value: "__clear" },
    ]);
  };

  const askDate = (nextDraft = draft) => {
    setDraft(nextDraft);
    setStep("date");
    addBot(reservationWelcomeText(), [
      { label: "Elegir fecha", kind: "calendar", tone: "primary" },
    ]);
  };

  const askService = (nextDraft: ReservationDraft) => {
    setDraft(nextDraft);
    setStep("service");
    addBot("Perfecto. ¿La reserva es para comida o para cena?", SERVICE_OPTIONS);
  };

  const askTime = (nextDraft: ReservationDraft) => {
    setDraft(nextDraft);
    setStep("time");
    const baseOptions = nextDraft.service === "cena" ? getDinnerTimeOptionsForDate(nextDraft.date) : LUNCH_TIME_OPTIONS;
    const options = nextDraft.date
      ? baseOptions.filter((time) => !isPastReservationDateTime(nextDraft.date!, time))
      : baseOptions;
    const label = nextDraft.service === "cena"
      ? `${getDinnerHoursLabel(nextDraft.date)}\n¿Qué hora prefiere?`
      : "Horas comidas: 13:00 - 15:15.\n¿Qué hora prefiere?";
    if (options.length === 0) {
      addBot("Para ese día ya no quedan horarios disponibles porque las horas de reserva ya pasaron. ¿Podría elegir otro día?", [
        { label: "Elegir fecha", kind: "calendar", tone: "primary" },
      ]);
      setStep("date");
      return;
    }
    addBot(
      label,
      options.map((time) => ({ label: time, value: time })),
    );
  };

  const askGuests = (nextDraft: ReservationDraft) => {
    if (nextDraft.guests) {
      askZone(nextDraft);
      return;
    }
    setDraft(nextDraft);
    setStep("guests");
    addBot("Muy bien. ¿Cuántos comensales serán?", GUEST_OPTIONS);
  };

  const askZone = (nextDraft: ReservationDraft) => {
    setDraft(nextDraft);
    setStep("zone");
    addBot(getZonePromptForDraft(nextDraft), getZoneOptionsForDraft(nextDraft));
  };

  const askName = (nextDraft: ReservationDraft) => {
    setDraft(nextDraft);
    setStep("name");
    addBot("Perfecto. Ahora necesito nombre y apellido para la reserva.");
  };

  const askPhone = (nextDraft: ReservationDraft) => {
    setDraft(nextDraft);
    setStep("phone");
    addBot("Gracias. Para terminar, indíqueme un número de teléfono de contacto para la reserva.");
  };

  const confirmReservation = async (nextDraft: ReservationDraft) => {
    if (!nextDraft.date || !nextDraft.time || !nextDraft.guests || !nextDraft.zone || !nextDraft.name || !nextDraft.phone) {
      addBot("Me falta algún dato para completar la reserva. Vamos a revisarlo desde el inicio.", CHAT_OPTIONS);
      setStep("idle");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.createReservation({
        name: nextDraft.name,
        phone: nextDraft.phone,
        date: nextDraft.date,
        time: nextDraft.time,
        guests: nextDraft.guests,
        zone: nextDraft.zone,
        comments: "Reserva creada desde Cafi",
        source: "cafi_chat",
      });

      const calendarLink = buildCalendarLink({
        date: nextDraft.date,
        time: nextDraft.time,
        guests: nextDraft.guests,
        zone: nextDraft.zone,
        name: nextDraft.name,
      });

      setStep("done");
      addBotWithRegisterCard(
        `Reserva confirmada para ${nextDraft.name}: ${nextDraft.guests} persona(s), ${nextDraft.dateLabel || nextDraft.date} a las ${nextDraft.time}, zona ${getZoneLabelForDraft(nextDraft)}. Código: ${response?.reservation?.id || "confirmado"}.`,
        [
          { label: "Añadir a Google Calendar", href: calendarLink, tone: "primary" },
          { label: "Reservar de nuevo", value: "Quiero hacer una reserva" },
          { label: "Limpiar chat", value: "__clear" },
        ],
      );
    } catch (error) {
      addBot(error instanceof Error ? error.message : "No pude completar la reserva. Inténtelo de nuevo o contacte con el restaurante.", [
        { label: "Contactar con el Encargado", href: "https://wa.me/34618044843", tone: "primary" },
        { label: "Intentar de nuevo", value: "Quiero hacer una reserva" },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSaving) return;
    addUser(text);

    const lower = text.toLowerCase();
    if (text === "__clear") {
      resetChat();
      return;
    }
    if (lower.includes("catering") || lower.includes("evento") || lower.includes("mas de 10") || lower.includes("más de 10")) {
      showContactManager();
      return;
    }

    if (step === "idle" || lower.includes("reserv")) {
      const guests = parseGuests(text);
      const nextDraft = guests ? { ...draft, guests } : {};
      if (guests && guests > 10) {
        showContactManager();
        return;
      }
      askDate(nextDraft);
      return;
    }

    if (step === "date") {
      const parsedDate = parseDate(text);
      if (!parsedDate) {
        addBot("No pude reconocer el día. Puede escribir, por ejemplo: mañana, este viernes o 23/07/2026.");
        return;
      }
      if (isSundayIsoDate(parsedDate.iso)) {
        addBot("Los domingos estamos cerrados, por lo que no podemos tomar reservas ese día. ¿Podría indicarme otro día?", [
          { label: "Elegir fecha", kind: "calendar", tone: "primary" },
        ]);
        return;
      }
      askService({ ...draft, date: parsedDate.iso, dateLabel: parsedDate.label });
      return;
    }

    if (step === "service") {
      const service = parseService(text);
      if (!service) {
        addBot("Indíqueme si la reserva es para comida o para cena.", SERVICE_OPTIONS);
        return;
      }
      askTime({ ...draft, service });
      return;
    }

    if (step === "time") {
      const parsedTime = parseTime(text);
      const baseAllowedTimes = draft.service === "cena" ? getDinnerTimeOptionsForDate(draft.date) : LUNCH_TIME_OPTIONS;
      const allowedTimes = draft.date
        ? baseAllowedTimes.filter((time) => !isPastReservationDateTime(draft.date!, time))
        : baseAllowedTimes;
      if (!parsedTime || !baseAllowedTimes.includes(parsedTime)) {
        addBot(
          draft.service === "cena"
            ? `${getDinnerHoursLabel(draft.date)} Elija una hora dentro de ese horario.`
            : "Esa hora no está disponible para comida. Elija una entre las 13:00 y las 15:15.",
          allowedTimes.map((time) => ({ label: time, value: time })),
        );
        return;
      }
      if (draft.date && isPastReservationDateTime(draft.date, parsedTime)) {
        addBot("Esa hora ya pasó. Por favor, elija una hora disponible posterior a la hora actual.", allowedTimes.map((time) => ({ label: time, value: time })));
        return;
      }
      askGuests({ ...draft, time: parsedTime });
      return;
    }

    if (step === "guests") {
      const guests = parseGuests(text);
      if (!guests || guests <= 0) {
        addBot("Indíqueme el número de personas, por ejemplo: 4 personas.", GUEST_OPTIONS);
        return;
      }
      if (guests > 10) {
        showContactManager();
        return;
      }
      askZone({ ...draft, guests });
      return;
    }

    if (step === "zone") {
      const normalizedZoneText = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
      if (
        isDinnerThursdayToSaturday(draft) &&
        !normalizedZoneText.includes("gastroteca") &&
        (normalizedZoneText.includes("comedor") ||
          normalizedZoneText.includes("bistro") ||
          normalizedZoneText.includes("interior") ||
          normalizedZoneText.includes("dentro"))
      ) {
        addBot("Para cenas de jueves a sábado puede elegir terraza o Gastroteca.", getZoneOptionsForDraft(draft));
        return;
      }
      const zone = parseZone(text);
      const zoneOptions = getZoneOptionsForDraft(draft);
      const allowedZones = zoneOptions.map((option) => parseZone(option.value || option.label));
      if (!zone || !allowedZones.includes(zone)) {
        addBot(
          isDinnerMondayToWednesday(draft)
            ? "Para cenas de lunes a miércoles puede elegir terraza o cafetería."
            : isDinnerThursdayToSaturday(draft)
              ? "Para cenas de jueves a sábado puede elegir terraza o Gastroteca."
            : "Puede elegir terraza o comedor.",
          zoneOptions,
        );
        return;
      }
      askName({ ...draft, zone });
      return;
    }

    if (step === "name") {
      if (text.replace(/\s+/g, "").length < 4 || !text.includes(" ")) {
        addBot("Necesito nombre y apellido, por ejemplo: Carmen Lorenzo.");
        return;
      }
      askPhone({ ...draft, name: text });
      return;
    }

    if (step === "phone") {
      if (!isValidPhone(text)) {
        addBot("Ese teléfono no parece válido. Puede incluir prefijo, espacios o guiones, por ejemplo: +34 687 968 999.");
        return;
      }
      await confirmReservation({ ...draft, phone: text });
      return;
    }

    addBot("Puedo ayudarle a reservar, consultar grupos o contactar para eventos.", CHAT_OPTIONS);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = input;
    setInput("");
    void handleText(text);
  };

  const handleCalendarDate = (value: string) => {
    if (!value) return;
    void handleText(value);
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };

  return (
    <main className="min-h-screen bg-[#f8f3e8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(31,107,50,0.16),transparent_30%),radial-gradient(circle_at_90%_6%,rgba(176,139,55,0.18),transparent_28%),linear-gradient(135deg,#fffaf0,#edf7e8)]" />
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <aside className="rounded-[26px] border border-primary/15 bg-white/90 p-5 shadow-2xl backdrop-blur">
          <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4" />
            Volver a la web
          </Link>
          <div className="mb-5 flex items-center gap-4">
            <img src={cafiAvatar} alt="Cafi" className="h-20 w-20 rounded-full border border-primary/20 bg-[#fffaf0] object-cover shadow" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">El Cafetín</p>
              <h1 className="text-4xl font-black leading-tight text-[#1f3d2a]">Chat con Cafi</h1>
            </div>
          </div>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            Cafi ayuda a crear reservas, orientar grupos grandes y contactar con el encargado para eventos o catering.
          </p>
          <div className="grid gap-3">
            <div className="flex gap-3 rounded-2xl bg-[#f4ecd8] p-4 text-sm text-[#304838]">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p>Horas comidas: <strong>13:00 - 15:15</strong></p>
                <p>Cenas L-M-X: <strong>20:00 - 21:30</strong></p>
                <p>Cenas J-V-S: <strong>20:00 - 22:45</strong></p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-[#eef8e8] p-4 text-sm text-[#304838]">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Más de 10 personas se gestionan directamente por WhatsApp.</span>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary to-[#3d7a2a] p-5 text-center text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Hora actual</p>
              <p className="mt-1 text-5xl font-black leading-none tabular-nums">{clockTime}</p>
              <p className="mt-2 text-sm capitalize text-white/80">{clockDate}</p>
            </div>
          </div>
        </aside>

        <section className="mx-auto flex h-[min(820px,calc(100vh-40px))] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-primary/15 bg-[#fffaf0] shadow-2xl">
          <header className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <img src={cafiAvatar} alt="" className="h-12 w-12 rounded-full border border-white/30 bg-white object-cover" />
              <div>
                <p className="text-xl font-bold">Cafi</p>
                <p className="text-sm text-white/80">Reservas y ayuda</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetChat}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              aria-label="Limpiar chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((message) => (
              <div key={message.id} className={message.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={message.from === "user" ? "max-w-[82%] rounded-3xl bg-primary px-5 py-3 text-white" : "max-w-[88%] rounded-3xl bg-[#efe6d3] px-5 py-3 text-[#26372b]"}>
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{message.text}</p>
                  {message.actions && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {message.actions.map((action) =>
                        action.href ? (
                          <a
                            key={action.label}
                            href={action.href}
                            target={action.href.startsWith("http") ? "_blank" : undefined}
                            rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                            className="rounded-full border border-primary/25 bg-[#e7f5df] px-4 py-2 text-center font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
                          >
                            {action.label}
                          </a>
                        ) : action.kind === "calendar" ? (
                          <button
                            key={action.label}
                            type="button"
                            onClick={openDatePicker}
                            className="rounded-full bg-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary/90"
                          >
                            {action.label}
                          </button>
                        ) : (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => action.value === "__clear" ? resetChat() : void handleText(action.value || action.label)}
                            className={action.tone === "primary" ? "rounded-full bg-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary/90" : "rounded-full border border-primary/20 bg-[#e7f5df] px-4 py-2 font-semibold text-primary shadow-sm transition hover:bg-[#d6edcc]"}
                          >
                            {action.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                  {message.showRegisterCard && (
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-[#f8f3e8] p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Área de clientes</p>
                      <h3 className="mt-2 text-lg font-black leading-tight text-[#163b27]">
                        Regístrate y gestiona mejor tus reservas
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Accede a tus reservas activas, consulta tu historial y localiza tus datos de contacto más rápido al reservar.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-[#26372b]">
                          <Users className="h-4 w-4 text-primary" />
                          Reservas en tu perfil
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-[#26372b]">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Atención más rápida
                        </span>
                      </div>
                      <Link
                        to="/register"
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-white transition hover:bg-primary/90 sm:w-auto"
                      >
                        Registrarse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSaving && (
              <div className="flex justify-start">
                <div className="rounded-3xl bg-[#efe6d3] px-5 py-3 text-[#26372b]">Guardando reserva...</div>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-3 border-t border-primary/10 bg-white px-4 py-3">
            <button
              type="button"
              onClick={openDatePicker}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef8e8] text-primary transition hover:bg-[#d6edcc] sm:inline-flex"
              aria-label="Abrir calendario"
            >
              <CalendarDays className="h-5 w-5" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              min={toIsoDate(new Date())}
              onChange={(event) => handleCalendarDate(event.target.value)}
              className="sr-only"
              aria-label="Seleccionar fecha"
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escriba aquí..."
              className="min-w-0 flex-1 rounded-full bg-[#f8f3e8] px-4 py-3 text-base outline-none ring-primary/20 transition focus:ring-4"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
