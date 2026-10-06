const secretStr = process.env.JWT_SECRET;

if (!secretStr || secretStr.trim().length < 32) {
  console.error('FATAL: JWT_SECRET environment variable is missing or insecure (minimum 32 characters required).');
  process.exit(1);
}

export const JWT_SECRET = new TextEncoder().encode(secretStr.trim());
