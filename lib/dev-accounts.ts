export const DEV_ACCOUNTS = [
  {
    label: "User Jovandi",
    email: "logictime2021@gmail.com",
    password: "jovandi123",
  },
  {
    label: "Collector Budi",
    email: "budisantoso@gmail.com",
    password: "budi123",
  },
  {
    label: "Collector Michael",
    email: "jovandiprodana@gmail.com",
    password: "jovandi123",
  },
  {
    label: "Collector Adam",
    email: "adam@gmail.com",
    password: "adam123",
  },
] as const;

export function isDevAccountSwitcherEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function getDevAccountByEmail(email: string) {
  return DEV_ACCOUNTS.find((account) => account.email === email);
}
