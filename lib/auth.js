import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const JWT_EXPIRES_IN = '7d';

export async function createUser(username, password, email) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, hashedPassword, email]
  );
  
  return result.rows[0];
}

export async function findUserByUsername(username) {
  const result = await pool.query(
    'SELECT id, username, password, email FROM users WHERE username = $1',
    [username]
  );
  
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0];
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export async function login(username, password) {
  const user = await findUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  const token = generateToken(user);
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    token
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
