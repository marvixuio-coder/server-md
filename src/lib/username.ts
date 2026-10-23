// Accounts sign in with a username only. The auth system needs an email, so each
// username maps to a fixed internal address that never receives mail.
export const USERNAME_DOMAIN = "md-users.app";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(raw));
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${USERNAME_DOMAIN}`;
}

export const MIN_PASSWORD_LENGTH = 6;
