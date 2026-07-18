import { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from './prisma';
import { compare, hash } from 'bcryptjs';
import { decodeJwt } from './auth-helpers';

// Extend the built-in session type to include id
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Handle Google OAuth
      if (account?.provider === 'google' && token.email) {
        // Check if user exists with this email
        let dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        // If not, create new user for Google login
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name || '',
              googleId: user?.id || account.providerAccountId,
              password: await hash(Math.random().toString(36).slice(-32), 10),
            },
          });

          // Initialize user preferences
          await prisma.userPreference.create({
            data: {
              userId: dbUser.id,
              nightMode: false,
            },
          });
        }

        token.id = dbUser.id.toString();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Initialize user preferences if signing in for the first time
      if (account?.provider === 'google' && user.email) {
        const existingPrefs = await prisma.userPreference.findUnique({
          where: { userId: parseInt(user.id) },
        });

        if (!existingPrefs) {
          await prisma.userPreference.create({
            data: {
              userId: parseInt(user.id),
              nightMode: false,
            },
          });
        }
      }
    },
  },
};
