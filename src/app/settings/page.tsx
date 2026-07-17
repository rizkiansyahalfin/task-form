"use client";

import { User, Mail, Shield, CheckCircle, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <MentorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </MentorLayout>
    );
  }

  const name = session?.user?.name || "Tidak Diketahui";
  const email = session?.user?.email || "-";
  const role = (session?.user as { role?: string })?.role || "student";

  return (
    <MentorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola preferensi akun Anda dan lihat detail koneksi sistem.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detail Profil</CardTitle>
                <Badge variant={role === "mentor" ? "default" : "secondary"} className="capitalize">
                  {role === "mentor" ? "Mentor" : "Santri"}
                </Badge>
              </div>
              <CardDescription>Informasi detail akun pribadi Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Nama Lengkap
                </Label>
                <Input value={name} disabled className="bg-zinc-50 dark:bg-zinc-900" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Alamat Email
                </Label>
                <Input value={email} disabled className="bg-zinc-50 dark:bg-zinc-900" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" /> Peran Akun
                </Label>
                <Input
                  value={role === "mentor" ? "Mentor / Administrator" : "Santri / Siswa"}
                  disabled
                  className="bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </CardContent>
          </Card>

          {/* System status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Koneksi Sistem</CardTitle>
              <CardDescription>Status adapters dan penyimpanan eksternal saat ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-semibold text-sm">Database PostgreSQL</p>
                  <p className="text-xs text-muted-foreground">Tersambung ke PostgreSQL Adapter</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-950 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Aktif
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-semibold text-sm">Layanan Better Auth</p>
                  <p className="text-xs text-muted-foreground">Autentikasi terkonfigurasi & aktif</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-950 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Aktif
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Penyimpanan Objek R2 / S3</p>
                  <p className="text-xs text-muted-foreground">Mock configuration (local fallback)</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-400">
                  <CheckCircle className="h-3 w-3" /> Penyimpanan Lokal
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}
