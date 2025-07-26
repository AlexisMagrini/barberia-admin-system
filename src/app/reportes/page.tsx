"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface DailyReportData {
  date: string;
  appointments: Array<{
    id: number;
    time: string;
    barber: string;
    service: string;
    price: number;
    paymentMethod: string;
  }>;
  ingresos: Array<{
    id: number;
    product: string;
    amount: number;
  }>;
  expenses: Array<{
    id: number;
    motivo: string;
    amount: number;
  }>;
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

interface WeeklyReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  dailyData: Record<string, {
    appointments: any[];
    ingresos: any[];
    expenses: any[];
    totals: {
      turnos: number;
      ingresos: number;
      expenses: number;
      net: number;
    };
  }>;
  weeklyTotals: {
    turnos: number;
    ingresos: number;
    expenses: number;
    net: number;
  };
}

export default function ReportesPage() {
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    return monday.toISOString().split('T')[0];
  });

  const fetchDailyReport = async (date: string) => {
    setIsLoadingDaily(true);
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
        setDailyReport(result.data);
      } else {
        toast.error(result.message || "Error al cargar reporte diario");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Daily report error:", error);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  const fetchWeeklyReport = async (startDate: string) => {
    setIsLoadingWeekly(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/weekly?startDate=${startDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setWeeklyReport(result.data);
      } else {
        toast.error(result.message || "Error al cargar reporte semanal");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Weekly report error:", error);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  useEffect(() => {
    fetchDailyReport(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchWeeklyReport(selectedWeekStart);
  }, [selectedWeekStart]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', { weekday: 'long' });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reportes</h1>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Reporte Diario</TabsTrigger>
            <TabsTrigger value="weekly">Reporte Semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Reporte Diario</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="daily-date">Fecha:</Label>
                    <Input
                      id="daily-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto"
                    />
                    <Button
                      onClick={() => fetchDailyReport(selectedDate)}
                      disabled={isLoadingDaily}
                      size="sm"
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDaily ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Cargando reporte...</p>
                  </div>
                ) : dailyReport ? (
                  <div className="space-y-6">
                    {/* Resumen de totales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg bg-green-50">
                        <p className="text-sm text-gray-600">Turnos</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(dailyReport.totals.turnos)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dailyReport.stats.appointmentsCount} servicios
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-blue-50">
                        <p className="text-sm text-gray-600">Ingresos Extra</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(dailyReport.totals.ingresos)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dailyReport.stats.ingresosCount} productos
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-red-50">
                        <p className="text-sm text-gray-600">Egresos</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(dailyReport.totals.expenses)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dailyReport.stats.expensesCount} gastos
                        </p>
                      </div>
                      <div className={`text-center p-4 border rounded-lg ${
                        dailyReport.totals.net >= 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className="text-sm text-gray-600">Total Neto</p>
                        <p className={`text-xl font-bold ${
                          dailyReport.totals.net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dailyReport.totals.net)}
                        </p>
                        <p className="text-xs text-gray-500">Ingresos - Egresos</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Totales por barbero */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Por Barbero</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(dailyReport.totalsByBarber).map(([barber, stats]) => (
                              <div key={barber} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{barber}</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(stats.total)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p>{stats.count} turnos</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Object.entries(stats.services).map(([service, count]) => (
                                      <span key={service} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {service}: {count}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Totales por forma de pago */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Por Forma de Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(dailyReport.totalsByPayment).map(([payment, stats]) => (
                              <div key={payment} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <span className="font-medium">{payment}</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({stats.count} transacciones)
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

                    {/* Detalle de turnos */}
                    {dailyReport.appointments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detalle de Turnos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Hora</th>
                                  <th className="text-left p-2">Barbero</th>
                                  <th className="text-left p-2">Servicio</th>
                                  <th className="text-left p-2">Pago</th>
                                  <th className="text-right p-2">Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dailyReport.appointments.map((appointment) => (
                                  <tr key={appointment.id} className="border-b">
                                    <td className="p-2">{appointment.time}</td>
                                    <td className="p-2">{appointment.barber}</td>
                                    <td className="p-2">{appointment.service}</td>
                                    <td className="p-2">{appointment.paymentMethod}</td>
                                    <td className="p-2 text-right font-medium">
                                      {formatCurrency(appointment.price)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Detalle de ingresos y egresos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {dailyReport.ingresos.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Ingresos Extra</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {dailyReport.ingresos.map((ingreso) => (
                                <div key={ingreso.id} className="flex justify-between items-center p-2 border rounded">
                                  <span>{ingreso.product}</span>
                                  <span className="font-medium text-blue-600">
                                    {formatCurrency(ingreso.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {dailyReport.expenses.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Egresos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {dailyReport.expenses.map((expense) => (
                                <div key={expense.id} className="flex justify-between items-center p-2 border rounded">
                                  <span className="flex-1 text-sm">{expense.motivo}</span>
                                  <span className="font-medium text-red-600">
                                    {formatCurrency(expense.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No hay datos disponibles para esta fecha
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Reporte Semanal</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="weekly-date">Inicio de semana:</Label>
                    <Input
                      id="weekly-date"
                      type="date"
                      value={selectedWeekStart}
                      onChange={(e) => setSelectedWeekStart(e.target.value)}
                      className="w-auto"
                    />
                    <Button
                      onClick={() => fetchWeeklyReport(selectedWeekStart)}
                      disabled={isLoadingWeekly}
                      size="sm"
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingWeekly ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Cargando reporte semanal...</p>
                  </div>
                ) : weeklyReport ? (
                  <div className="space-y-6">
                    {/* Totales semanales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg bg-green-50">
                        <p className="text-sm text-gray-600">Turnos</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(weeklyReport.weeklyTotals.turnos)}
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-blue-50">
                        <p className="text-sm text-gray-600">Ingresos Extra</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(weeklyReport.weeklyTotals.ingresos)}
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg bg-red-50">
                        <p className="text-sm text-gray-600">Egresos</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(weeklyReport.weeklyTotals.expenses)}
                        </p>
                      </div>
                      <div className={`text-center p-4 border rounded-lg ${
                        weeklyReport.weeklyTotals.net >= 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className="text-sm text-gray-600">Total Neto</p>
                        <p className={`text-xl font-bold ${
                          weeklyReport.weeklyTotals.net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(weeklyReport.weeklyTotals.net)}
                        </p>
                      </div>
                    </div>

                    {/* Detalle por día */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalle por Día</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Día</th>
                                <th className="text-right p-2">Turnos</th>
                                <th className="text-right p-2">Ingresos</th>
                                <th className="text-right p-2">Egresos</th>
                                <th className="text-right p-2">Neto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(weeklyReport.dailyData).map(([date, data]) => (
                                <tr key={date} className="border-b">
                                  <td className="p-2">
                                    <div>
                                      <p className="font-medium">{getDayName(date)}</p>
                                      <p className="text-xs text-gray-500">{formatDate(date)}</p>
                                    </div>
                                  </td>
                                  <td className="p-2 text-right text-green-600">
                                    {formatCurrency(data.totals.turnos)}
                                  </td>
                                  <td className="p-2 text-right text-blue-600">
                                    {formatCurrency(data.totals.ingresos)}
                                  </td>
                                  <td className="p-2 text-right text-red-600">
                                    {formatCurrency(data.totals.expenses)}
                                  </td>
                                  <td className={`p-2 text-right font-medium ${
                                    data.totals.net >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(data.totals.net)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No hay datos disponibles para esta semana
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
}
