// src/lib/auth.js

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Your account has been suspended. Please contact administrator.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            module: 'AUTH',
            details: { email: user.email },
          },
        });

        // Extract permission names
        const permissions = user.role.permissions.map((rp) => rp.permission.name);

        // Return user with role and permissions
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
            permissions: permissions,
          },
          roleId: user.roleId,
          mustChangePassword: user.mustChangePassword,
          permissions: permissions,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle session update from client
      if (trigger === 'update' && session?.user) {
        // Merge updated user data into token
        return { ...token, ...session.user };
      }
      
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.roleId = user.roleId;
        token.mustChangePassword = user.mustChangePassword;
        token.permissions = user.permissions;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.permissions = token.permissions;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await prisma.activityLog.create({
          data: {
            userId: parseInt(token.id),
            action: 'LOGOUT',
            module: 'AUTH',
          },
        });
      }
    },
  },
};