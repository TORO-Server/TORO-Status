<script setup lang="ts">
import type { SiteSummary } from "~/types";

const props = defineProps<{ site: SiteSummary; flash?: boolean }>();


// config の icon は 404 し得るのでモノグラムにフォールバック。
const iconFailed = ref(false);

watch(
  () => props.site.icon,
  () => {
    iconFailed.value = false;
  }
);

const initials = computed(() => {
  const cleanName = props.site.name.replace(/[\s()（）[\]{}'"`.,\/\\_+\-*&^%$#@!~?]/g, "");
  return cleanName.slice(0, 2).toUpperCase() || "##";
});

function fmtUptime(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : `${v}%`;
}
function fmtRt(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : `${v} ms`;
}
</script>

<template>
  <div :id="`site-${site.slug}`" class="card" :class="[site.status, { flash }]">
    <div class="card-head">
      <img
        v-if="site.icon && !iconFailed"
        class="icon"
        :src="site.icon"
        :alt="site.name"
        loading="lazy"
        @error="iconFailed = true"
      />
      <span v-else class="icon icon--mono">{{ initials }}</span>

      <div class="title">
        <div class="name">
          <a
            v-if="site.url"
            :href="site.url"
            target="_blank"
            rel="noopener noreferrer"
            class="site-link"
          >
            {{ site.name }}<span class="ext-icon">↗</span>
          </a>
          <span v-else>{{ site.name }}</span>
        </div>
        <div class="target">
          <a
            v-if="site.url"
            :href="site.url"
            target="_blank"
            rel="noopener noreferrer"
            class="target-link"
          >
            {{ site.target }}
          </a>
          <span v-else>{{ site.target }}</span>
        </div>
      </div>
      <span class="pill" :class="site.status">
        <span class="dot" />
        {{ t.status[site.status] || site.status }}
      </span>
    </div>

    <div class="meta">
      <span v-if="site.type === 'minecraft' && site.players">
        {{ t.card.players }} {{ site.players.online }}<span class="muted">/{{ site.players.max }}</span> {{ t.card.playersUnit }}
      </span>
      <span v-if="site.version" class="muted">{{ site.version }}</span>
      <span class="rt">{{ fmtRt(site.responseTime) }}</span>
    </div>

    <Sparkline :values="site.sparkline" />
    <UptimeBars :bars="site.bars" />

    <div class="stats">
      <div class="stat">
        <span class="stat-label">{{ t.card.stat.h24 }}</span>
        <span class="stat-val">{{ fmtUptime(site.uptime["24h"]) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ t.card.stat.d7 }}</span>
        <span class="stat-val">{{ fmtUptime(site.uptime["7d"]) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ t.card.stat.d30 }}</span>
        <span class="stat-val">{{ fmtUptime(site.uptime["30d"]) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ t.card.stat.rt }}</span>
        <span class="stat-val">{{ fmtRt(site.avgResponseTime["30d"]) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--paper);
  border: 1px solid var(--rule);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--ink);
  scroll-margin-top: 16px;
}
.card.degraded {
  border-color: var(--degraded);
}
.card.down {
  border-color: var(--down);
  background: #fff5f5;
}
.card.flash {
  animation: card-flash 1.2s ease-out 2;
}
@keyframes card-flash {
  0%,
  100% {
    box-shadow: none;
  }
  50% {
    box-shadow: 0 0 0 2px #ffd400, 0 0 14px #ffae00;
  }
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid var(--rule-soft);
  object-fit: cover;
  image-rendering: pixelated;
  background: #fff;
}
.icon--mono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-alt);
  color: var(--rule);
  font-family: var(--mono);
  font-weight: bold;
  font-size: 0.78rem;
}
.title {
  min-width: 0;
  flex: 1;
}
.name {
  font-weight: bold;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.target {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: bold;
  border: 1px solid currentColor;
  flex-shrink: 0;
}
.pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.pill.up {
  color: var(--up);
  background: #e8fff0;
}
.pill.degraded {
  color: var(--degraded);
  background: #fff8e0;
}
.pill.down {
  color: var(--down);
  background: #ffecec;
}
.pill.down .dot {
  animation: blink 0.8s steps(2, start) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.82rem;
  color: var(--ink);
  flex-wrap: wrap;
}
.meta .muted {
  color: var(--ink-soft);
}
.meta .rt {
  margin-left: auto;
  font-family: var(--mono);
  font-weight: bold;
  color: var(--up);
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  border-top: 1px solid var(--rule-soft);
  padding-top: 8px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.stat-label {
  font-family: var(--mono);
  font-size: 0.64rem;
  color: var(--ink-soft);
}
.stat-val {
  font-family: var(--mono);
  font-weight: bold;
  color: var(--ink);
}
@media (prefers-reduced-motion: reduce) {
  .pill.down .dot,
  .card.flash {
    animation: none;
  }
}

@media (max-width: 420px) {
  .name,
  .target {
    white-space: normal;
    word-break: break-all;
  }
}

@media (max-width: 360px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 6px;
  }
}

.site-link {
  color: inherit;
  text-decoration: none;
}
.site-link:hover {
  text-decoration: underline;
  color: var(--rule);
}
.ext-icon {
  font-size: 0.75em;
  margin-left: 2px;
  color: var(--ink-soft);
  display: inline-block;
  vertical-align: middle;
}
.target-link {
  color: inherit;
  text-decoration: none;
}
.target-link:hover {
  text-decoration: underline;
}
</style>
