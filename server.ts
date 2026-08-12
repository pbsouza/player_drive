import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Video Streaming Proxy for Google Drive files
  // Forwards Range requests and auth tokens to Google Drive API so HTML5 <video> can seek smoothly on Smart TV
  app.get("/api/stream/:fileId", async (req, res) => {
    const { fileId } = req.params;
    let token = (req.query.token as string) || "";
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace(/^Bearer\s+/i, "");
    }

    if (!token) {
      res.status(401).send("Authorization token required");
      return;
    }

    const requestedMime = (req.query.mimeType as string) || "";
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true&acknowledgeAbuse=true`;

    const controller = new AbortController();
    req.on("close", () => {
      controller.abort();
    });

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Forward HTTP Range header for video seeking
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    try {
      // Use manual redirect handling so fetch doesn't strip Authorization header across cross-origin redirects
      let driveRes = await fetch(driveUrl, {
        headers,
        redirect: "manual",
        signal: controller.signal,
      });

      if ([301, 302, 303, 307, 308].includes(driveRes.status)) {
        const redirectUrl = driveRes.headers.get("location");
        if (redirectUrl) {
          const redirectHeaders: Record<string, string> = {};
          if (req.headers.range) {
            redirectHeaders["Range"] = req.headers.range;
          }
          // Note: Do NOT send Authorization header to googleusercontent.com CDN servers because
          // googleusercontent.com signed download URLs reject requests with Authorization headers (400 Bad Request)
          driveRes = await fetch(redirectUrl, {
            headers: redirectHeaders,
            redirect: "follow",
            signal: controller.signal,
          });
        }
      }

      if (!driveRes.ok && driveRes.status !== 206) {
        const errorText = await driveRes.text();
        if (driveRes.status === 401 || driveRes.status === 403) {
          console.warn(`Google Drive API auth status (${driveRes.status}): Token expired or unauthorized.`);
        } else {
          console.error(`Google Drive API error (${driveRes.status}):`, errorText);
        }
        if (!res.headersSent) res.status(driveRes.status).send(errorText);
        return;
      }

      res.status(driveRes.status);

      let contentType = driveRes.headers.get("content-type") || "";
      if (
        !contentType ||
        contentType === "application/octet-stream" ||
        contentType.includes("text/plain") ||
        contentType.includes("application/json")
      ) {
        if (requestedMime && requestedMime.startsWith("video/")) {
          contentType = requestedMime;
        } else {
          contentType = "video/mp4";
        }
      }

      const contentLength = driveRes.headers.get("content-length");
      const contentRange = driveRes.headers.get("content-range");
      const acceptRanges = driveRes.headers.get("accept-ranges") || "bytes";

      res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
      res.setHeader("Cache-Control", "no-cache, no-transform");

      if (driveRes.body) {
        const reader = driveRes.body.getReader();
        while (true) {
          if (controller.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise((resolve) => {
              const onDrain = () => {
                cleanup();
                resolve(null);
              };
              const onClose = () => {
                cleanup();
                resolve(null);
              };
              const cleanup = () => {
                res.off("drain", onDrain);
                res.off("close", onClose);
              };
              res.once("drain", onDrain);
              res.once("close", onClose);
            });
          }
        }
        if (!res.writableEnded) res.end();
      } else {
        res.end();
      }
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        // Client aborted/seeked - normal behavior
        return;
      }
      console.error("Error proxying video stream:", err);
      if (!res.headersSent) {
        res.status(500).send("Error streaming video file from Google Drive");
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Drive TV Player server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
