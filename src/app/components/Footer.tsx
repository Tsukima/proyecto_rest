import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/logo-transparent.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <ImageWithFallback
              src={logoImg}
              alt="El Cafetin"
              className="h-12 w-auto object-contain mb-4 brightness-0 invert"
            />
            <p className="text-sm text-primary-foreground/80">
              Gastrobar en Pontevedra con ambiente náutico y productos de calidad.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  Pontevedra, Galicia
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+34986847873" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  +34 986 84 78 73
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:administracion@serviciosgalicia.com" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  administracion@serviciosgalicia.com
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Horarios</h4>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">La Cafetería</p>
                  <p>Lunes - Sábado: 10:00 - 23:00</p>
                  <p className="text-xs">(Cocina nocturna L-X: 20:00 - 21:50)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">El Bistro</p>
                  <p>Lunes - Sábado: 13:30 - 17:00</p>
                  <p className="text-xs">(Cocina: 13:00 - 16:00)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">La Gastroteca</p>
                  <p>Jueves - Sábado: 20:00 - 00:00</p>
                  <p className="text-xs">(Cocina: 20:30 - 23:50)</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Síguenos</h4>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/elcafetindepontevedra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-accent transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
          <p>&copy; 2026 El Cafetin. Todos los derechos reservados.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            <Link to="/politica-privacidad" className="hover:text-primary-foreground underline-offset-4 hover:underline">
              Política de privacidad
            </Link>
            <Link to="/politica-cookies" className="hover:text-primary-foreground underline-offset-4 hover:underline">
              Política de cookies
            </Link>
          </div>
          <p className="mt-2 text-xs">
            Diseñado y creado por <span className="font-semibold">Angeles Pernia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
