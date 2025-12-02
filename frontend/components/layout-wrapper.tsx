"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/header"
import FooterFerretek from "@/components/footer-ferretek"
import PageTransition from "@/components/page-transition"

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  return (
    <>
      {!isAdminRoute && <Header />}
      <PageTransition>
        {children}
      </PageTransition>
      {!isAdminRoute && <FooterFerretek />}
    </>
  )
}

