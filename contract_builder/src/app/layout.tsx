import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {ChakraProvider} from "@chakra-ui/react";
import "./globals.css";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Sea Saba Contract Builder",
  description: "App to assemble dive group contracts",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={inter.className}>
    <ChakraProvider>
      {children}
    </ChakraProvider>
    </body>
    </html>
  );
}
