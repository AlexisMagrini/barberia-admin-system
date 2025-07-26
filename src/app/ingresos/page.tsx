"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ExtraIncome {
  id: number;
  date: string;
  product: string;
  amount: number;
  createdAt: string;
}

const products = [
  "Pomada",
  "Shampoo",
  "Cera",
  "Aceite para barba",
  "Bálsamo",
  "Gel",
  "Spray fijador",
  "Loción aftershave",
  "Crema hidratante",
  "Otros productos"
];

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<ExtraIncome[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product: "",
    amount: ""
  });

  const fetchIngresos = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ingresos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setIngresos(result.data);
      } else {
        toast.error(result.message || "Error al cargar ingresos");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Fetch ingresos error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngresos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.product || !formData.amount) {
      toast.error("Todos los campos son requeridos");
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
        `${process.env.NEXT_PUBLIC_API_URL}/ingresos`,
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
        toast.success("Ingreso extra creado exitosamente");
        setFormData({
          date: new Date().toISOString().split('T')[0],
          product: "",
          amount: ""
        });
        fetchIngresos();
      } else {
        toast.error(result.message || "Error al crear ingreso");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Create ingreso error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este ingreso?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ingresos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Ingreso eliminado exitosamente");
        fetchIngresos();
      } else {
        toast.error(result.message || "Error al eliminar ingreso");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Delete ingreso error:", error);
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

  const totalIngresos = ingresos.reduce((sum, ingreso) => sum + ingreso.amount, 0);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ingresos Extra</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Ingresos Extra</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIngresos)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Ingreso Extra</CardTitle>
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
                  <Label htmlFor="product">Producto</Label>
                  <Select
                    value={formData.product}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {isSubmitting ? "Creando ingreso..." : "Crear Ingreso"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de ingresos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ingresos Extra</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando ingresos...</p>
                </div>
              ) : ingresos.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ingresos.map((ingreso) => (
                    <div
                      key={ingreso.id}
                      className="p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{ingreso.product}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(ingreso.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-green-600">
                            {formatCurrency(ingreso.amount)}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(ingreso.id)}
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
                  No hay ingresos extra registrados
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen por producto */}
        {ingresos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const productIngresos = ingresos.filter(i => i.product === product);
                  const productTotal = productIngresos.reduce((sum, i) => sum + i.amount, 0);
                  
                  if (productTotal === 0) return null;
                  
                  return (
                    <div key={product} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{product}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(productTotal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {productIngresos.length} venta{productIngresos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}
