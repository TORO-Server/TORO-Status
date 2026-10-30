# TORO Status

[![Monitor](https://github.com/TORO-Server/upptime/actions/workflows/monitor.yml/badge.svg)](https://github.com/TORO-Server/upptime/actions/workflows/monitor.yml)

TORO サーバーの稼働状況ページです。**https://status.torosaba.net**

## スマホ・PWA

- スマホ表示に対応しています（320〜430px 幅、safe-area 対応）。
- PWA としてホーム画面に追加できます（Android: メニュー →「アプリをインストール」、iPhone: 共有 →「ホーム画面に追加」）。
- Service Worker（`frontend/service-worker/sw.ts`、`@vite-pwa/nuxt` の injectManifest でビルド）:
  - ページと稼働データ（`/data/*.json`）は**ネットワーク優先**。オンラインなら常に最新を表示し、オフライン時だけ最後に取得した状態（最終更新時刻つき）を表示します。
  - ハッシュ付きアセットとアイコンはプリキャッシュ。別オリジンのリクエストはキャッシュしません。
  - 新しいバージョンは自動で有効になり、ページも自動で再読み込みされます。
- アイコンは `frontend/public/` の `pwa-192x192.png` / `pwa-512x512.png` / `maskable-icon-512x512.png` / `apple-touch-icon-180x180.png`（ファビコンの SVG から作成）。
