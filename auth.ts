import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { getUserById } from '@/data/user'
import { userRole } from '@prisma/client'


export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    pages: {
        signIn: '/auth/login',
        signOut: '/',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/new-user',
    }, 
    events: {
        async linkAccount({ user }) {

            db.user.update({
                where: {
                    id: user.id
                },
                data: {
                    emailVerified: new Date()
                }
            })
        }
    },
    callbacks: {

        async session({ session, token }) {
            console.log({ sessionToken: token })
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            if (token.role && session.user) {
                session.user.role = token.role as userRole
            }
            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token

            const existingUser = await getUserById(token.sub)
            if (!existingUser) return token

            token.role = existingUser.role

            return token
        }
    },
    adapter: PrismaAdapter({ db }),
    session: { strategy: 'jwt' },
    ...authConfig,
})