import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-cac-navy/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cac-teal/10">
            <CheckCircle className="h-7 w-7 text-cac-teal" />
          </div>
          <CardTitle className="text-xl">CAC Validador v2.0</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de Validación de Reportes de Cáncer
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@eapb.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <Link href="/dashboard">
              <Button className="w-full" type="button">
                Iniciar sesión
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Resolución 0247/2014 · Cuenta de Alto Costo
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
