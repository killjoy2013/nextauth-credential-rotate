import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import jsonwebtoken from 'jsonwebtoken';
import { JWT } from 'next-auth/jwt';
import { signOut } from 'next-auth/react';

async function authenticate(username: string, password: string) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        username,
        password,
      });
    });
  });
}

async function refreshToken(oldToken: JWT): Promise<any> {
  let returnValue: any;
  return new Promise(async (resolve, reject) => {
    let username = oldToken.username as string;

    console.log(
      `${username} token will refresh on ${new Date().toLocaleTimeString()}`
    );

    try {
      let user = await prisma.user.findFirst({
        where: {
          username,
        },
      });

      if (!user || !user.refreshToken) {
        signOut();
        reject(`${username} not found or refresh token is empty!`);
      }

      const verified = jsonwebtoken.verify(
        user.refreshToken,
        process.env.TOKEN_SECRET
      ) as JWT;

      const claims = {
        username,
      };

      const newRefreshToken = jsonwebtoken.sign(
        claims,
        process.env.TOKEN_SECRET,
        {
          expiresIn: parseInt(process.env.TOKEN_MAX_AGE),
          algorithm: 'HS512',
        }
      );

      await prisma.user.update({
        where: {
          username,
        },
        data: {
          refreshToken: newRefreshToken,
        },
      });

      resolve({ claims });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

export default NextAuth({
  secret: process.env.TOKEN_SECRET,

  jwt: {
    secret: process.env.TOKEN_SECRET,
    encode: async (data: any) => {
      const { secret, token, maxAge } = data;
      const jwtClaims = {
        username: token.username,
      };

      const encodedToken = jsonwebtoken.sign(jwtClaims, secret, {
        expiresIn: '1h',
        algorithm: 'HS512',
      });
      return encodedToken;
    },
    async decode(data: any) {
      const { secret, token } = data;
      let verifiedJwt: any = null;

      try {
        verifiedJwt = jsonwebtoken.verify(token, secret) as JWT;
      } catch (error) {
        console.log(
          `decode failed on ${new Date().toLocaleTimeString()}, token refresh needed!`
        );
      }
      return verifiedJwt;
    },
  },
  session: {
    maxAge: parseInt(process.env.TOKEN_MAX_AGE),
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (token) {
        session.username = token.username;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const { username, password } = credentials;

        if (!username || !password) {
          throw new Error('enter username or password');
        }
        try {
          return { username };
        } catch (error) {
          console.log(error);
          throw new Error('Authentication error');
        }
      },
    }),
  ],
  // events: {
  //   async signOut({ session, token }) {
  //     await prisma.user.update({
  //       where: {
  //         username: token.username as string,
  //       },
  //       data: {
  //         refreshToken: null,
  //       },
  //     });
  //   },
  // },
});
