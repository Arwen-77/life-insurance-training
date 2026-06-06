const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, runQuery, getAll } = require('../database/query');

// JWT 密钥（应该放在环境变量中）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * 哈希密码
 * @param {string} password - 原始密码
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 哈希后的密码
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成 JWT token
 * @param {Object} payload - token 负载
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT token
 * @param {string} token - JWT token
 * @returns {Object|null}
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 创建用户
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱
 * @returns {Promise<Object>}
 */
async function createUser(username, password, email = null) {
  const hashedPassword = await hashPassword(password);
  const result = await runQuery(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hashedPassword, email]
  );
  return { id: result.lastID, username, email };
}

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>}
 */
async function findUserByUsername(username) {
  return await getOne('SELECT * FROM users WHERE username = ?', [username]);
}

/**
 * 根据 ID 查找用户
 * @param {number} id - 用户 ID
 * @returns {Promise<Object|null>}
 */
async function findUserById(id) {
  return await getOne('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
}

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object|null>}
 */
async function login(username, password) {
  const user = await findUserByUsername(username);
  
  if (!user) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }

  // 生成 token
  const token = generateToken({ 
    id: user.id, 
    username: user.username 
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    token
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  createUser,
  findUserByUsername,
  findUserById,
  login
};
