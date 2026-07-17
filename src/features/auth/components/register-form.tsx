"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/schemas";

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    // Cast to any is used temporarily to bypass strict typing differences
    // between Zod v4 prerelease/draft schema formats and react-hook-form's zodResolver.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema as any),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        // @ts-expect-error Better Auth additional fields typing
        role: "student",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Pendaftaran gagal");
        return;
      }

      toast.success("Akun berhasil dibuat! Selamat datang.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Daftar ke TaskForm</CardTitle>
        <CardDescription>Buat akun santri untuk mulai mengumpulkan tugas</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nama Lengkap Anda"
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 karakter, huruf besar & angka"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Mendaftar..." : "Daftar"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Sudah punya akun?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Masuk
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
