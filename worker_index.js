// worker/src/index.js
//
// يخدم ملفات الكتب (.zstd) من R2 bucket "alfbab" كبايتات خام،
// بدون أي Content-Encoding — فكّ الضغط يصير داخل تطبيق Flutter نفسه
// (عبر BookArchiveLoader) حتى يشتغل على كل المتصفحات بلا استثناء.
//
// الاستخدام: GET https://<your-worker-domain>/6.zstd

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1)); // "6.zstd"

    // طلبات preflight الخاصة بـ CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!key) {
      return new Response('Not found', { status: 404 });
    }

    const object = await env.ALFBAB_BUCKET.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers(corsHeaders());
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Length', object.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    if (request.method === 'HEAD') {
      return new Response(null, { headers });
    }

    return new Response(object.body, { headers });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}
