import { NextRequest, NextResponse } from 'next/server';
import { ProxyConfig } from '../../../lib/api/types';

// Proxy configurations for different API endpoints
const PROXY_CONFIGS: Record<string, ProxyConfig> = {
  // Example external APIs (ready for future use)
  users: {
    target: process.env.USER_API_URL || 'https://jsonplaceholder.typicode.com/users',
    timeout: 10000,
  },
  products: {
    target: process.env.PRODUCT_API_URL || 'https://dummyjson.com/products',
    timeout: 10000,
  },
};

// Cache for responses
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const config = PROXY_CONFIGS[path];

  if (!config) {
    return NextResponse.json({ error: `API endpoint '${path}' not configured` }, { status: 404 });
  }

  try {
    // Build target URL
    const url = new URL(request.url);
    const targetUrl = `${config.target}${url.search}`;

    // Prepare headers
    const headers = new Headers();

    // Copy relevant headers from the original request
    const allowedHeaders = ['content-type', 'accept', 'user-agent', 'cache-control'];

    allowedHeaders.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // Add proxy-specific headers
    Object.entries(config.headers || {}).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    // Prepare request body
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }

    // Check cache for GET requests
    if (method === 'GET' && process.env.ENABLE_CACHE === 'true') {
      const cacheKey = `${path}:${url.search}`;
      const cached = responseCache.get(cacheKey);
      const cacheTTL = parseInt(process.env.CACHE_DURATION || '300000', 10); // 5 minutes default

      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
    }

    // Make the proxy request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle response
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.arrayBuffer();
    }

    // Cache successful GET responses
    if (method === 'GET' && response.ok && process.env.ENABLE_CACHE === 'true') {
      const cacheKey = `${path}:${url.search}`;
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: parseInt(process.env.CACHE_DURATION || '300000', 10),
      });
    }

    // Return response
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType || 'application/json',
      'X-Proxy-Cache': method === 'GET' ? 'MISS' : 'N/A',
    };

    if (method === 'GET') {
      responseHeaders['Cache-Control'] = 'public, max-age=300';
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle all HTTP methods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'PATCH');
}
