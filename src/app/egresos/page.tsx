"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Expense {
  id: number;
  date: string;
  motivo: string;
  amount: number;
  createdAt: string;
}

export default function EgresosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    motivo: "",
    amount: ""
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/egresos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setExpenses(result.data);
      } else {
        toast.error(result.message || "Error al cargar egresos");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Fetch expenses error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.motivo.trim() || !formData.amount) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    if (formData.motivo.trim().length > 200) {
      toast.error("El motivo no puede exceder 200 caracteres");
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número positivo");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/egresos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            amount: amount
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Egreso creado exitosamente");
        setFormData({
          date: new Date().toISOString().split('T')[0],
          motivo: "",
          amount: ""
        });
        fetchExpenses();
      } else {
        toast.error(result.message || "Error al crear egreso");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Create expense error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este egreso?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/egresos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Egreso eliminado exitosamente");
        fetchExpenses();
      } else {
        toast.error(result.message || "Error al eliminar egreso");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Delete expense error:", error);
    }
  };

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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Agrupar gastos por motivos similares para estadísticas
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const motivo = expense.motivo.toLowerCase();
    let category = "Otros";
    
    if (motivo.includes("producto") || motivo.includes("compra") || motivo.includes("mercadería")) {
      category = "Productos";
    } else if (motivo.includes("servicio") || motivo.includes("luz") || motivo.includes("agua") || motivo.includes("gas")) {
      category = "Servicios";
    } else if (motivo.includes("alquiler") || motivo.includes("rent")) {
      category = "Alquiler";
    } else if (motivo.includes("mantenimiento") || motivo.includes("reparación")) {
      category = "Mantenimiento";
    } else if (motivo.includes("publicidad") || motivo.includes("marketing")) {
      category = "Marketing";
    }
    
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += expense.amount;
    acc[category].count += 1;
    
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Egresos</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Egresos</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Egreso</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo</Label>
                  <Textarea
                    id="motivo"
                    value={formData.motivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Describe el motivo del gasto (máx. 200 caracteres)"
                    maxLength={200}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {formData.motivo.length}/200 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Ingresa el monto"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creando egreso..." : "Crear Egreso"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de egresos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Egresos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando egresos...</p>
                </div>
              ) : expenses.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-sm mb-1">
                            {expense.motivo}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-red-600">
                            {formatCurrency(expense.amount)}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-xs px-2 py-1"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay egresos registrados
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen por categoría */}
        {expenses.length > 0 && Object.keys(expensesByCategory).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(expensesByCategory).map(([category, data]) => (
                  <div key={category} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{category}</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(data.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {data.count} gasto{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas adicionales */}
        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Promedio por Gasto</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(Math.round(totalExpenses / expenses.length))}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Total de Gastos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {expenses.length}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Gasto Más Alto</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(Math.max(...expenses.map(e => e.amount)))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}
