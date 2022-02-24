import { getSession, useSession } from 'next-auth/react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getToken } from 'next-auth/jwt';

const Homepage = () => {
  const [token, setToken] = useState<string>('');

  const { data: session, status } = useSession();

  return (
    <Grid container direction="column" justifyContent="space-between">
      <Grid item>
        <>
          <Typography variant="h4">Home Page</Typography>
          <Typography variant="h6">tokennnn</Typography>
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
