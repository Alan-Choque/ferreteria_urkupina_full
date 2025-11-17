import { NextRequest, NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"
const API_URL = `${API_BASE}${API_PREFIX}`

function buildTargetUrl(segments: string[], search: string): string {
  const path = segments.length ? `/${segments.join("/")}` : ""
  return `${API_URL}${path}${search}`
}

async function forwardRequest(req: NextRequest, segments: string[]) {
  const targetUrl = buildTargetUrl(segments, req.nextUrl.search)

  const headers = new Headers(req.headers)
  headers.delete("host")

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const arrayBuffer = await req.arrayBuffer()
    init.body = arrayBuffer
  }

  const upstreamResponse = await fetch(targetUrl, init)
  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.delete("content-encoding")

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
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


