import DisplayObject from 'components/jsonviewer';
import { getServerSession, Session } from 'next-auth';
import { getToken, JWT, JWTDecodeParams } from 'next-auth/jwt';
import { getSession } from 'next-auth/react';
import jsonwebtoken from 'jsonwebtoken';
import React, { FC } from 'react';
import { authOptions, myProvider } from './api/auth/[...nextauth]';

type CitiesType = {
  session: Session;
  token: string;
};

const Cities: FC<CitiesType> = (props) => {
  const { session, token } = props;

  return (
    <>
      <h1>Cities</h1>
      {/* <DisplayObject {...session}></DisplayObject>
      <h3>{token}</h3> */}
    </>
  );
};

export async function getServerSideProps(ctx) {
  const { req } = ctx;
  //const session = await getSession(ctx);

  const session = await getServerSession(ctx, authOptions);

  // console.log({ session });

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permenant: false,
      },
    };
  }

  const token = await getToken({
    req,
    secret: process.env.TOKEN_SECRET,
    raw: true,
  });

  console.log(`city ssr token on ${new Date().toLocaleTimeString()}`, {
    token,
  });

  return {
    props: {
      session,
      token,
    },
  };
}

export default Cities;
