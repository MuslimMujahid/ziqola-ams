import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { getDashboardRoute } from "@/lib/utils/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { GraduationCapIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

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
    <div className="p-6 text-red-600">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-900" />
    </div>
  ),
});

function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-12 md:flex-row">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Masuk ke akun sekolah Anda
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Gunakan akun resmi sekolah untuk mengakses jadwal, nilai,
              presensi, dan komunikasi kelas.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <GraduationCapIcon
                className="mt-0.5 h-4 w-4 text-[#61822C]"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-slate-800">
                  Satu akun untuk semua layanan
                </p>
                <p className="text-xs text-slate-500">
                  Kelola akademik, presensi, dan laporan dalam satu tempat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <ShieldCheckIcon
                className="mt-0.5 h-4 w-4 text-[#61822C]"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-slate-800">
                  Keamanan akun terjamin
                </p>
                <p className="text-xs text-slate-500">
                  Data Anda terlindungi dengan kebijakan akses bertingkat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <UsersIcon
                className="mt-0.5 h-4 w-4 text-[#61822C]"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-slate-800">
                  Kolaborasi lebih mudah
                </p>
                <p className="text-xs text-slate-500">
                  Terhubung dengan guru, siswa, dan orang tua secara real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <LoginForm />

            <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              Butuh bantuan? Hubungi admin sekolah Anda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
