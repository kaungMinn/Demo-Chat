import { z } from "zod";

// Password complexity requirements
export const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");


export const authValidation = z.object({
    name: z.string().optional(),
    roles: z.array(z.number()).optional(),
    email: z.string().email("Invalid email"),
    password: passwordValidation
})