import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';
import { db } from '#config/database.js';
import logger from '#config/logger.js';

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Failed to hash password', error);
    throw new Error('Failed to hash password', { cause: error });
  }
};

export const createUser = async ({ name, email, password, role='user'}) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role})
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.createdAt });

    logger.info(`User created: ${email} with role ${role}`);
    return newUser;
  } catch (error) {
    if (error.message === 'User with this email already exists') throw error;
    logger.error('Failed to create user', error);
    throw new Error('Failed to create user', { cause: error });
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Failed to compare password', error);
    throw new Error('Failed to compare password', { cause: error });
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User authenticated: ${email}`);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch (error) {
    logger.error('Failed to authenticate user', error);
    throw error;
  }
};