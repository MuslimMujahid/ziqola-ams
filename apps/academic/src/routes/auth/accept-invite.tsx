import { z } from "zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AcceptInviteForm } from "@/routes/auth/-components/accept-invite-form";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/accept-invite")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AcceptInvitePage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-lg bg-surface-contrast p-6">
          <div className="mb-6 space-y-2">
            <h1 className="text-xl font-semibold text-ink-strong">
              Aktifkan akun Anda
            </h1>
            <p className="text-xs text-ink-muted">
              Tetapkan kata sandi untuk mengaktifkan akun undangan.
            </p>
          </div>

          {!token ? (
            <div
              role="alert"
              className="rounded-md bg-error/10 px-4 py-3 text-sm text-error"
            >
              Token undangan tidak ditemukan. Pastikan link undangan benar.
            </div>
          ) : null}

          <div className="mt-4">
            <AcceptInviteForm token={token} />
          </div>

          <div className="mt-6 text-center text-xs text-ink-muted">
            Sudah punya akun?{" "}
            <Link to="/auth/login" className="text-brand hover:text-brand/80">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
