import Grid from '@mui/material/Grid';
import { getToken } from 'next-auth/jwt';
import { getSession } from 'next-auth/react';
import React from 'react';

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

export async function getServerSideProps({ req }: { req: any }) {
  const session = await getSession({ req });

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

  return {
    props: {
      session,
      token,
    },
  };
}
export default Homepage;
