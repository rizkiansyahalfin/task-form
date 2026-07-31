import { NotFoundError, ValidationError } from "@/lib/errors";
import { formRepository } from "@/repositories/form.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import type { CreateFormInput, PaginationParams, UpdateFormInput } from "@/types";
import { generateSlug } from "@/utils";

export class FormService {
  async listForms(mentorId: string, params: PaginationParams) {
    return formRepository.findMany(mentorId, params);
  }

  async getForm(id: string, mentorId: string) {
    const form = await formRepository.findById(id, mentorId);
    if (!form) {
      throw new NotFoundError("Form not found");
    }
    return form;
  }

  async getPublicForm(slug: string) {
    const form = await formRepository.findBySlug(slug);
    if (!form) {
      throw new NotFoundError("Form not found or not published");
    }
    return form;
  }

  async createForm(mentorId: string, data: CreateFormInput) {
    const slug = generateSlug(data.title);
    return formRepository.create(mentorId, { ...data, slug });
  }

  async updateForm(id: string, mentorId: string, data: UpdateFormInput) {
    await this.getForm(id, mentorId);
    return formRepository.update(id, mentorId, data);
  }

  async publishForm(id: string, mentorId: string) {
    const form = await this.getForm(id, mentorId);
    if (!form.fields.length) {
      throw new ValidationError("Cannot publish a form without fields");
    }
    return formRepository.updateStatus(id, mentorId, "PUBLISHED");
  }

  async unpublishForm(id: string, mentorId: string) {
    await this.getForm(id, mentorId);
    return formRepository.updateStatus(id, mentorId, "DRAFT");
  }

  async archiveForm(id: string, mentorId: string) {
    await this.getForm(id, mentorId);
    return formRepository.updateStatus(id, mentorId, "ARCHIVED");
  }

  async deleteForm(id: string, mentorId: string) {
    await this.getForm(id, mentorId);
    return formRepository.softDelete(id, mentorId);
  }

  async duplicateForm(id: string, mentorId: string) {
    const form = await this.getForm(id, mentorId);
    const slug = generateSlug(form.title);
    const title = `${form.title} (Copy)`;
    const duplicated = await formRepository.duplicate(id, mentorId, slug, title);
    if (!duplicated) {
      throw new NotFoundError("Form not found");
    }
    return duplicated;
  }

  async listPublishedForms(params: PaginationParams) {
    return formRepository.findPublished(params);
  }

  async getFormProgress(formId: string, mentorId: string) {
    // Verify form exists and belongs to the mentor
    await this.getForm(formId, mentorId);

    // Fetch all student accounts
    const students = await formRepository.findAllStudents();
    const emails = students.map((s) => s.email).filter(Boolean) as string[];

    // Fetch submissions for this form and these students
    const submissions = await submissionRepository.findByFormAndEmails(formId, emails);

    // Map student email to their latest submission (using normalized lowercase keys)
    const submissionMap = new Map<string, typeof submissions[0]>();
    for (const sub of submissions) {
      if (sub.email) {
        const key = sub.email.trim().toLowerCase();
        if (!submissionMap.has(key)) {
          submissionMap.set(key, sub);
        }
      }
    }

    const progress = students.map((student) => {
      const studentKey = student.email ? student.email.trim().toLowerCase() : "";
      const sub = studentKey ? submissionMap.get(studentKey) : null;
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        hasSubmitted: !!sub,
        submissionStatus: sub?.status ?? null,
        submittedAt: sub?.submittedAt ?? null,
        submissionId: sub?.id ?? null,
      };
    });

    const submittedCount = progress.filter((p) => p.hasSubmitted).length;

    return {
      formId,
      totalStudents: students.length,
      submittedCount,
      progress,
    };
  }

  async getMultiFormProgress(mentorId: string) {
    const formsResult = await formRepository.findPublished({
      limit: 100,
    });
    const publishedForms = formsResult.items
      .filter((f) => f.mentorId === mentorId)
      .map((f) => ({
        id: f.id,
        title: f.title,
        slug: f.slug,
        deadline: f.deadline,
        status: f.status,
      }));

    if (publishedForms.length === 0) {
      return {
        forms: [],
        totalStudents: 0,
        students: [],
      };
    }

    const students = await formRepository.findAllStudents();
    const emails = students.map((s) => s.email).filter(Boolean) as string[];

    const formIds = publishedForms.map((f) => f.id);
    const submissions = await submissionRepository.findByFormsAndEmails(formIds, emails);

    const subMap = new Map<string, typeof submissions[0]>();
    for (const sub of submissions) {
      if (sub.email) {
        const key = `${sub.email.trim().toLowerCase()}_${sub.formId}`;
        if (!subMap.has(key)) {
          subMap.set(key, sub);
        }
      }
    }

    const studentRecap = students.map((student) => {
      const studentEmailKey = student.email ? student.email.trim().toLowerCase() : "";

      const unsubmittedForms: {
        formId: string;
        formTitle: string;
        formSlug: string;
        deadline: Date | null;
      }[] = [];

      const submittedForms: {
        formId: string;
        formTitle: string;
        formSlug: string;
        submissionStatus: typeof submissions[0]["status"] | null;
        submittedAt: Date | null;
      }[] = [];

      for (const form of publishedForms) {
        const key = `${studentEmailKey}_${form.id}`;
        const sub = studentEmailKey ? subMap.get(key) : null;

        if (sub) {
          submittedForms.push({
            formId: form.id,
            formTitle: form.title,
            formSlug: form.slug,
            submissionStatus: sub.status,
            submittedAt: sub.submittedAt,
          });
        } else {
          unsubmittedForms.push({
            formId: form.id,
            formTitle: form.title,
            formSlug: form.slug,
            deadline: form.deadline,
          });
        }
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        unsubmittedForms,
        submittedForms,
        totalUnsubmitted: unsubmittedForms.length,
      };
    });

    return {
      forms: publishedForms,
      totalStudents: students.length,
      students: studentRecap,
    };
  }
}

export const formService = new FormService();
