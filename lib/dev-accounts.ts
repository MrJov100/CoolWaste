export const DEV_ACCOUNTS = [
  {
    label: "🛡️ Admin CoolWaste",
    email: "admin@coolwaste.id",
    password: "Admin@CoolWaste2024",
  },
  {
    label: "User Budi",
    email: "budi@example.com",
    password: "password123",
  },
  {
    label: "User Siti",
    email: "siti@example.com",
    password: "password123",
  },
  {
    label: "Collector Andika",
    email: "andika@example.com",
    password: "password123",
  },
  {
    label: "Collector Dini",
    email: "dini.collector@example.com",
    password: "password123",
  },
] as const;

export function isDevAccountSwitcherEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function getDevAccountByEmail(email: string) {
  return DEV_ACCOUNTS.find((account) => account.email === email);
}
