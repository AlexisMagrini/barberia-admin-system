"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/turnos", label: "Turnos" },
  { href: "/ingresos", label: "Ingresos" },
  { href: "/egresos", label: "Egresos" },
  { href: "/reportes", label: "Reportes" },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    toast.success("Sesión cerrada");
    router.push("/");
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <h1 className="text-xl font-bold text-gray-900 sm:mr-6">
            Barbería Admin
          </h1>
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "outline"}
                size="sm"
                onClick={() => router.push(item.href)}
                className="text-sm"
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleLogout}
          className="self-end sm:self-auto"
        >
          Cerrar Sesión
        </Button>
      </div>
    </Card>
  );
}
