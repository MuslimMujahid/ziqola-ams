import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  ClipboardSignatureIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { getDashboardRoute } from "@/lib/utils/auth";
import { cn } from "@/lib/utils";

const highlightItems = [
  {
    title: "Kode unik sekolah",
    description: "Tenant terpisah dengan domain aman untuk tiap sekolah.",
    icon: KeyIcon,
    tone: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "Admin utama",
    description: "Akses penuh untuk mengatur guru, siswa, dan izin.",
    icon: ShieldCheckIcon,
    tone: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Aktivasi cepat",
    description: "Workspace siap pakai kurang dari 5 menit.",
    icon: SparklesIcon,
    tone: "text-brand",
    bg: "bg-brand/10",
  },
];

const stepItems = [
  {
    title: "Lengkapi profil sekolah",
    description: "Isi kode, nama, dan jenjang pendidikan.",
  },
  {
    title: "Buat admin staf",
    description: "Admin pertama akan menjadi pengelola utama.",
  },
  {
    title: "Masuk dan konfigurasi",
    description: "Tambahkan guru, kelas, dan peran sesuai kebutuhan.",
  },
];

export const Route = createFileRoute("/auth/register")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (user?.role) {
      throw redirect({
        to: getDashboardRoute(user.role),
      });
    }
  },
  component: RegisterPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <div className="w-full max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-muted">
            <SparklesIcon
              className="h-3.5 w-3.5 text-brand"
              aria-hidden="true"
            />
            Onboarding Sekolah Baru
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-ink-strong md:text-4xl">
              Buat workspace sekolah modern dalam hitungan menit
            </h1>
            <p className="text-sm text-ink-muted md:text-base">
              Satu alur registrasi untuk menyiapkan tenant, kredensial admin,
              dan akses aman bagi seluruh tim akademik.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-ink-muted md:grid-cols-2">
            {highlightItems.map((item) => (
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

          <div className="rounded-lg bg-surface-contrast p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardSignatureIcon
                className="h-4 w-4 text-info"
                aria-hidden="true"
              />
              Alur registrasi singkat
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {stepItems.map((step, index) => (
                <div key={step.title} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <CheckCircle2Icon
                      className="h-3.5 w-3.5 text-success"
                      aria-hidden="true"
                    />
                    Langkah {index + 1}
                  </div>
                  <p className="text-sm text-ink">{step.title}</p>
                  <p className="text-xs text-ink-muted">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-lg bg-surface-contrast p-6">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold text-ink-strong">
                Daftarkan Sekolah
              </h2>
              <p className="text-xs text-ink-muted">
                Masukkan identitas sekolah dan buat akun admin pertama.
              </p>
            </div>

            <RegisterForm />

            <div className="mt-5 space-y-2 text-xs text-ink-muted">
              <div className="rounded-md bg-surface px-3 py-2">
                Data terenkripsi dan dapat dihapus sesuai permintaan resmi
                sekolah.
              </div>
              <p className="text-center">
                Sudah punya akun?{" "}
                <Link
                  to="/auth/login"
                  className="text-brand hover:text-brand/80"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
