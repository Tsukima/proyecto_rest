import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { UserPlus, BadgeCheck, Copy, Check } from "lucide-react";
import { api } from "../../utils/supabase-client";

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();

  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.signup(data.email, data.password, data.name, data.phone);
      setUserCode(result.user.code || null);
      await api.signin(data.email, data.password);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Success screen ──────────────────────────────────────────────────────
  if (userCode) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <BadgeCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">¡Cuenta creada!</CardTitle>
            <CardDescription>
              Guarda tu código de cliente. Lo necesitarás para identificarte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-3 p-6 bg-primary/5 border-2 border-primary/20 rounded-xl">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Tu código de cliente
              </p>
              <p className="text-4xl font-mono font-bold tracking-widest text-primary">
                {userCode}
              </p>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar código"}
              </Button>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Anota este código o haz una captura de pantalla. El restaurante puede usarlo para encontrar tu reserva rápidamente.
            </p>
            <Button className="w-full" onClick={() => navigate("/profile")}>
              Ir a mi perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Register form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Regístrate para gestionar tus reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                {...register("name", { required: "El nombre es obligatorio" })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 612 345 678"
                {...register("phone", { required: "El teléfono es obligatorio" })}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                })}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword", {
                  required: "Confirma tu contraseña",
                  validate: (v) => v === password || "Las contraseñas no coinciden",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
