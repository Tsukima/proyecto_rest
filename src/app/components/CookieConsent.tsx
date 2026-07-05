import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Cookie, X } from "lucide-react";
import { Button } from "./ui/button";

const COOKIE_KEY = "el-cafetin-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(COOKIE_KEY));
  }, []);

  const saveConsent = (value: "accepted" | "rejected") => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-lg border border-primary/20 bg-background/98 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">Uso de cookies</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Usamos cookies técnicas y de preferencia para que la web funcione correctamente y recuerde tus elecciones. Puedes aceptar o rechazar las no esenciales.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/politica-cookies">
                  Política de cookies
                </Link>
                <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/politica-privacidad">
                  Política de privacidad
                </Link>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => saveConsent("rejected")}>
              Rechazar
            </Button>
            <Button onClick={() => saveConsent("accepted")}>
              Aceptar
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cerrar aviso de cookies" onClick={() => saveConsent("rejected")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
