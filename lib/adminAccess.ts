// Admin allowlist. Defaults to the project owner; override with a comma-separated
// NEXT_PUBLIC_ADMIN_EMAILS env var to grant additional admins.
//
// NOTE: this gates the admin UI. The authoritative enforcement is in
// firestore.rules, which must list the same emails (see isAdmin() there).

const DEFAULT_ADMIN_EMAILS = ['ezra@beamthink.institute']

const configured = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const ADMIN_EMAILS = configured && configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()))
}
