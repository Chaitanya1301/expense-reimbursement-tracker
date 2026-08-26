import { z } from "zod";
import { Category, RequestStatus } from "@prisma/client";

export const requestFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be greater than zero"),
  expenseDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Expense date is invalid"),
  category: z.nativeEnum(Category, { errorMap: () => ({ message: "Category must be selected" }) }),
  description: z.string().trim().min(1, "Description is required").max(2000),
});

export const createRequestSchema = requestFieldsSchema.extend({
  submit: z.boolean().optional(),
});

export const updateRequestSchema = requestFieldsSchema.partial();

export const rejectSchema = z.object({
  reason: z.string().trim().min(1, "A rejection reason is required").max(1000),
});

export const listRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  category: z.nativeEnum(Category).optional(),
  requesterId: z.string().uuid().optional(),
  keyword: z.string().trim().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});
