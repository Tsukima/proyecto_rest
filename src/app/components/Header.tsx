import { Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/logo-transparent.png";
import { api } from "../../utils/supabase-client";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = api.isAuthenticated();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <ImageWithFallback
            src={logoImg}
            alt="El Cafetin"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm transition-colors hover:text-primary ${
              isActive("/") ? "text-primary font-medium" : "text-foreground/80"
            }`}
          >
            Inicio
          </Link>
          <Link
            to="/menu"
            className={`text-sm transition-colors hover:text-primary ${
              isActive("/menu") ? "text-primary font-medium" : "text-foreground/80"
            }`}
          >
            Carta
          </Link>
          <Link
            to="/beverages"
            className={`text-sm transition-colors hover:text-primary ${
              isActive("/beverages") ? "text-primary font-medium" : "text-foreground/80"
            }`}
          >
            Bebidas
          </Link>
          <Link
            to="/gallery"
            className={`text-sm transition-colors hover:text-primary ${
              isActive("/gallery") ? "text-primary font-medium" : "text-foreground/80"
            }`}
          >
            Galería
          </Link>
          <Link
            to="/cafi"
            className={`text-sm transition-colors hover:text-primary ${
              isActive("/cafi") ? "text-primary font-medium" : "text-foreground/80"
            }`}
          >
            Reservas
          </Link>
          <Link
            to="/#testimonials"
            className="text-sm text-foreground/80 transition-colors hover:text-primary"
          >
            Opiniones
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/cafi">
            <Button variant="outline">
              Reservar
            </Button>
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button>
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            <Link
              to="/"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/menu"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carta
            </Link>
            <Link
              to="/beverages"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bebidas
            </Link>
            <Link
              to="/gallery"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Galería
            </Link>
            <Link
              to="/cafi"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reservas
            </Link>
            <Link
              to="/#testimonials"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Opiniones
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    Perfil
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
