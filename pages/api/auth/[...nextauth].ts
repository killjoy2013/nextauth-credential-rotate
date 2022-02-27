import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT, JWTEncodeParams, JWTDecodeParams } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import jsonwebtoken from 'jsonwebtoken';
import { prisma } from 'db/prisma';

const defaultToken = {
  name: '',
  email: '',
  picture: '',
};

function createToken(username: string) {
  return {
    ...defaultToken,
    username,
    accessTokenExpires:
      Date.now() + parseInt(process.env.TOKEN_REFRESH_PERIOD) * 1000,
  };
}

async function refreshToken(token) {
  const { exp, iat, ...others } = token;

  const newRefreshToken = jsonwebtoken.sign(others, process.env.TOKEN_SECRET, {
    expiresIn: parseInt(process.env.TOKEN_MAX_AGE),
    algorithm: 'HS512',
  });

  await prisma.user.update({
    where: {
      username: token.username,
    },
    data: {
      refreshToken: newRefreshToken,
    },
  });

  return {
    ...others,
    accessTokenExpires:
      Date.now() + parseInt(process.env.TOKEN_REFRESH_PERIOD) * 1000,
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.TOKEN_SECRET,
  jwt: {
    secret: process.env.TOKEN_SECRET,
    maxAge: parseInt(process.env.TOKEN_MAX_AGE),
    encode: async (params: JWTEncodeParams): Promise<string> => {
      const { secret, token } = params;
      let encodedToken = '';
      if (token) {
        const { exp, iat, ...rest } = token;

        encodedToken = jsonwebtoken.sign(rest, secret, {
          expiresIn: parseInt(process.env.TOKEN_REFRESH_PERIOD),
          algorithm: 'HS512',
        });
      } else {
        console.log('TOKEN EMPTY. SO, LOGOUT!...');
        return '';
      }
      return encodedToken;
    },
    decode: async (params: JWTDecodeParams) => {
      const { token, secret } = params;
      const decoded = jsonwebtoken.decode(token);

      return { ...(decoded as JWT) };
    },
  },
  session: {
    maxAge: parseInt(process.env.TOKEN_MAX_AGE),
    updateAge: 0,
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return { ...user };
      }

      let left = ((token.accessTokenExpires as number) - Date.now()) / 1000;
      console.log({
        now: Date.now(),
        accessTokenExpires: token.accessTokenExpires,
        left,
      });

      if (left > 0) {
        return token;
      } else {
        let newToken = await refreshToken(token);
        return newToken;
      }
    },
    async session({ session, token }) {
      session.username = token.username;
      session.accessTokenExpires = token.accessTokenExpires;

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'LDAP',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        if (!username || !password) {
          throw new Error('enter username or password');
        }
        try {
          let token = createToken(username);
          return token;
          //return { username };
        } catch (error) {
          console.log(error);
          throw new Error('Authentication error');
        }
      },
    }),
  ],
};

export default NextAuth(authOptions);
