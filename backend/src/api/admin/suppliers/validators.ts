import { z } from "zod";

export const PostAdminCreateSupplier = z.object({
  name: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const PutAdminUpdateSupplier = PostAdminCreateSupplier.partial();
