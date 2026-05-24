export interface AccountSession {
  accountId: string;
  username: string;
}

interface AccountRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

const ACCOUNTS_KEY = 'cosmic_destroyer_accounts';
const SESSION_KEY = 'cosmic_destroyer_session';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as AccountRecord[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveAccounts(list: AccountRecord[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export class AuthService {
  private session: AccountSession | null = null;

  constructor() {
    this.restoreSession();
  }

  restoreSession(): boolean {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as AccountSession;
      const exists = loadAccounts().some((a) => a.id === s.accountId);
      if (!exists) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      this.session = s;
      return true;
    } catch {
      return false;
    }
  }

  getSession(): AccountSession | null {
    return this.session;
  }

  isLoggedIn(): boolean {
    return this.session != null;
  }

  async register(
    username: string,
    password: string,
  ): Promise<{ ok: true; isNew: true } | { ok: false; error: string }> {
    const name = username.trim();
    if (name.length < 3) return { ok: false, error: 'Имя пилота: минимум 3 символа' };
    if (password.length < 4) return { ok: false, error: 'Пароль: минимум 4 символа' };
    const accounts = loadAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'Такой пилот уже зарегистрирован' };
    }
    const record: AccountRecord = {
      id: crypto.randomUUID(),
      username: name,
      passwordHash: await hashPassword(password),
      createdAt: Date.now(),
    };
    accounts.push(record);
    saveAccounts(accounts);
    this.setSession(record.id, record.username);
    return { ok: true, isNew: true };
  }

  async login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const name = username.trim();
    const accounts = loadAccounts();
    const acc = accounts.find((a) => a.username.toLowerCase() === name.toLowerCase());
    if (!acc) return { ok: false, error: 'Аккаунт не найден' };
    const hash = await hashPassword(password);
    if (acc.passwordHash !== hash) return { ok: false, error: 'Неверный пароль' };
    this.setSession(acc.id, acc.username);
    return { ok: true };
  }

  logout(): void {
    this.session = null;
    localStorage.removeItem(SESSION_KEY);
  }

  private setSession(accountId: string, username: string): void {
    this.session = { accountId, username };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
  }
}

export const authService = new AuthService();

export function profileStorageKey(accountId: string): string {
  return `cosmic_destroyer_profile_${accountId}`;
}
