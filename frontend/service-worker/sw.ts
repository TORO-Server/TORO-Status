/// <reference lib="webworker" />
// TORO Status の Service Worker（@vite-pwa/nuxt の injectManifest でビルド時にバンドル）。
//
// - ハッシュ付きアセット（/_nuxt/*.js, *.css）とアイコン → プリキャッシュ（キャッシュ優先）
// - ページ遷移と稼働データ（/data/*.json など）→ ネットワーク優先。
//   オフライン時だけ最後に取得したコピーを返すので、最終更新時刻つきの直近の状態が見られる。
// - 別オリジンのリクエストには一切触れない（キャッシュしない）。
// - 新しい SW は待機せず即座に有効化し、ページ側（autoUpdate）が自動で再読み込みする。
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import type { WorkboxPlugin } from "workbox-core/types";

declare let self: ServiceWorkerGlobalScope;

const PAGES = "toro-pages";
const DATA = "toro-data";
const ASSETS = "toro-assets";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const sameOrigin = (url: URL): boolean => url.origin === self.location.origin;

// クエリ（キャッシュバスターの ?_=… や utm など）を無視して 1 URL 1 エントリにする
const stripSearch: WorkboxPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const url = new URL(request.url);
    url.search = "";
    return url.href;
  },
};

// 正常なレスポンスだけ保存する（404 ページなどで最後の状態を上書きしない）
const okOnly: WorkboxPlugin = {
  cacheWillUpdate: async ({ response }) => (response.ok ? response : null),
};

// ネットワーク優先でキャッシュから返したとき（＝取得失敗時）だけ目印のヘッダーを付ける。
// ページ側はこれを見て「最後に取得したデータを表示中」と案内する。
const markFallback: WorkboxPlugin = {
  cachedResponseWillBeUsed: async ({ cachedResponse }) => {
    if (!cachedResponse) return cachedResponse;
    const headers = new Headers(cachedResponse.headers);
    headers.set("x-toro-cache", "fallback");
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers,
    });
  },
};

// 未訪問のページにオフラインで来たときはトップページのコピーを返す
const pageFallback: WorkboxPlugin = {
  handlerDidError: async () => {
    const cache = await caches.open(PAGES);
    return (await cache.match(new URL("/", self.location.origin).href)) ?? undefined;
  },
};

registerRoute(
  ({ request, url }) => request.mode === "navigate" && sameOrigin(url),
  new NetworkFirst({ cacheName: PAGES, plugins: [stripSearch, okOnly, pageFallback] })
);

registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    sameOrigin(url) &&
    !url.pathname.startsWith("/_nuxt/builds/") && // ビルド毎に名前が変わるので溜めない
    (url.pathname.startsWith("/data/") || url.pathname.endsWith(".json")),
  new NetworkFirst({ cacheName: DATA, plugins: [stripSearch, okOnly, markFallback] })
);

// プリキャッシュ漏れのハッシュ付きアセット（ファイル名が変われば別物なのでキャッシュ優先で安全）
registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    sameOrigin(url) &&
    url.pathname.startsWith("/_nuxt/") &&
    !url.pathname.startsWith("/_nuxt/builds/"),
  new CacheFirst({ cacheName: ASSETS, plugins: [okOnly] })
);

// インストール／更新時にトップページと最新データを先読みしておく。
// 初回訪問のページ読み込みは SW を通らないため、これが無いと 2 回目の訪問まで
// オフライン表示できない。更新時は新しいアセットを参照する HTML に差し替える意味もある。
async function warm(): Promise<void> {
  const targets: [string, string][] = [
    [PAGES, "/"],
    [DATA, "/data/summary.json"],
  ];
  await Promise.all(
    targets.map(async ([cacheName, path]) => {
      try {
        const res = await fetch(path, { cache: "no-cache" });
        if (res.ok) await (await caches.open(cacheName)).put(new URL(path, self.location.origin).href, res);
      } catch {
        // オフラインなどで取れなければ次の機会に
      }
    })
  );
}

self.addEventListener("install", (event) => event.waitUntil(warm()));
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      await warm();
      // 古いバージョンが使っていたアセットキャッシュは掃除する
      await caches.delete(ASSETS);
    })()
  )
);
