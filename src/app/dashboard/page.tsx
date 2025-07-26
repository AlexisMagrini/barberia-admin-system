"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardData {
  date: string;
  totals: {
    turnos: number;
    ingresos: number;
    expenses: number;
    net: number;
  };
  totalsByBarber: Record<string, { total: number; count: number; services: Record<string, number> }>;
  totalsByPayment: Record<string, { total: number; count: number }>;
  stats: {
    appointmentsCount: number;
    ingresosCount: number;
    expensesCount: number;
    averageAppointmentPrice: number;
    mostPopularService: string | null;
    mostActiveBarber: string | null;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDashboardData = async (date: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/daily?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || "Error al cargar datos");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="date" className="text-sm font-medium">
              Fecha:
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            />
            <Button
              size="sm"
              onClick={() => fetchDashboardData(selectedDate)}
              disabled={isLoading}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando datos...</p>
          </div>
        ) : data ? (
          <>
            {/* Totales Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Turnos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.totals.turnos)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.stats.appointmentsCount} turnos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Ingresos Extra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.totals.ingresos)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.stats.ingresosCount} productos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Egresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.totals.expenses)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.stats.expensesCount} gastos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Neto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    data.totals.net >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.totals.net)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresos - Egresos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas Adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio promedio:</span>
                    <span className="font-medium">
                      {formatCurrency(data.stats.averageAppointmentPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Servicio popular:</span>
                    <span className="font-medium">
                      {data.stats.mostPopularService || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Barbero activo:</span>
                    <span className="font-medium">
                      {data.stats.mostActiveBarber || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Totales por Barbero */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Barbero</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.totalsByBarber).map(([barber, stats]) => (
                      <div key={barber} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{barber}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({stats.count} turnos)
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          {formatCurrency(stats.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Totales por Forma de Pago */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Forma de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.totalsByPayment).map(([payment, stats]) => (
                      <div key={payment} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{payment}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({stats.count})
                          </span>
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(stats.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No hay datos disponibles para esta fecha</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}
