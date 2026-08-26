import { z } from "zod";
import { AccountStatus, Role } from "@prisma/client";

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});
