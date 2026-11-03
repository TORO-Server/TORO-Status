// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  ssr: true,

  modules: ["@vite-pwa/nuxt"],

  nitro: {
    preset: "static",
  },

  app: {
    baseURL: "/",
    head: {
      htmlAttrs: { lang: "ja" },
      charset: "utf-8",
      // viewport-fit=cover でノッチ端末の safe-area を CSS 側で扱う（拡大縮小は禁止しない）
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      title: "TORO STATUS // 稼働状況モニター",
      meta: [
        { name: "theme-color", content: "#02030a" },
        {
          name: "description",
          content:
            "TORO サーバーの稼働状況をリアルタイムに監視・公開する公式ステータスページ",
        },
        { name: "apple-mobile-web-app-title", content: "TORO Status" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      ],
      link: [
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon-180x180.png" },
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
      ],
    },
  },

  css: ["~/assets/styles.css"],

  vite: {
    build: {
      modulePreload: false,
    },
  },

  hooks: {
    // @vite-pwa/nuxt が SSG 時に自動で足す _payload.json / builds の glob を外す（上の方針どおり）
    "pwa:beforeBuildServiceWorker"(options) {
      const im = options.injectManifest;
      im.globPatterns = (im.globPatterns ?? []).filter(
        (p) => !p.includes("_payload.json") && !p.includes("builds/")
      );
    },
  },

  // PWA: マニフェスト + TypeScript 製 Service Worker（service-worker/sw.ts）
  pwa: {
    strategies: "injectManifest",
    srcDir: "service-worker",
    filename: "sw.ts",
    registerType: "autoUpdate",
    injectManifest: {
      // ハッシュ付きアセットとアイコンだけをプリキャッシュする。
      // HTML・稼働データ・_payload.json・ビルドメタはデプロイ毎に変わるので除外し、
      // SW 側でネットワーク優先にする（データ更新のたびに SW が更新されるのを防ぐ）。
      globPatterns: ["_nuxt/**/*.{js,css}", "*.png", "*.svg"],
      globIgnores: ["**/_payload.json", "_nuxt/builds/**", "**/*.html", "data/**"],
      // モジュール既定の変換は _nuxt/builds/latest.json（毎ビルド変化）を足すので差し替える
      manifestTransforms: [
        async (entries) => {
          const seen = new Set<string>();
          const manifest = entries.filter((e) => {
            const keep =
              /^_nuxt\/(?!builds\/).+\.(?:js|css)$/.test(e.url) ||
              /^[^/]+\.(?:png|svg)$/.test(e.url) ||
              e.url === "manifest.webmanifest";
            if (!keep || seen.has(e.url)) return false;
            seen.add(e.url);
            return true;
          });
          return { manifest, warnings: [] };
        },
      ],
    },
    manifest: {
      id: "/",
      lang: "ja",
      name: "TORO Status",
      short_name: "TORO Status",
      description: "TORO サーバーの稼働状況をリアルタイムに監視・公開する公式ステータスページ",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#02030a",
      background_color: "#02030a",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    client: {
      // 開きっぱなしの PWA でも 1 時間ごとに新しい SW を確認する
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
    },
  },
})
