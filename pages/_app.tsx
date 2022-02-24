import { CacheProvider, EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import Layout from 'components/layout';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import createEmotionCache from 'styles/createEmotionCache';
import 'styles/global.css';
import theme from 'styles/theme';

const clientSideEmotionCache = createEmotionCache();

const landingPages = ['/landing', '/login'];

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

function MyApp({
  router,
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: MyAppProps) {
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>MUI5 Nextjs</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <SessionProvider session={pageProps.session}>
          {landingPages.includes(router.pathname) && (
            <Component {...pageProps} />
          )}

          {!landingPages.includes(router.pathname) && (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </SessionProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;
