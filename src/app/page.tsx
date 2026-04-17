import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Shield, Zap, FileText } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-cac-teal" />
            <span className="font-bold">CAC Validador</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Shield className="h-4 w-4 text-cac-teal" />
              Resolución 0247/2014 · Cuenta de Alto Costo
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Valida tu reporte CAC{" "}
              <span className="bg-gradient-to-r from-cac-teal to-cac-navy bg-clip-text text-transparent">
                en minutos
              </span>
              , no en días
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Motor de validación con 134 variables, reglas cruzadas y
              detección inteligente de errores. Listo para SISCAC.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/auth/login">
                <Button size="lg" className="gap-2">
                  Comenzar ahora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Ver demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto grid gap-8 px-4 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "134 Variables",
                desc: "Motor completo con validación de formato, rango, cruzada y reglas de negocio.",
              },
              {
                icon: Shield,
                title: "Multi-EAPB Seguro",
                desc: "Row Level Security en Supabase. Cada EAPB solo ve sus datos.",
              },
              {
                icon: FileText,
                title: "Exportación SISCAC",
                desc: "Genera archivos TXT ANSI correctos listos para cargar en el aplicativo CAC.",
              },
            ].map((f) => (
              <div key={f.title} className="space-y-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-cac-teal/10">
                  <f.icon className="h-6 w-6 text-cac-teal" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        CAC Validador v2.0 · Resolución 0247/2014 · cuentadealtocosto.org
      </footer>
    </div>
  );
}
