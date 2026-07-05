import { Cookie } from "lucide-react";

export function CookiePolicyPage() {
  return (
    <div className="bg-muted/30 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="rounded-lg border bg-background p-6 shadow-sm md:p-10">
          <div className="mb-8 flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Cookie className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Información legal</p>
              <h1 className="text-3xl font-bold">Política de cookies</h1>
              <p className="mt-2 text-muted-foreground">Última actualización: junio de 2026</p>
            </div>
          </div>

          <div className="space-y-7 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Qué son las cookies</h2>
              <p>
                Las cookies son pequeños archivos que se guardan en el navegador para permitir que una web funcione, recuerde preferencias o recopile información técnica sobre su uso.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Cookies que usamos</h2>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary/10 text-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Tipo</th>
                      <th className="p-3 font-semibold">Finalidad</th>
                      <th className="p-3 font-semibold">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3 font-medium text-foreground">Técnicas</td>
                      <td className="p-3">Permiten navegar, iniciar sesión, mantener seguridad y usar formularios.</td>
                      <td className="p-3">Sesión o persistentes según el servicio.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3 font-medium text-foreground">Preferencias</td>
                      <td className="p-3">Recuerdan si aceptaste o rechazaste el aviso de cookies.</td>
                      <td className="p-3">Persistente hasta que borres los datos del navegador.</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3 font-medium text-foreground">Analíticas o marketing</td>
                      <td className="p-3">Actualmente no se activan desde esta web salvo que se incorporen servicios externos en el futuro.</td>
                      <td className="p-3">No aplica actualmente.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Gestión del consentimiento</h2>
              <p>
                Puedes aceptar o rechazar cookies no esenciales desde el aviso que aparece al entrar en la web. También puedes borrar o bloquear cookies desde la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Cómo desactivar cookies en el navegador</h2>
              <p>
                Cada navegador permite eliminar cookies y bloquearlas desde sus opciones de privacidad o seguridad. Si bloqueas cookies técnicas, algunas funciones como el inicio de sesión, reservas o preferencias pueden no funcionar correctamente.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Contacto</h2>
              <p>
                Para cualquier consulta sobre cookies o privacidad, puedes escribir a administracion@serviciosgalicia.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
