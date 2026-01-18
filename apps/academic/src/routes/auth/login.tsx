import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { getDashboardRoute } from "@/lib/utils/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  GraduationCapIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (user?.role) {
      throw redirect({
        to: getDashboardRoute(user.role),
      });
    }
  },
  component: LoginPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-12 lg:flex-row">
        <div className="w-full max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-muted">
            <SparklesIcon
              className="h-3.5 w-3.5 text-info"
              aria-hidden="true"
            />
            Platform Akademik Terintegrasi
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-ink-strong md:text-4xl">
              Masuk ke workspace sekolah Anda
            </h1>
            <p className="text-sm text-ink-muted md:text-base">
              Akses jadwal, nilai, presensi, dan koordinasi akademik dari satu
              dashboard modern.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-ink-muted md:grid-cols-2">
            {[
              {
                title: "Terpusat dan rapi",
                description:
                  "Seluruh data akademik tersimpan dalam satu workspace aman.",
                icon: GraduationCapIcon,
                tone: "text-info",
                bg: "bg-info/10",
              },
              {
                title: "Keamanan berlapis",
                description:
                  "Akses berbasis peran menjaga data tetap sesuai otoritas.",
                icon: ShieldCheckIcon,
                tone: "text-success",
                bg: "bg-success/10",
              },
              {
                title: "Kolaborasi real-time",
                description:
                  "Guru, staf, dan siswa terhubung tanpa hambatan komunikasi.",
                icon: UsersIcon,
                tone: "text-warning",
                bg: "bg-warning/10",
              },
              {
                title: "Status jelas",
                description:
                  "Pantau progres akademik dengan indikator yang mudah dipahami.",
                icon: SparklesIcon,
                tone: "text-brand",
                bg: "bg-brand/10",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-lg bg-surface-contrast p-4"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 items-center justify-center rounded-md",
                    item.bg,
                    item.tone,
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-lg bg-surface-contrast p-6">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold text-ink-strong">Masuk</h2>
              <p className="text-xs text-ink-muted">
                Gunakan kode sekolah dan kredensial resmi Anda.
              </p>
            </div>

            <LoginForm />

            <div className="mt-5 rounded-md bg-surface px-3 py-2 text-xs text-ink-muted">
              Butuh bantuan? Hubungi admin sekolah Anda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
