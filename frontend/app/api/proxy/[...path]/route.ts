import { NextRequest, NextResponse } from "next/server"

// Forzar 127.0.0.1 en lugar de localhost para evitar problemas de resolución DNS
// En el servidor de Next.js, localhost puede no funcionar correctamente
let apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"
// Reemplazar localhost por 127.0.0.1 si está presente
apiBase = apiBase.replace(/localhost/g, "127.0.0.1")
const API_BASE = apiBase
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"
const API_URL = `${API_BASE}${API_PREFIX}`

function buildTargetUrl(segments: string[], search: string): string {
  const path = segments.length ? `/${segments.join("/")}` : ""
  return `${API_URL}${path}${search}`
}

async function forwardRequest(req: NextRequest, segments: string[]) {
  const targetUrl = buildTargetUrl(segments, req.nextUrl.search)
  console.log(`[Proxy] Forwarding ${req.method} ${targetUrl}`)

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.set("Connection", "keep-alive")

  // No usar AbortController aquí, puede causar problemas de conexión
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const arrayBuffer = await req.arrayBuffer()
    init.body = arrayBuffer
  }

  try {
    console.log(`[Proxy] Intentando conectar a: ${targetUrl}`)
    const upstreamResponse = await fetch(targetUrl, init)
    
    console.log(`[Proxy] Respuesta recibida: ${upstreamResponse.status}`)
    
    const responseHeaders = new Headers(upstreamResponse.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    responseHeaders.set("Access-Control-Allow-Headers", "*")

    const body = await upstreamResponse.text()
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`[Proxy] Error for ${targetUrl}:`, errorMessage, errorStack)
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Error al conectar con el backend",
        message: errorMessage,
        targetUrl: targetUrl,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined
      }),
      {
        status: 502,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    )
  }
}

export const dynamic = "force-dynamic"
export const fetchCache = "default-no-store"

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forwardRequest(req, path ?? [])
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forwardRequest(req, path ?? [])
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forwardRequest(req, path ?? [])
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forwardRequest(req, path ?? [])
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forwardRequest(req, path ?? [])
}


