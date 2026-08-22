import { z } from 'zod';

export const updateSecurityInfoSchema = z.object({
  bankDetails: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifsc: z.string().optional(),
  pan: z.string().optional(),
  uan: z.string().optional(),
});

export type UpdateSecurityInfoInput = z.infer<typeof updateSecurityInfoSchema>;
