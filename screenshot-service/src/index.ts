import express, { Request, Response } from "express";
import cors from "cors";
import puppeteer, { Browser } from "puppeteer";

const app = express();

// CORS - permitir apenas origem específica em produção
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Configuração do Puppeteer para Docker/Linux
const getPuppeteerConfig = () => ({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
  ],
  ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  }),
});

// Screenshot de HTML (rota principal)
app.post("/screenshot", async (req: Request, res: Response) => {
  const { html, width, height, mode, canvasData, background } = req.body;

  if (!html && mode !== "canvas") {
    return res.status(400).json({ error: "HTML content required" });
  }

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch(getPuppeteerConfig());
    const page = await browser.newPage();

    // Canvas Mode: Capturar composição completa com múltiplos frames
    if (mode === "canvas" && canvasData) {
      const { frames, background: canvasBg, width: canvasWidth, height: canvasHeight } = canvasData;

      const viewportWidth = canvasWidth || 1920;
      const viewportHeight = canvasHeight || 1080;

      // Build background filter CSS
      let bgFilterCss = "";
      let bgOpacity = 1;
      if (canvasBg?.filters) {
        const filters = [];
        if (canvasBg.filters.blur > 0) filters.push(`blur(${canvasBg.filters.blur}px)`);
        if (canvasBg.filters.hue !== 0) filters.push(`hue-rotate(${canvasBg.filters.hue}deg)`);
        if (canvasBg.filters.saturation !== 100) filters.push(`saturate(${canvasBg.filters.saturation}%)`);
        if (canvasBg.filters.brightness !== 100) filters.push(`brightness(${canvasBg.filters.brightness}%)`);
        bgFilterCss = filters.join(" ");
        if (canvasBg.filters.opacity !== undefined) {
          bgOpacity = canvasBg.filters.opacity / 100;
        }
      }

      // Renderizar cada frame individualmente
      const frameImages: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        dataUrl: string;
        cornerRadius: number;
        boxShadow: string;
        filter: string;
      }> = [];

      for (const frame of frames || []) {
        const { x, y, width: fw, height: fh, html: frameHtml, cornerRadius, boxShadow, filter } = frame;

        await page.setViewport({
          width: Math.ceil(fw),
          height: Math.ceil(fh),
          deviceScaleFactor: 2,
        });

        await page.setContent(frameHtml, {
          waitUntil: ["load", "networkidle0"],
          timeout: 30000,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const frameBuffer = await page.screenshot({
          type: "png",
          clip: {
            x: 0,
            y: 0,
            width: Math.ceil(fw),
            height: Math.ceil(fh),
          },
        });

        const frameBase64 = Buffer.from(frameBuffer).toString("base64");
        const frameDataUrl = `data:image/png;base64,${frameBase64}`;

        frameImages.push({
          x,
          y,
          width: fw,
          height: fh,
          dataUrl: frameDataUrl,
          cornerRadius: cornerRadius || 0,
          boxShadow: boxShadow || "none",
          filter: filter || "none",
        });
      }

      // Compor imagem final
      await page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: 2,
      });

      let framesHtml = "";
      for (const frame of frameImages) {
        framesHtml += `
          <div style="
            position: absolute;
            left: ${frame.x}px;
            top: ${frame.y}px;
            width: ${frame.width}px;
            height: ${frame.height}px;
            overflow: hidden;
            border-radius: ${frame.cornerRadius}px;
            box-shadow: ${frame.boxShadow};
            ${frame.filter !== "none" ? `filter: ${frame.filter};` : ""}
          ">
            <img src="${frame.dataUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        `;
      }

      const canvasHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${viewportWidth}px;
      height: ${viewportHeight}px;
      overflow: hidden;
    }
    .canvas-container {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: ${canvasBg?.color || "#0a0a0a"};
    }
    .bg-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      ${bgFilterCss ? `filter: ${bgFilterCss};` : ""}
      opacity: ${bgOpacity};
    }
  </style>
</head>
<body>
  <div class="canvas-container">
    ${canvasBg?.image ? `<img class="bg-image" src="${canvasBg.image}" alt="" />` : ""}
    ${framesHtml}
  </div>
</body>
</html>
      `;

      await page.setContent(canvasHtml, {
        waitUntil: ["load", "networkidle0"],
        timeout: 30000,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const screenshotBuffer = await page.screenshot({
        type: "jpeg",
        quality: 95,
      });

      await browser.close();

      const base64 = Buffer.from(screenshotBuffer).toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      return res.json({
        success: true,
        screenshot: dataUrl,
        size: { width: viewportWidth, height: viewportHeight }
      });
    }

    // Modo Normal: Capturar apenas o HTML
    await page.setViewport({
      width: width || 1200,
      height: height || 900,
      deviceScaleFactor: 1,
    });

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width || 1200}, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width || 1200}px;
      height: ${height || 900}px;
      overflow: hidden;
      background: #ffffff;
    }
  </style>
</head>
<body>
${html}
</body>
</html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: ["load", "networkidle0"],
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 90,
      clip: {
        x: 0,
        y: 0,
        width: width || 1200,
        height: height || 900,
      },
    });

    await browser.close();

    const base64 = Buffer.from(screenshotBuffer).toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return res.json({
      success: true,
      screenshot: dataUrl,
      size: {
        width: width || 1200,
        height: height || 900,
      }
    });

  } catch (error) {
    console.error("Screenshot error:", error);
    if (browser) await browser.close();
    return res.status(500).json({ error: "Failed to capture screenshot" });
  }
});

// Screenshot de iframes (Unicorn Studio, Spline, etc.)
app.post("/iframe", async (req: Request, res: Response) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "URLs array required" });
  }

  // Validar URLs permitidas
  const allowedDomains = [
    "unicorn.studio",
    "spline.design",
    "my.spline.design",
    "prod.spline.design",
  ];

  const validUrls = urls.filter((url: string) => {
    try {
      const parsed = new URL(url);
      return allowedDomains.some(domain => parsed.hostname.includes(domain));
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return res.status(400).json({ error: "No valid URLs provided" });
  }

  let browser: Browser | null = null;

  try {
    // Configuração especial para WebGL (Unicorn Studio, Spline)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--allow-running-insecure-content",
        "--enable-webgl",
        "--enable-webgl2",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-accelerated-2d-canvas",
        "--ignore-gpu-blocklist",
        "--enable-gpu-rasterization",
        "--enable-zero-copy",
        "--disable-software-rasterizer",
      ],
      ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      }),
    });

    const screenshots: Record<string, string> = {};

    for (const url of validUrls) {
      try {
        const page = await browser.newPage();

        await page.setViewport({
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2,
        });

        await page.goto(url, {
          waitUntil: ["load", "networkidle0"],
          timeout: 45000,
        });

        // Esperar WebGL/animações carregarem
        await new Promise(resolve => setTimeout(resolve, 5000));

        const screenshotBuffer = await page.screenshot({
          type: "png",
          omitBackground: false,
        });

        const base64 = Buffer.from(screenshotBuffer).toString("base64");
        screenshots[url] = `data:image/png;base64,${base64}`;

        await page.close();
      } catch (error) {
        console.error(`Failed to capture iframe: ${url}`, error);
        screenshots[url] = "";
      }
    }

    await browser.close();

    return res.json({
      success: true,
      screenshots,
    });

  } catch (error) {
    console.error("Iframe screenshot error:", error);
    if (browser) await browser.close();
    return res.status(500).json({ error: "Failed to capture iframe screenshots" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Screenshot service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
