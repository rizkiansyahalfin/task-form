import { NotFoundError } from "@/lib/errors";
import { studentRepository } from "@/repositories/student.repository";
import type { PaginationParams } from "@/types";

export class StudentService {
  async listStudents(params: PaginationParams & { status?: "active" | "inactive" | "all" }) {
    const { items, total } = await studentRepository.findMany(params);
    const stats = await studentRepository.getStudentStats();
    return { items, total, stats };
  }

  async updateStudentStatus(id: string, active: boolean) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    return studentRepository.updateStatus(id, active);
  }
}

export const studentService = new StudentService();
