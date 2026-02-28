export type Rol = "EDITOR" | "REVIEWER" | "VIEWER";

const ALLOWED_USERS: Record<string, Rol> = {
  "antjanlaban@gmail.com": "EDITOR",
  "merelvangurp@gmail.com": "EDITOR",
  "thomasisarin@gmail.com": "EDITOR",
};

export function getAllowedRole(email: string): Rol | null {
  return ALLOWED_USERS[email.toLowerCase()] ?? null;
}
