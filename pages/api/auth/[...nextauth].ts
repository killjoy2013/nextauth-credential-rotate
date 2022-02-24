import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import jsonwebtoken from 'jsonwebtoken';
import { JWT } from 'next-auth/jwt';
import { signOut } from 'next-auth/react';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db/prisma';

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

    console.log(`username from old token`, { oldToken, username });

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

      console.log(`refreshed on ${new Date().toLocaleTimeString()}`, {
        newRefreshToken,
        username,
      });

      try {
        await prisma.user.update({
          where: {
            username,
          },
          data: {
            refreshToken: newRefreshToken,
          },
        });
        console.log(`update success on ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.log('update error', error);
      }

      resolve(claims);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

function getTokenFromCookie({
  req,
}: {
  req: { cookies: NextApiRequestCookies };
}) {
  try {
    const sessionToken = req.cookies?.[`next-auth.session-token`];

    return sessionToken;
  } catch {
    return null;
  }
}

async function createToken(username: string) {
  const claims = {
    username: username,
  };

  let refreshToken = jsonwebtoken.sign(claims, process.env.TOKEN_SECRET, {
    expiresIn: parseInt(process.env.TOKEN_MAX_AGE),
    algorithm: 'HS512',
  });

  await prisma.user.upsert({
    where: { username },
    update: { refreshToken },
    create: { username, refreshToken },
  });

  return claims;
}

const nextAuthOptions = (req: NextApiRequest, res: NextApiResponse) => {
  return {
    secret: process.env.TOKEN_SECRET,

    jwt: {
      secret: process.env.TOKEN_SECRET,
      encode: async (data: any) => {
        console.log(`encode on ${new Date().toLocaleTimeString()}`);
        const { secret, token, maxAge } = data;
        let claims: JWT = null;
        let encodedToken = '';

        if (token) {
          claims = {
            username: token.username,
          };
          encodedToken = jsonwebtoken.sign(claims, secret, {
            expiresIn: parseInt(process.env.TOKEN_REFRESH_PERIOD),
            algorithm: 'HS512',
          });
        } else {
          console.log('TOKEN EMPTY. SO, LOGOUT!...');
          return '';
        }

        return encodedToken;
      },
      async decode(data: any) {
        const { secret, token } = data;
        let verifiedJwt: any = null;

        try {
          verifiedJwt = jsonwebtoken.verify(token, secret) as JWT;
          console.log(`decode success on ${new Date().toLocaleTimeString()}`);
        } catch (error) {
          console.log(
            `decode failed on ${new Date().toLocaleTimeString()}, token refresh needed!`
          );
        } finally {
          console.log(`decode finally on ${new Date().toLocaleTimeString()}`, {
            verifiedJwt,
          });
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
        console.log(`jwt on ${new Date().toLocaleTimeString()}`);

        if (!token) {
          console.log(
            `token null, so will refresh in jwt cb on ${new Date().toLocaleTimeString()}`
          );

          let existingToken = await getTokenFromCookie({ req });
          let decodedOldToken = jsonwebtoken.decode(existingToken);

          token = await refreshToken(decodedOldToken as JWT);

          console.log(
            `tokren null in jwt cb on ${new Date().toLocaleTimeString()}`,
            { existingToken, decodedOldToken, newToken: token }
          );
        } else if (user) {
          console.log(
            `token updated with user in jwt cb on ${new Date().toLocaleTimeString()}`,
            { user, token }
          );
          token.username = user.username;
        }
        return token;
      },
      async session({ session, user, token }) {
        console.log(`session on ${new Date().toLocaleTimeString()}`);

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
            let dell = await createToken(username);
            return dell;
          } catch (error) {
            console.log(error);
            throw new Error('Authentication error');
          }
        },
      }),
    ],
    events: {
      async signOut({ session, token }) {
        await prisma.user.update({
          where: {
            username: token.username as string,
          },
          data: {
            refreshToken: null,
          },
        });
      },
    },
  };
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, nextAuthOptions(req, res));
};
