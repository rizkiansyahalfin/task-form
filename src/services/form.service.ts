import { NotFoundError, ValidationError } from "@/lib/errors";
import { formRepository } from "@/repositories/form.repository";
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
}

export const formService = new FormService();
