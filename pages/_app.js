// pages/_app.js
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
       <link rel="icon" type="image/svg+xml"
    href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%236f6ce8"/><rect x="18" y="18" width="28" height="28" rx="6" fill="%23ffffff"/></svg>' />
        {}
       <link rel="icon" type="image/svg+xml"
    href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%236f6ce8"/><rect x="18" y="18" width="28" height="28" rx="6" fill="%23ffffff"/></svg>' />
      </Head>
      <Component {...pageProps} />
    </>
  );
}