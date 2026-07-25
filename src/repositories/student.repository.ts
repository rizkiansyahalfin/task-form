import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { PaginationParams } from "@/types";

export class StudentRepository {
  async findMany(params: PaginationParams & { status?: "active" | "inactive" | "all" }) {
    const { page = 1, limit = 10, search, status = "all", sortBy = "name", sortOrder = "asc" } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: "student",
      ...(status === "active" ? { deletedAt: null } : {}),
      ...(status === "inactive" ? { deletedAt: { not: null } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async getStudentStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.user.count({ where: { role: "student" } }),
      prisma.user.count({ where: { role: "student", deletedAt: null } }),
      prisma.user.count({ where: { role: "student", deletedAt: { not: null } } }),
    ]);

    return { total, active, inactive };
  }

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, role: "student" },
    });
  }

  async updateStatus(id: string, active: boolean) {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: active ? null : new Date(),
      },
    });
  }
}

export const studentRepository = new StudentRepository();
