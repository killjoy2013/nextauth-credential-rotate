import Grid from '@mui/material/Grid';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { getSession } from 'next-auth/react';
import React from 'react';
import { authOptions } from './api/auth/[...nextauth]';

const Homepage = () => {
  return (
    <Grid container direction="column" justifyContent="space-between">
      <Grid item>
        <>
          <h1>Home Page</h1>
        </>
      </Grid>
    </Grid>
  );
};

export async function getServerSideProps(ctx) {
  //const session = await getSession(ctx);

  const { req } = ctx;

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

  console.log(`index ssr token on ${new Date().toLocaleTimeString()}`, {
    token,
  });

  return {
    props: {
      session,
      token,
    },
  };
}
export default Homepage;
