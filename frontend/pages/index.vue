<script setup lang="ts">
import type { Summary, Status } from "~/types";

// ビルド時: サーバーAPIが public/data/summary.json を読み込んでHTMLに埋め込む
// JS有効時: 表示直後・画面に戻ったとき・オンライン復帰時、および60秒ごとに
// 静的ファイルを直接フェッチして更新（SW はネットワーク優先、オフライン時のみ前回のコピー）
const { data, pending, error: fetchError } = useAsyncData<Summary>(
  "summary",
  () => $fetch("/api/summary")
);

const offline = ref(false);

async function clientRefresh(): Promise<void> {
  try {
    const res = await $fetch.raw<Summary>(`/data/summary.json?_=${Date.now()}`, {
      cache: "no-store",
    });
    if (res._data) data.value = res._data;
    // SW がキャッシュのコピーで応答した＝ネットワークから取れなかった
    offline.value = res.headers.get("x-toro-cache") === "fallback";
  } catch {
    // エラー時は既存データを維持
    offline.value = true;
  }
}

function onVisible(): void {
  if (document.visibilityState === "visible") void clientRefresh();
}
function onConnectivity(): void {
  void clientRefresh();
}

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  void clientRefresh();
  timer = setInterval(() => void clientRefresh(), 60000);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onConnectivity);
  window.addEventListener("offline", onConnectivity);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("online", onConnectivity);
  window.removeEventListener("offline", onConnectivity);
});

const github = computed(
  () => data.value?.github ?? "https://github.com/TORO-Server/upptime"
);

const navItems = computed(() => [
  { label: t.nav.items.top, href: "#top" },
  { label: t.nav.items.status, href: "#status" },
  { label: t.nav.items.about, href: "#about" },
  { label: t.nav.items.services, href: "#services" },
  { label: t.nav.items.links, href: "#links" },
  { label: t.nav.items.source, href: github.value, external: true },
]);

const overall = computed<{ key: Status; text: string }>(() => {
  const sites = data.value?.sites ?? [];
  if (sites.length === 0) return { key: "up", text: "—" };
  const down = sites.filter((s) => s.status === "down").length;
  const degraded = sites.filter((s) => s.status === "degraded").length;
  if (down === sites.length) return { key: "down", text: t.overall.allDown };
  if (down > 0) return { key: "down", text: t.overall.someDown };
  if (degraded > 0) return { key: "degraded", text: t.overall.degraded };
  return { key: "up", text: t.overall.allUp };
});

const updatedAt = computed(() =>
  data.value?.generatedAt ? fmtDateTimeJp(data.value.generatedAt) : ""
);
const updatedDate = computed(() =>
  data.value?.generatedAt ? fmtDateJp(data.value.generatedAt) : ""
);
const thisYear = computed(() =>
  data.value?.generatedAt
    ? new Date(data.value.generatedAt).getFullYear()
    : new Date().getFullYear()
);

useHead({
  title: computed(() =>
    data.value?.name
      ? `${data.value.name} ${t.site.titleSuffix}`
      : t.site.titleDefault
  ),
});
</script>

<template>
  <div class="page">
    <div class="frame">
      <!-- ===== 見出し ===== -->
      <header id="top" class="masthead">
        <h1 class="rainbow glow">{{ data?.name || "TORO Status" }}</h1>
        <p class="subtitle">{{ data?.intro?.title || t.page.defaultSubtitle }}</p>
        <p class="intro">
          {{ data?.intro?.message || t.page.defaultIntro }}
        </p>
        <p v-if="updatedAt" class="updated">{{ t.page.lastUpdated }}{{ updatedAt }}</p>
        <p v-if="offline" class="offline" role="status">{{ t.page.offline }}</p>
      </header>

      <Marquee :text="t.marquee" />

      <div v-if="pending" class="state">{{ t.page.loading }}</div>
      <div v-else-if="fetchError" class="state error">
        {{ t.page.fetchErrorLine1 }}<br />
        {{ t.page.fetchErrorLine2 }}
      </div>

      <div v-else class="cols">
        <!-- ===== 左メニュー ===== -->
        <aside class="col-nav">
          <RetroNav :items="navItems" :last-update="updatedDate" />
        </aside>

        <!-- ===== 本文 ===== -->
        <main class="col-body">
          <!-- 現在の稼働状況 -->
          <section id="status" class="sec">
            <h2 class="jp-head">{{ t.section.status }}</h2>
            <div class="banner" :class="overall.key">
              <span class="banner-dot" />{{ overall.text }}
            </div>
            <div class="panel">
              <StatusBar
                :sites="data?.sites ?? []"
                :generated-at="data?.generatedAt ?? null"
              />
            </div>
          </section>

          <RetroDivider variant="wave" />

          <!-- このサイトについて -->
          <section id="about" class="sec">
            <h2 class="jp-head">{{ t.section.about }}</h2>
            <div class="panel"><AboutBox /></div>
          </section>

          <RetroDivider variant="double" />

          <!-- サービス一覧 -->
          <section id="services" class="sec">
            <h2 class="jp-head">{{ t.section.services }}</h2>
            <div class="grid">
              <SiteCard v-for="s in data?.sites" :key="s.slug" :site="s" />
            </div>
          </section>

          <RetroDivider variant="wave" />
          <!-- 関連リンク -->
          <section id="links" class="sec">
            <h2 class="jp-head">{{ t.section.links }}</h2>
            <div class="panel"><LinksSection :github="github" /></div>
          </section>
        </main>
      </div>

      <!-- ===== フッター ===== -->
      <footer class="foot">
        <div class="foot__rule">──────────────────────────</div>
        <p>{{ t.page.footerDesc }}</p>
        <p class="foot__sub">
          {{ t.page.since }}<span v-if="updatedAt">{{ t.page.lastUpdatedShort }}{{ updatedAt }}</span><br />
          {{ t.page.powered }}
        </p>
        <p class="foot__tech">© {{ thisYear }} TORO Server. All rights reserved.</p>
        <div class="foot__rule">──────────────────────────</div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ---- masthead (index 固有) ---- */
.masthead {
  scroll-margin-top: 12px;
}
.intro {
  margin: 0 auto 6px;
  max-width: 760px;
  color: var(--ink);
  font-size: 0.92rem;
  line-height: 1.8;
}
.updated {
  margin: 0;
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--ink-soft);
}
.offline {
  display: inline-block;
  margin: 6px 0 0;
  padding: 2px 10px;
  font-family: var(--mono);
  font-size: 0.78rem;
  font-weight: bold;
  color: var(--degraded);
  background: #fff7e0;
  border: 1px solid var(--degraded);
}

/* ---- columns ---- */
.cols {
  display: grid;
  grid-template-columns: 184px 1fr;
  gap: 14px;
  padding-top: 12px;
}
.col-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: start;
  position: sticky;
  top: 8px;
}
.col-body {
  min-width: 0;
}
@media (max-width: 720px) {
  .cols {
    grid-template-columns: 1fr;
  }
  .col-nav {
    position: static;
  }
}

/* ---- panel + heading ---- */
.panel {
  background: var(--paper);
  border: 1px solid var(--rule-soft);
  padding: 10px 12px;
}
.sec {
  scroll-margin-top: 12px;
  margin: 2px 0;
}
.jp-head {
  margin: 6px 0 8px;
  padding: 4px 10px;
  font-size: 1.02rem;
  color: var(--rule);
  background: var(--paper-head);
  border-left: 6px solid #c01a5b;
  border-bottom: 1px solid var(--rule-soft);
}

/* ---- status banner ---- */
.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 14px;
  font-weight: bold;
  margin: 0 0 12px;
  border: 2px ridge;
  font-family: "ＭＳ Ｐゴシック", "MS PGothic", sans-serif;
}
.banner-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
}
.banner.up {
  color: var(--up);
  background: #eafff1;
  border-color: var(--up);
}
.banner.degraded {
  color: var(--degraded);
  background: #fff7e0;
  border-color: var(--degraded);
}
.banner.down {
  color: var(--down);
  background: #ffecec;
  border-color: var(--down);
  animation: alarm 1s steps(2, start) infinite;
}
@keyframes alarm {
  50% {
    background: #ffd6d6;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 12px;
}
@media (max-width: 460px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.state {
  text-align: center;
  padding: 40px 16px;
  font-family: var(--mono);
  color: var(--rule);
}
.state.error {
  color: var(--down);
}
@media (prefers-reduced-motion: reduce) {
  .banner.down {
    animation: none;
  }
}
</style>
