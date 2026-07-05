import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { api } from "../../utils/supabase-client";

type Table = {
  id: number;
  seats: number;
  available: boolean;
  position: { row: number; col: number };
};

type TableSelectorProps = {
  selectedTable: number | null;
  onSelectTable: (tableId: number | null) => void;
  date?: string;
  time?: string;
  requiredSeats?: number;
};

export function TableSelector({
  selectedTable,
  onSelectTable,
  date,
  time,
  requiredSeats
}: TableSelectorProps) {
  const [bookedTables, setBookedTables] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Configuración de mesas del Bistro
  const tables: Table[] = [
    // Columna izquierda (mesas de 4 personas)
    { id: 1, seats: 4, available: true, position: { row: 3, col: 0 } },
    { id: 2, seats: 4, available: true, position: { row: 2, col: 0 } },
    { id: 3, seats: 4, available: true, position: { row: 1, col: 0 } },
    { id: 4, seats: 6, available: true, position: { row: 0, col: 0 } }, // Mesa 4+4b unidas = 6 personas

    // Columna central (mesas pequeñas - 2 personas)
    { id: 5, seats: 2, available: true, position: { row: 3, col: 1 } },
    { id: 6, seats: 2, available: true, position: { row: 2, col: 1 } },
    { id: 7, seats: 2, available: true, position: { row: 1, col: 1 } },
    { id: 8, seats: 2, available: true, position: { row: 0, col: 1 } },

    // Columna derecha (mesas de 4 personas)
    { id: 9, seats: 4, available: true, position: { row: 3, col: 2 } },
    { id: 10, seats: 4, available: true, position: { row: 2, col: 2 } },
    { id: 11, seats: 4, available: true, position: { row: 1, col: 2 } },
    { id: 12, seats: 4, available: true, position: { row: 0, col: 2 } },
  ];

  // Cargar mesas ocupadas desde la base de datos
  useEffect(() => {
    const loadOccupiedTables = async () => {
      if (date && time) {
        setLoading(true);
        try {
          const data = await api.getOccupiedTables(date, time);
          setBookedTables(data.occupiedTables || []);
        } catch (error) {
          console.error('Error al cargar mesas ocupadas:', error);
          setBookedTables([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadOccupiedTables();
  }, [date, time]);

  const getTableStatus = (table: Table) => {
    if (bookedTables.includes(table.id)) return 'occupied';
    if (requiredSeats && table.seats < requiredSeats) return 'too-small';
    if (selectedTable === table.id) return 'selected';
    return 'available';
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-gray-300 cursor-not-allowed border-gray-400';
      case 'too-small':
        return 'bg-gray-100 cursor-not-allowed border-gray-300 opacity-50';
      case 'selected':
        return 'bg-primary text-primary-foreground border-primary shadow-lg scale-105';
      case 'available':
        return 'bg-white hover:bg-primary/10 hover:border-primary border-muted-foreground/30 cursor-pointer hover:scale-105';
      default:
        return 'bg-white';
    }
  };

  const handleTableClick = (table: Table) => {
    const status = getTableStatus(table);
    if (status === 'occupied' || status === 'too-small') return;

    if (selectedTable === table.id) {
      onSelectTable(null);
    } else {
      onSelectTable(table.id);
    }
  };

  const renderTable = (table: Table) => {
    const status = getTableStatus(table);
    const isMediumTable = table.seats === 4;
    const isDoubleTable = table.id === 4; // Mesa 4+4b unidas
    const isSmallTable = table.seats === 2;

    // Mesa 4 es especial (4+4b unidas para 6 personas)
    if (isDoubleTable) {
      return (
        <div
          key={table.id}
          onClick={() => handleTableClick(table)}
          className="relative flex items-center justify-center gap-1"
        >
          {/* Mesa 4 */}
          <div className={`
            relative flex items-center justify-center
            border-2 rounded-lg transition-all duration-200
            w-20 h-14
            ${getTableColor(status)}
          `}>
            <span className="text-xl font-bold">4</span>
            {/* Sillas mesa 4: arriba, abajo, izquierda */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
          </div>

          {/* Mesa 4b */}
          <div className={`
            relative flex items-center justify-center
            border-2 rounded-lg transition-all duration-200
            w-20 h-14
            ${getTableColor(status)}
          `}>
            <span className="text-xl font-bold">4b</span>
            {/* Sillas mesa 4b: arriba, abajo, derecha */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
          </div>

          {status === 'occupied' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-400/20 rounded-lg">
              <span className="text-xs font-semibold text-gray-600">OCUPADA</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={table.id}
        onClick={() => handleTableClick(table)}
        className={`
          relative flex items-center justify-center
          border-2 rounded-lg transition-all duration-200
          ${isMediumTable ? 'w-20 h-14' : 'w-16 h-12'}
          ${getTableColor(status)}
        `}
      >
        <span className={`font-bold ${isMediumTable ? 'text-xl' : 'text-lg'}`}>{table.id}</span>

        {/* Sillas representadas como círculos */}
        {isMediumTable ? (
          <>
            {/* Mesas de 4 personas: 4 sillas */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
          </>
        ) : (
          <>
            {/* Mesas pequeñas: 2 sillas */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-current bg-background" />
          </>
        )}

        {status === 'occupied' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-400/20 rounded-lg">
            <span className="text-xs font-semibold text-gray-600">OCUPADA</span>
          </div>
        )}
      </div>
    );
  };

  const grid = Array(4).fill(null).map(() => Array(3).fill(null));

  tables.forEach(table => {
    grid[table.position.row][table.position.col] = table;
  });

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2 text-center">Selecciona tu Mesa</h3>
        <p className="text-sm text-muted-foreground text-center mb-2">
          {loading ? 'Cargando disponibilidad...' : 'Haz clic en una mesa disponible para seleccionarla'}
        </p>
        <p className="text-xs text-muted-foreground text-center mb-4 italic">
          ⏰ Duración de la reserva: 2 horas
        </p>

        {/* Leyenda */}
        <div className="flex justify-center gap-6 text-xs mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-muted-foreground/30 rounded" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span>Seleccionada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded" />
            <span>Ocupada</span>
          </div>
        </div>
      </div>

      {/* Plano del restaurante con ventanas panorámicas */}
      <div className="relative bg-gradient-to-b from-blue-50/30 to-transparent p-6 rounded-lg border border-muted">
        {/* Ventana panorámica izquierda */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-blue-200/40 to-transparent border-l-4 border-blue-300/50 rounded-l-lg">
          <div className="h-full flex flex-col justify-around px-0.5">
            <div className="h-1/4 border-t-2 border-blue-300/30" />
            <div className="h-1/4 border-t-2 border-blue-300/30" />
            <div className="h-1/4 border-t-2 border-blue-300/30" />
          </div>
        </div>

        {/* Ventana panorámica derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-blue-200/40 to-transparent border-r-4 border-blue-300/50 rounded-r-lg">
          <div className="h-full flex flex-col justify-around px-0.5">
            <div className="h-1/4 border-t-2 border-blue-300/30" />
            <div className="h-1/4 border-t-2 border-blue-300/30" />
            <div className="h-1/4 border-t-2 border-blue-300/30" />
          </div>
        </div>

        {/* Mesas */}
        <div className="space-y-8 px-6">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-8">
              {row.map((table, colIndex) => (
                <div key={colIndex} className="flex items-center justify-center">
                  {table ? renderTable(table) : <div className="w-24 h-16" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Info de mesa seleccionada */}
      {selectedTable && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border-2 border-primary">
          <p className="text-center font-medium">
            {selectedTable === 4 ? 'Mesa 4+4b' : `Mesa ${selectedTable}`} seleccionada
            <span className="ml-2">
              ({tables.find(t => t.id === selectedTable)?.seats} personas máximo)
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
