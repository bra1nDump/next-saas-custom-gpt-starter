import { Inter as FontSans, Urbanist } from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontUrban = Urbanist({
  subsets: ["latin"],
  variable: "--font-urban",
});
