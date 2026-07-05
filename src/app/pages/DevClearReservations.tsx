import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react";

export function DevClearReservations() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const clearAllReservations = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las reservas?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Obtener el projectId desde las variables de entorno
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID ||
                        prompt('Ingresa tu Supabase Project ID:');

      if (!projectId) {
        throw new Error('Project ID es requerido');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a892de6/clear-all-reservations`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessage({
        type: 'success',
        text: data.message || 'Reservas eliminadas correctamente'
      });

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error: ${error.message}. Asegúrate de haber desplegado el Edge Function desde Make.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trash2 className="h-6 w-6 text-destructive" />
              Limpiar Reservas de Prueba
            </CardTitle>
            <CardDescription>
              Herramienta de desarrollo para eliminar todas las reservas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 mb-1">Advertencia</p>
                  <p className="text-sm text-amber-700">
                    Esta acción eliminará TODAS las reservas de la base de datos.
                    Solo úsala en desarrollo o cuando necesites limpiar reservas de prueba.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Instrucciones</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Asegúrate de haber desplegado el Edge Function desde Make</li>
                    <li>Haz clic en el botón para limpiar todas las reservas</li>
                    <li>Recarga la página de reservas para ver las mesas disponibles</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={clearAllReservations}
              disabled={loading}
            >
              {loading ? (
                "Eliminando..."
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Limpiar Todas las Reservas
                </>
              )}
            </Button>

            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : message.type === 'error' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'success'
                      ? 'text-green-700'
                      : message.type === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/"}
              >
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
