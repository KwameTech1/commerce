import type { User } from "lib/types";
import { readStorage, removeStorage, writeStorage } from "./storage";
import { detachOrdersFromUser } from "./orders";

const USERS_KEY = "users";
const SESSION_KEY = "current-user-id";

export const AUTH_EVENT = "rarecart:auth-change";

const MIN_NAME_LENGTH = 2;
export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function notifyAuthChange(): void {
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

function validateRegistration(input: {
  name: string;
  email: string;
  password: string;
}): string | null {
  if (!input.name.trim() || !input.email.trim() || !input.password) {
    return "All fields are required.";
  }

  if (input.name.trim().length < MIN_NAME_LENGTH) {
    return "Please enter your full name.";
  }

  if (!EMAIL_PATTERN.test(input.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const SALT_LENGTH = 16;

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  return out;
}

async function hashPassword(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const hash = await sha256(concat(salt, encoder.encode(password)));
  return `v2:${toBase64(salt)}:${toBase64(hash)}`;
}

async function createPasswordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return hashPassword(password, salt);
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [version, saltB64, expectedHashB64] = stored.split(":");

  if (version !== "v2" || !saltB64 || !expectedHashB64) {
    return false;
  }

  const candidate = await hashPassword(password, fromBase64(saltB64));
  return candidate === stored;
}

function isLegacyHash(stored: string): boolean {
  return stored.startsWith("demo-");
}

let lastUserIdTimestamp = 0;

function nextUserId(): string {
  const nowMs = Date.now();
  const timestamp =
    nowMs > lastUserIdTimestamp ? nowMs : lastUserIdTimestamp + 1;
  lastUserIdTimestamp = timestamp;
  return `u-${timestamp}`;
}

function legacyHash(password: string): string {
  let hash = 5381;

  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }

  return `demo-${(hash >>> 0).toString(36)}`;
}

export function getUsers(): User[] {
  const users = readStorage<User[]>(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function getCurrentUser(): User | null {
  const id = readStorage<string | null>(SESSION_KEY, null);

  if (!id) {
    return null;
  }

  return getUsers().find((user) => user.id === id) ?? null;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const validationError = validateRegistration(input);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const email = input.email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: User = {
    id: nextUserId(),
    name: input.name.trim(),
    email,
    passwordHash: await createPasswordHash(input.password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeStorage(USERS_KEY, users);
  return { ok: true, user };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const users = getUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());

  if (!user) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (isLegacyHash(user.passwordHash)) {
    if (legacyHash(password) !== user.passwordHash) {
      return { ok: false, error: "Invalid email or password." };
    }

    if (crypto.subtle) {
      user.passwordHash = await createPasswordHash(password);
      writeStorage(USERS_KEY, users);
    }

    return { ok: true, user };
  }

  if (await verifyPassword(password, user.passwordHash)) {
    return { ok: true, user };
  }

  return { ok: false, error: "Invalid email or password." };
}

export function setCurrentUser(userId: string | null): void {
  if (userId === null) {
    removeStorage(SESSION_KEY);
  } else {
    writeStorage(SESSION_KEY, userId);
  }

  notifyAuthChange();
}

export function logout(): void {
  removeStorage(SESSION_KEY);
  notifyAuthChange();
}

export async function updateProfile(
  userId: string,
  input: { name: string; email: string },
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const users = getUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  if (!input.name.trim() || !input.email.trim()) {
    return { ok: false, error: "All fields are required." };
  }

  if (input.name.trim().length < MIN_NAME_LENGTH) {
    return { ok: false, error: "Please enter your full name." };
  }

  if (!EMAIL_PATTERN.test(input.email.trim())) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const email = input.email.trim().toLowerCase();

  if (
    users.some(
      (candidate) => candidate.email === email && candidate.id !== userId,
    )
  ) {
    return { ok: false, error: "An account with this email already exists." };
  }

  user.name = input.name.trim();
  user.email = email;
  writeStorage(USERS_KEY, users);
  notifyAuthChange();
  return { ok: true, user };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = getUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  const currentValid = isLegacyHash(user.passwordHash)
    ? legacyHash(currentPassword) === user.passwordHash
    : await verifyPassword(currentPassword, user.passwordHash);

  if (!currentValid) {
    return { ok: false, error: "Your current password is incorrect." };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  user.passwordHash = await createPasswordHash(newPassword);
  writeStorage(USERS_KEY, users);
  return { ok: true };
}

export function deleteAccount(userId: string): void {
  const users = getUsers().filter((user) => user.id !== userId);
  writeStorage(USERS_KEY, users);

  if (readStorage<string | null>(SESSION_KEY, null) === userId) {
    removeStorage(SESSION_KEY);
  }

  detachOrdersFromUser(userId);
  notifyAuthChange();
}
