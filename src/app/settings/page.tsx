"use client";

import { User, Mail, Shield, CheckCircle } from "lucide-react";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <MentorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and view system settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Details</CardTitle>
              <CardDescription>Your personal mentor profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Name
                </Label>
                <Input value="Demo Mentor" disabled className="bg-zinc-50 dark:bg-zinc-900" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                </Label>
                <Input value="mentor@taskform.dev" disabled className="bg-zinc-50 dark:bg-zinc-900" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" /> Role
                </Label>
                <Input value="Mentor / Administrator" disabled className="bg-zinc-50 dark:bg-zinc-900" />
              </div>
            </CardContent>
          </Card>

          {/* System status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Connection</CardTitle>
              <CardDescription>Check status of external adapters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-semibold text-sm">PostgreSQL Database</p>
                  <p className="text-xs text-muted-foreground">Connected to localhost:5432</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-950 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Operational
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-semibold text-sm">Better Auth Service</p>
                  <p className="text-xs text-muted-foreground">Configured and active</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-950 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Operational
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">R2 / S3 Object Storage</p>
                  <p className="text-xs text-muted-foreground">Mock configuration (local fallback)</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-400">
                  <CheckCircle className="h-3 w-3" /> local fallback
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}
