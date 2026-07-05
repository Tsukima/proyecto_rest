import { Mail, MapPin, ShieldCheck } from "lucide-react";

export function PrivacyPolicyPage() {
  return (
    <div className="bg-muted/30 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="rounded-lg border bg-background p-6 shadow-sm md:p-10">
          <div className="mb-8 flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Información legal</p>
              <h1 className="text-3xl font-bold">Política de privacidad</h1>
              <p className="mt-2 text-muted-foreground">Última actualización: junio de 2026</p>
            </div>
          </div>

          <div className="space-y-7 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Responsable del tratamiento</h2>
              <p>
                El responsable de los datos recogidos a través de esta web es El Cafetín Pontevedra.
              </p>
              <div className="mt-3 grid gap-2">
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Pontevedra, Galicia</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> administracion@serviciosgalicia.com</p>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Datos que podemos tratar</h2>
              <p>
                Podemos tratar datos identificativos y de contacto, como nombre, teléfono, correo electrónico, número de comensales, fecha de reserva, preferencias indicadas por el cliente y cualquier información que se envíe mediante formularios de contacto, registro, perfil o reservas.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Finalidades</h2>
              <p>
                Usamos los datos para gestionar reservas, responder consultas, administrar cuentas de usuario, mejorar la atención al cliente, enviar comunicaciones relacionadas con solicitudes realizadas y mantener la seguridad técnica de la web.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Base legal</h2>
              <p>
                El tratamiento se basa en la ejecución de una solicitud o reserva, el consentimiento del usuario cuando envía formularios o acepta cookies no esenciales, el interés legítimo en mantener la seguridad de la web y el cumplimiento de obligaciones legales aplicables.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Conservación</h2>
              <p>
                Los datos se conservarán durante el tiempo necesario para gestionar la relación con el cliente, atender responsabilidades legales o hasta que el usuario solicite su supresión cuando proceda.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Destinatarios y servicios externos</h2>
              <p>
                No vendemos datos personales. Algunos datos pueden ser tratados por proveedores técnicos necesarios para el funcionamiento de la web, alojamiento, base de datos, autenticación o mensajería, siempre bajo condiciones adecuadas de seguridad.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Derechos</h2>
              <p>
                Puedes solicitar el acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos escribiendo a administracion@serviciosgalicia.com. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos si consideras que el tratamiento no se ajusta a la normativa.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
