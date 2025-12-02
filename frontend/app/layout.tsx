import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/lib/contexts/cart-context"
import { WishlistProvider } from "@/lib/contexts/wishlist-context"
import { ToastProvider } from "@/lib/contexts/toast-context"
import { ToastContainer } from "@/components/toast-container"
import LayoutWrapper from "@/components/layout-wrapper"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ferretería Urkupina",
  description: "Tu ferretería de confianza en Guayaramerin",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
              <ToastContainer />
              <Analytics />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
