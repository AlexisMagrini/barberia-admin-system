"use client";

import { useEffect, useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Price {
  id: number;
  barber: string;
  service: string;
  price: number;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  barber: string;
  service: string;
  price: number;
  paymentMethod: string;
  createdAt: string;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

const paymentMethods = ["Efectivo", "MercadoPago", "QR/Tarjeta"];

export default function TurnosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "",
    barber: "",
    service: "",
    price: 0,
    paymentMethod: ""
  });

  const [availableServices, setAvailableServices] = useState<Price[]>([]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/turnos?date=${formData.date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setAppointments(result.data);
      } else {
        toast.error(result.message || "Error al cargar turnos");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Fetch appointments error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/prices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setPrices(result.data);
      } else {
        toast.error("Error al cargar precios");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Fetch prices error:", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPrices();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [formData.date]);

  useEffect(() => {
    if (formData.barber) {
      const services = prices.filter(p => p.barber === formData.barber);
      setAvailableServices(services);
      setFormData(prev => ({ ...prev, service: "", price: 0 }));
    } else {
      setAvailableServices([]);
    }
  }, [formData.barber, prices]);

  useEffect(() => {
    if (formData.barber && formData.service) {
      const selectedPrice = prices.find(
        p => p.barber === formData.barber && p.service === formData.service
      );
      if (selectedPrice) {
        setFormData(prev => ({ ...prev, price: selectedPrice.price }));
      }
    }
  }, [formData.barber, formData.service, prices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.barber || 
        !formData.service || !formData.paymentMethod) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/turnos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Turno creado exitosamente");
        setFormData({
          date: formData.date,
          time: "",
          barber: "",
          service: "",
          price: 0,
          paymentMethod: ""
        });
        fetchAppointments();
      } else {
        toast.error(result.message || "Error al crear turno");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Create appointment error:", error);
    } finally {
      setIsSubmitting(false);
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

  const barbers = [...new Set(prices.map(p => p.barber))];

  return (
    <AuthLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestión de Turnos</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="time">Hora</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barber">Barbero</Label>
                  <Select
                    value={formData.barber}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, barber: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers.map((barber) => (
                        <SelectItem key={barber} value={barber}>
                          {barber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Servicio</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
                    disabled={!formData.barber}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={`${service.barber}-${service.service}`} value={service.service}>
                          {service.service} - {formatCurrency(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="text"
                    value={formatCurrency(formData.price)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pago</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar forma de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creando turno..." : "Crear Turno"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de turnos del día */}
          <Card>
            <CardHeader>
              <CardTitle>Turnos del {formatDate(formData.date)}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando turnos...</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {appointment.time} - {appointment.barber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.service}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(appointment.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay turnos para esta fecha
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
