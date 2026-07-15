"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Settings,
  ListPlus,
  Save,
  ChevronRight,
  Info,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

import { MentorLayout } from "@/components/layout/mentor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormBuilderStore } from "@/hooks/use-form-builder-store";
import { useCreateForm } from "@/hooks/use-forms";
import { FIELD_TYPES } from "@/constants";

export default function NewFormPage() {
  const router = useRouter();
  const createFormMutation = useCreateForm();
  
  const {
    title,
    description,
    deadline,
    allowLate,
    maxSubmissions,
    allowEdit,
    collectEmail,
    successTitle,
    successMessage,
    customMessage,
    fields,
    selectedFieldIndex,
    setTitle,
    setDescription,
    setDeadline,
    setAllowLate,
    setMaxSubmissions,
    setAllowEdit,
    setCollectEmail,
    setSuccessTitle,
    setSuccessMessage,
    setCustomMessage,
    addField,
    updateField,
    removeField,
    moveField,
    selectField,
    reset
  } = useFormBuilderStore();

  useEffect(() => {
    reset();
  }, [reset]);

  const handleAddField = (type: typeof FIELD_TYPES[number]) => {
    addField({
      type,
      label: `New ${type.toLowerCase().replace("_", " ")} question`,
      placeholder: "",
      required: false,
      order: fields.length,
      options: ["RADIO", "CHECKBOX", "DROPDOWN"].includes(type)
        ? [
            { label: "Option 1", value: "option-1", order: 0 },
            { label: "Option 2", value: "option-2", order: 1 }
          ]
        : []
    });
    selectField(fields.length);
  };

  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast.error("Please provide a form title");
      return;
    }

    try {
      const payload = {
        title,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        allowLate,
        maxSubmissions: maxSubmissions ? parseInt(maxSubmissions, 10) : null,
        allowEdit,
        collectEmail,
        successTitle: successTitle || "Thank you!",
        successMessage: successMessage || "Your submission has been received.",
        customMessage: customMessage || undefined,
        fields: fields.map((f, idx) => ({
          ...f,
          order: idx
        }))
      };

      await createFormMutation.mutateAsync(payload);
      toast.success("Form created successfully!");
      reset();
      router.push("/forms");
    } catch (err: any) {
      toast.error(err.message || "Failed to create form");
    }
  };

  return (
    <MentorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Form Task</h1>
            <p className="text-muted-foreground">
              Design a custom submission form for your students or santri.
            </p>
          </div>
          <Button
            onClick={handleSaveForm}
            disabled={createFormMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Save Form Task
          </Button>
        </div>

        {/* Grid Builder */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel: Configurations */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Form Configuration
                </CardTitle>
                <CardDescription>Configure task metadata and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title *</Label>
                  <Input
                    id="form-title"
                    placeholder="e.g. Tugas Evaluasi Minggu 1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-desc">Description</Label>
                  <Textarea
                    id="form-desc"
                    placeholder="Provide clear instructions for students..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-deadline">Deadline Date & Time</Label>
                  <Input
                    id="form-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-late">Allow Late Submissions</Label>
                    <p className="text-xs text-muted-foreground">Accept responses after deadline</p>
                  </div>
                  <Switch
                    id="allow-late"
                    checked={allowLate}
                    onCheckedChange={setAllowLate}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="collect-email">Require Email Address</Label>
                    <p className="text-xs text-muted-foreground">Students must specify their email</p>
                  </div>
                  <Switch
                    id="collect-email"
                    checked={collectEmail}
                    onCheckedChange={setCollectEmail}
                  />
                </div>

                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="max-subs">Maximum Submissions</Label>
                  <Input
                    id="max-subs"
                    type="number"
                    placeholder="Unlimited"
                    value={maxSubmissions}
                    onChange={(e) => setMaxSubmissions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Screen Config</CardTitle>
                <CardDescription>Shown after successful task submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="success-title">Success Title</Label>
                  <Input
                    id="success-title"
                    value={successTitle}
                    onChange={(e) => setSuccessTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success-msg">Success Message</Label>
                  <Textarea
                    id="success-msg"
                    rows={2}
                    value={successMessage}
                    onChange={(e) => setSuccessMessage(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Fields & Question Builder */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Form Questions ({fields.length})</CardTitle>
                  <CardDescription>Add, rearrange, and configure your questions</CardDescription>
                </div>
                <Select onValueChange={(val) => handleAddField(val as any)}>
                  <SelectTrigger className="w-[180px]">
                    <Plus className="mr-2 h-4 w-4" /> Add Question
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHORT_TEXT">Short Text</SelectItem>
                    <SelectItem value="TEXTAREA">Paragraph Text</SelectItem>
                    <SelectItem value="NUMBER">Number Input</SelectItem>
                    <SelectItem value="DATE">Date Picker</SelectItem>
                    <SelectItem value="DROPDOWN">Dropdown List</SelectItem>
                    <SelectItem value="RADIO">Multiple Choice (Radio)</SelectItem>
                    <SelectItem value="CHECKBOX">Checkboxes</SelectItem>
                    <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                    <SelectItem value="IMAGE_UPLOAD">Image Upload</SelectItem>
                    <SelectItem value="GITHUB_URL">GitHub URL Input</SelectItem>
                    <SelectItem value="DEPLOY_URL">Deployment Link</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                    <ListPlus className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium">No questions added yet</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Select a question type from the button above to begin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 transition-all ${
                          selectedFieldIndex === idx
                            ? "border-primary ring-1 ring-primary/30"
                            : "hover:border-zinc-300"
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => selectField(idx === selectedFieldIndex ? null : idx)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-0.5">
                              Q{idx + 1}
                            </span>
                            <span className="font-semibold text-sm">{field.label}</span>
                            <span className="text-xs text-muted-foreground">
                              ({field.type.toLowerCase().replace("_", " ")})
                            </span>
                            {field.required && (
                              <span className="text-xs text-destructive font-semibold">* Required</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={idx === 0}
                              onClick={() => moveField(idx, idx - 1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={idx === fields.length - 1}
                              onClick={() => moveField(idx, idx + 1)}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => removeField(idx)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Field Editor */}
                        {selectedFieldIndex === idx && (
                          <div className="mt-4 pt-4 border-t space-y-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label>Question Title / Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(idx, { label: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Placeholder text</Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                              />
                            </div>

                            <div className="flex items-center justify-between border rounded px-3 py-2 bg-zinc-50 dark:bg-zinc-900 mt-6">
                              <Label htmlFor={`req-${idx}`}>Required Question</Label>
                              <Switch
                                id={`req-${idx}`}
                                checked={field.required}
                                onCheckedChange={(val) => updateField(idx, { required: val })}
                              />
                            </div>

                            {/* Options Editor (Radio, Checkbox, Dropdown) */}
                            {["RADIO", "CHECKBOX", "DROPDOWN"].includes(field.type) && (
                              <div className="space-y-2 md:col-span-2 border rounded p-3 bg-zinc-50 dark:bg-zinc-900">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Options
                                  </Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const currentOptions = field.options || [];
                                      const nextOrder = currentOptions.length;
                                      updateField(idx, {
                                        options: [
                                          ...currentOptions,
                                          {
                                            label: `Option ${nextOrder + 1}`,
                                            value: `option-${nextOrder + 1}`,
                                            order: nextOrder
                                          }
                                        ]
                                      });
                                    }}
                                  >
                                    Add Option
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {field.options?.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <Input
                                        className="h-8 text-sm flex-1 bg-background"
                                        value={opt.label}
                                        onChange={(e) => {
                                          const nextOptions = [...(field.options || [])];
                                          nextOptions[optIdx] = {
                                            ...opt,
                                            label: e.target.value,
                                            value: e.target.value.toLowerCase().replace(/\s+/g, "-")
                                          };
                                          updateField(idx, { options: nextOptions });
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          const nextOptions = (field.options || [])
                                            .filter((_, i) => i !== optIdx)
                                            .map((o, i) => ({ ...o, order: i }));
                                          updateField(idx, { options: nextOptions });
                                        }}
                                      >
                                        <Trash className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MentorLayout>
  );
}
