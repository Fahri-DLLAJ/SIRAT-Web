import { NextRequest } from "next/server";
import net from "net";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/camera/stream?ip=192.168.1.200&port=81
 *
 * Proxies the ESP32-CAM MJPEG stream using a raw TCP socket.
 *
 * Why raw socket instead of http.request or fetch?
 *  - fetch() in Next.js: buffers the entire response → MJPEG never renders
 *  - http.request(): parses Transfer-Encoding:chunked internally and may
 *    buffer small chunks before emitting 'data' → stream stalls
 *  - net.Socket: forwards every raw byte immediately → true real-time MJPEG
 *
 * We send a minimal HTTP/1.0 request (no chunked-TE negotiation) and pipe
 * the raw TCP bytes straight to the browser ReadableStream.
 */
export async function GET(req: NextRequest) {
  const ip   = req.nextUrl.searchParams.get("ip")   ?? "192.168.1.200";
  const port = parseInt(req.nextUrl.searchParams.get("port") ?? "81", 10);

  return new Promise<Response>((resolve) => {
    let resolved = false;
    let headerDone = false;
    let statusOk   = true;

    const socket = new net.Socket();

    // Collect raw HTTP response header to extract Content-Type
    let headerBuf = Buffer.alloc(0);
    let contentType = "multipart/x-mixed-replace; boundary=123456789000000000000987654321";

    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
      },
      cancel() {
        socket.destroy();
      },
    });

    socket.connect(port, ip, () => {
      // Use HTTP/1.0 to avoid chunked transfer-encoding from the ESP32
      socket.write(
        `GET /stream HTTP/1.0\r\nHost: ${ip}\r\nConnection: close\r\n\r\n`
      );
    });

    socket.on("data", (chunk: Buffer) => {
      if (!headerDone) {
        // Accumulate until we find the end of HTTP headers (\r\n\r\n)
        headerBuf = Buffer.concat([headerBuf, chunk]);
        const sep = headerBuf.indexOf("\r\n\r\n");
        if (sep === -1) return; // header not complete yet

        const rawHeader = headerBuf.slice(0, sep).toString("ascii");
        const bodyStart = headerBuf.slice(sep + 4);
        headerDone = true;

        // Parse status line
        const statusLine = rawHeader.split("\r\n")[0];
        const statusCode = parseInt(statusLine.split(" ")[1] ?? "0", 10);
        if (statusCode >= 400) {
          statusOk = false;
          socket.destroy();
          if (!resolved) {
            resolved = true;
            resolve(new Response("Stream unavailable", { status: 502 }));
          }
          return;
        }

        // Extract Content-Type from headers
        const ctMatch = rawHeader.match(/^content-type:\s*(.+)$/im);
        if (ctMatch) contentType = ctMatch[1].trim();

        // Resolve the Response now — subsequent data events feed the stream
        if (!resolved) {
          resolved = true;
          resolve(
            new Response(stream, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Access-Control-Allow-Origin": "*",
                "X-Accel-Buffering": "no",
              },
            })
          );
        }

        // Forward the body bytes that arrived together with the header
        if (bodyStart.length > 0 && streamController) {
          try { streamController.enqueue(bodyStart); } catch { /* closed */ }
        }
        return;
      }

      // Header already parsed — forward body bytes immediately
      if (statusOk && streamController) {
        try { streamController.enqueue(chunk); } catch { /* closed */ }
      }
    });

    socket.on("close", () => {
      if (streamController) {
        try { streamController.close(); } catch { /* already closed */ }
      }
    });

    socket.on("error", () => {
      if (!resolved) {
        resolved = true;
        resolve(new Response("ESP32-CAM unreachable", { status: 503 }));
      }
      if (streamController) {
        try { streamController.close(); } catch { /* already closed */ }
      }
    });

    // 5-second timeout for initial TCP + HTTP response headers only
    socket.setTimeout(5000, () => {
      if (!headerDone) {
        socket.destroy();
        if (!resolved) {
          resolved = true;
          resolve(new Response("ESP32-CAM timeout", { status: 503 }));
        }
      } else {
        // Stream is alive — clear the timeout
        socket.setTimeout(0);
      }
    });

    // Clean up when the browser disconnects
    req.signal.addEventListener("abort", () => {
      socket.destroy();
    });
  });
}
