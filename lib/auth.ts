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

      // Handle Google OAuth - only query db if account is google
      if (account?.provider === 'google' && token.email && !token.id) {
        try {
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
          } else {
            // Update googleId if not already set
            if (!dbUser.googleId) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { googleId: user?.id || account.providerAccountId },
              });
            }
          }

          token.id = dbUser.id.toString();
        } catch (error) {
          console.error('JWT callback error:', error);
        }
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
      try {
        if (user?.id) {
          const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          
          const existingPrefs = await prisma.userPreference.findUnique({
            where: { userId },
          });

          if (!existingPrefs) {
            await prisma.userPreference.create({
              data: {
                userId,
                nightMode: false,
              },
            });
          }
        }
      } catch (error) {
        console.error('SignIn event error:', error);
      }
    },
  },
};
