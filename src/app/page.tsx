import Link from "next/link";
import { BookOpen, CheckCircle, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">TaskForm</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-36 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
            <CheckCircle className="h-4 w-4" />
            Platform pengumpulan tugas santri
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-balance leading-tight">
            Kelola Tugas Santri{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Mudah &amp; Terstruktur
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            TaskForm membantu mentor membuat formulir tugas digital dan memantau pengumpulan
            dari santri secara real-time — tanpa kerumitan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                Mulai Gratis — Daftar Sekarang
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Semua yang Anda butuhkan, dalam satu platform
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Dirancang khusus untuk kebutuhan pesantren — dari mentor hingga santri.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Buat Formulir Tugas</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mentor dapat membuat formulir dengan 13+ jenis pertanyaan — teks, file upload,
                    pilihan ganda, dan banyak lagi. Tetapkan tenggat waktu dan aturan pengumpulan.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Kumpulkan Tugas</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Santri mengisi dan mengumpulkan tugas melalui link yang dibagikan — bisa lewat
                    akun santri atau tanpa login. Unggah file, isi jawaban, kirim dengan mudah.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Pantau Progress</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mentor dapat melihat siapa saja yang sudah dan belum mengumpulkan,
                    meninjau jawaban, dan memperbarui status — Selesai, Ditinjau, atau Perlu Revisi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Siap memulai?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Daftar gratis sekarang dan mulai kelola tugas santri Anda secara digital.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-12 px-10 text-base font-semibold shadow-lg shadow-primary/20">
              Daftar Sekarang — Gratis
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-semibold text-foreground">TaskForm</span>
            <span>— Platform Tugas Santri</span>
          </div>
          <p>© {new Date().getFullYear()} TaskForm. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
