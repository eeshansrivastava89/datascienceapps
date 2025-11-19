// Cloudflare Worker for PostHog Reverse Proxy
// Official implementation from https://posthog.com/docs/advanced/proxy/cloudflare

const API_HOST = "us.i.posthog.com"
const ASSET_HOST = "us-assets.i.posthog.com"

async function handleRequest(request, ctx) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const pathWithParams = pathname + search

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  if (pathname.startsWith("/static/")) {
    return retrieveStatic(request, pathWithParams, ctx)
  } else {
    return forwardRequest(request, pathWithParams)
  }
}

async function retrieveStatic(request, pathname, ctx) {
  let response = await caches.default.match(request)
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`)
    // Clone and add CORS headers
    response = new Response(response.body, response)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}

async function forwardRequest(request, pathWithSearch) {
  const originRequest = new Request(request)
  originRequest.headers.delete("cookie")
  const response = await fetch(`https://${API_HOST}${pathWithSearch}`, originRequest)
  // Add CORS headers to forwarded requests
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return newResponse
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  }
};

