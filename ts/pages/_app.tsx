/**
 * pages/_app.tsx
 * The custom App component for Next.js.
 * Wraps all pages with global styles, fonts (Inter, Lato), 
 * Framer Motion animations for page transitions, and the custom cursor.
 */

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter, Lato } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import CustomCursor from "../components/Components/LP Comps/CustomCursor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lato = Lato({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsTransitioning(true);
    const handleComplete = () => {
      setIsTransitioning(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <div className={`${inter.variable} ${lato.variable}`}>
      <Head>
        <title>SathyaWhere | Lost and Found</title>
      </Head>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={router.route}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-screen"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
      <CustomCursor />
    </div>
  );
}
