/**
 * ADMIN CONFIGURATION
 * ===================
 * This file is the CLIENT-SIDE counterpart to the isAdminEmail() function in
 * firestore.rules. It is used ONLY for UI display purposes (e.g. showing an
 * "Admin" badge, hiding/showing the "Create Tournament" button, or populating
 * the `role` field on the profile document).
 *
 * ⚠️  SECURITY NOTE: This list does NOT enforce any real access control.
 * The authoritative security check is in firestore.rules via request.auth.token.email,
 * which comes from the verified Firebase Auth ID token and cannot be spoofed by a client.
 *
 * ✏️  HOW TO ADD/REMOVE ADMINS:
 * 1. Edit ADMIN_EMAILS below (this file) → affects UI display.
 * 2. Edit the isAdminEmail() function in firestore.rules → affects actual DB permissions.
 * 3. Deploy updated rules: `firebase deploy --only firestore:rules`
 * Both lists MUST be kept in sync manually. There is no in-app admin management UI.
 *
 * ✏️  CASE HANDLING:
 * All emails are stored here and compared in LOWERCASE. Firebase Auth (Google OAuth)
 * normalises emails to lowercase internally. The isAdmin() function lowercases both
 * the input and the list entries before comparing, so 'Vk844504@gmail.com' and
 * 'vk844504@gmail.com' are treated identically here.
 * firestore.rules must likewise use lowercase email strings to match what
 * request.auth.token.email returns at runtime.
 */
export const ADMIN_EMAILS: readonly string[] = [
  // Store all admin emails in lowercase — Firebase Auth returns lowercase from token.
  'asthaojas30@gmail.com',
  'vk844504@gmail.com',
  // Add more admin emails here (always lowercase).
  // Mirror these exact lowercase values inside firestore.rules → isAdminEmail().
];

/**
 * Returns true if the given email belongs to a platform admin.
 * Case-insensitive: both the input and the stored list entries are lowercased
 * before comparison, so mixed-case entries never cause false negatives.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}
