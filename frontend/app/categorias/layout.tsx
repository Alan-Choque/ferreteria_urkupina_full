"use client"

import type React from "react"
import Header from "@/components/header"
import FooterFerretek from "@/components/footer-ferretek"

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <FooterFerretek />
    </>
  )
}
