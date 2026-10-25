/**
 * Auth contracts: registration, login and the public user shape.
 */
import { z } from 'zod';
import { RoleSchema } from '../enums';

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt ignores everything after 72 bytes, so longer passwords are refused. */
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 254;

/** UTF-8 byte length of a string, without relying on TextEncoder typings. */
const utf8ByteLength = (value: string): number => {
  let bytes = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return bytes;
};

/** Email, trimmed and lowercased before format validation; at most 254 characters. */
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(EMAIL_MAX_LENGTH));

/** Register body (strict): name 1..80 trimmed, normalized email, password 8..72 chars and <= 72 UTF-8 bytes. */
export const RegisterInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  email: EmailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_LENGTH, {
      message: `Password must be at most ${PASSWORD_MAX_LENGTH} bytes`,
    }),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

/**
 * Login body (strict): normalized email and a non-empty password. No minimum
 * length, so a wrong password is a uniform 401 rather than a 400.
 */
export const LoginInputSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

/** A user as exposed by the API. Unknown keys (e.g. `passwordHash`) are stripped. */
export const PublicUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  role: RoleSchema,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

/** Response of register and login: a bearer token plus the public user. */
export const AuthResponseSchema = z.object({
  token: z.string().min(1),
  user: PublicUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** Response of `GET /api/auth/me`. */
export const MeResponseSchema = z.object({ user: PublicUserSchema });
export type MeResponse = z.infer<typeof MeResponseSchema>;
