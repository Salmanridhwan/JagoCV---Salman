import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// ── Proxy backend PHP (Apache/XAMPP, termasuk manager-osx di macOS) ──
// Semua request /backend/*.php dari Vite dev server diteruskan ke Apache
// yang dideteksi OTOMATIS: coba port 8080 lalu 80, dan folder project di
// dalam htdocs (/jagoCV---Salman/backend) atau langsung /backend.
// Deteksi dilakukan sekali lewat ping.php, dan diulang bila Apache restart.
const PROJECT_SLUG = '/jagoCV---Salman';

function requestStatus(url: string, timeoutMs = 1200): Promise<number | null> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Base yang disimpan TIDAK memuat '/backend' (cukup origin + slug project),
// karena req.url dari middleware sudah diawali '/backend/*'.
// Jika tidak ada slug, berarti project langsung di root htdocs.
async function detectApacheBase(): Promise<string | null> {
  for (const port of [8080, 80]) {
    for (const candidate of [`http://127.0.0.1:${port}${PROJECT_SLUG}`, `http://127.0.0.1:${port}`]) {
      const url = `${candidate}/backend/ping.php`;
      const status = await requestStatus(url);
      // Hanya terima base yang benar-benar menjawab 200 (bukan 404 dsb.),
      // supaya prefix/folder yang salah tidak ikut terpilih lalu di-cache.
      if (status === 200) return candidate;
    }
  }
  return null;
}

function apacheProxyPlugin() {
  let base: string | null = null;
  let probing: Promise<string | null> | null = null;

  const ensureBase = (): Promise<string | null> => {
    if (base) return Promise.resolve(base);
    if (!probing) {
      probing = detectApacheBase().then((found) => {
        base = found;
        probing = null;
        if (found) {
          console.log(`[jagoCV] Backend PHP diteruskan ke: ${found}`);
        } else {
          console.warn(
            '[jagoCV] Backend PHP (Apache) tidak terdeteksi di port 80/8080. ' +
              'Pastikan Apache menyala dan project ada di htdocs.',
          );
        }
        return found;
      });
    }
    return probing;
  };

  const jsonFail = (res: ServerResponse, message: string): void => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, message }));
  };

  const forward = (req: IncomingMessage, res: ServerResponse): void => {
    if (!base) {
      jsonFail(res, 'Backend PHP belum terdeteksi.');
      return;
    }
    const targetUrl = `${base}${req.url ?? ''}`;
    const upstream = http.request(
      targetUrl,
      {
        method: req.method,
        headers: { ...req.headers, host: new URL(targetUrl).host },
      },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on('error', () => {
      // Apache mungkin baru saja mati/restart → deteksi ulang di request berikutnya.
      base = null;
      jsonFail(
        res,
        'Koneksi ke Apache (backend PHP) terputus. Pastikan Apache & MySQL menyala lalu coba lagi.',
      );
    });
    req.pipe(upstream);
  };

  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void => {
    const url = req.url ?? '';
    if (!url.startsWith('/backend/')) {
      next();
      return;
    }
    ensureBase().then((found) => {
      if (!found) {
        jsonFail(
          res,
          'Backend PHP (Apache/XAMPP) tidak terjangkau di port 80 maupun 8080. ' +
            'Pastikan Apache menyala di manager-osx dan folder project berada di htdocs.',
        );
        return;
      }
      forward(req, res);
    });
  };

  return {
    name: 'jagocv-apache-proxy',
    configureServer(server: any) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apacheProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          // Halaman simulasi payment gateway (dibuka checkout.php)
          paymentGateway: 'src/html/payment-gateway.html',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
