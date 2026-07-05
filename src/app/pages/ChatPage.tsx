import { Link } from "react-router";
import { MessageCircle, CalendarCheck, Users, Sparkles } from "lucide-react";
import cafiAvatar from "../../imports/cafi-avatar-transparent.png";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf0] via-white to-[#eef7e9] px-4 py-10">
      <div className="container mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="text-center lg:text-left">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-white shadow-lg lg:mx-0">
            <img
              src={cafiAvatar}
              alt="Cafi"
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Asistente virtual
          </p>
          <h1 className="mb-5 text-[clamp(2.5rem,5vw,4.6rem)] font-black leading-tight text-[#1f3d2a]">
            Hola, soy Cafi
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            Puedo ayudarte a iniciar una reserva, consultar opciones para grupos
            o contactar con el encargado para catering y eventos.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link to="/cafi">
              <Button size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                Abrir chat
              </Button>
            </Link>
            <Link to="/cafi">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <CalendarCheck className="h-5 w-5" />
                Hacer reserva
              </Button>
            </Link>
          </div>
        </section>

        <Card className="overflow-hidden border-primary/15 bg-white/90 shadow-xl">
          <CardContent className="grid gap-4 p-6 sm:p-8">
            <div className="rounded-2xl bg-[#f4ecd8] p-5">
              <h2 className="mb-2 text-xl font-bold text-[#1f3d2a]">
                Horario de reservas
              </h2>
              <p className="text-muted-foreground">
                La cocina cierra a las 15:45. Las reservas para comida se toman
                hasta las 15:15.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/15 bg-[#f8fff2] p-5">
                <Users className="mb-3 h-7 w-7 text-primary" />
                <h3 className="mb-2 font-bold text-[#1f3d2a]">Grupos</h3>
                <p className="text-sm text-muted-foreground">
                  Para más de 10 personas, Cafi te dirigirá al encargado por WhatsApp.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-[#fffaf0] p-5">
                <Sparkles className="mb-3 h-7 w-7 text-primary" />
                <h3 className="mb-2 font-bold text-[#1f3d2a]">Eventos</h3>
                <p className="text-sm text-muted-foreground">
                  Catering y eventos se gestionan directamente con el encargado.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-primary/25 p-5 text-center text-sm text-muted-foreground">
              Pulsa <strong>Abrir chat</strong> para entrar en la nueva página de Cafi.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
