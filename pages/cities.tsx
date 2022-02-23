import { NormalizedCache } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import MyAlert from 'components/alert';
import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/client';
import { getToken } from 'next-auth/jwt';
import React, { FC, useEffect } from 'react';
import { initializeApollo } from 'src/apollo';
import { alertMessageVar } from 'src/cache';
import { Queries } from 'src/gql_definitions/queries';
import {
  CitiesQuery,
  useCitiesQuery,
  useRemoveCityMutation,
} from 'src/graphql/types';

type CitiesType = {
  initialApolloState: NormalizedCache;
  alertMessage: string;
  session: Session;
};

const Cities: FC<CitiesType> = (props) => {
  const { session } = props;

  return (
    <>
      <h1>Cities</h1>
    </>
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
    props: {},
  };
}

export default Cities;
