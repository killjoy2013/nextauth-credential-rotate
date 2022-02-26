import NextAuth from 'next-auth';
import { JWT, JWTEncodeParams, JWTDecodeParams } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import jsonwebtoken from 'jsonwebtoken';

function createToken(username: string) {
  return {
    username,
    willExpire: Date.now() + parseInt(process.env.TOKEN_REFRESH_PERIOD) * 1000,
  };
}

function refreshToken(token) {
  const { iat, exp, ...others } = token;

  return {
    ...others,
    willExpire: Date.now() + parseInt(process.env.TOKEN_REFRESH_PERIOD) * 1000,
  };
}

export default NextAuth({
  secret: process.env.TOKEN_SECRET,
  jwt: {
    secret: process.env.TOKEN_SECRET,
    maxAge: parseInt(process.env.TOKEN_MAX_AGE),
    encode: async (params: JWTEncodeParams): Promise<string> => {
      const { secret, token } = params;
      let encodedToken = '';
      if (token) {
        const jwtClaims = {
          username: token.username,
          willExpire: token.willExpire,
        };

        encodedToken = jsonwebtoken.sign(jwtClaims, secret, {
          expiresIn: parseInt(process.env.TOKEN_REFRESH_PERIOD),
          algorithm: 'HS512',
        });

        console.log({ encodedToken });
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
      if (user) {
        token = createToken(user.username as string);
      }

      let left = ((token.willExpire as number) - Date.now()) / 1000;
      console.log({
        now: Date.now(),
        willExpire: token.willExpire,
        left,
      });

      if (left > 0) {
        return token;
      } else {
        let newToken = await refreshToken(token);
        return { ...newToken };
      }
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.username = token.username;
      session.willExpire = token.willExpire;
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
        } catch (error) {
          console.log(error);
          throw new Error('Authentication error');
        }
      },
    }),
  ],
});
