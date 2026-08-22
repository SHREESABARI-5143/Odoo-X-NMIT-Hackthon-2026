import { z } from 'zod';

export const updatePrivateInfoSchema = z.object({
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
});

export type UpdatePrivateInfoInput = z.infer<typeof updatePrivateInfoSchema>;
