<script setup lang="ts">
// 左メニュー(・[ とっぷ ]形式)。ひらがな多用がやわらかさの肝。
interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}
defineProps<{ items: NavItem[]; lastUpdate?: string }>();
</script>

<template>
  <nav class="nav">
    <div class="nav__title">{{ t.nav.title }}</div>
    <ul class="nav__list">
      <li v-for="(it, i) in items" :key="i">
        ・<a
          :href="it.href"
          :target="it.external ? '_blank' : undefined"
          :rel="it.external ? 'noopener' : undefined"
          >{{ it.label }}</a
        ><span v-if="it.external" class="ext">↗</span>
      </li>
    </ul>
    <div class="nav__rule">─────────</div>
    <div v-if="lastUpdate" class="nav__upd">
      {{ t.nav.lastUpdate }}<br />{{ lastUpdate }}
    </div>
    <div class="nav__rule">─────────</div>
    <div class="nav__live">
      <span class="live-dot">●</span> {{ t.nav.live }}<br />
      {{ t.nav.liveNote }}
    </div>
  </nav>
</template>

<style scoped>
.nav {
  background: var(--paper-alt);
  border: 1px solid var(--rule);
  padding: 8px 10px;
  font-size: 0.84rem;
  color: var(--ink);
}
.nav__title {
  text-align: center;
  font-weight: bold;
  color: #c01a5b;
  border-bottom: 1px dashed var(--rule-soft);
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.nav__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav__list li {
  padding: 2px 0;
  white-space: nowrap;
}
.nav__list .ext {
  font-size: 0.7rem;
  color: var(--ink-soft);
  margin-left: 1px;
}
.nav__rule {
  color: var(--rule-soft);
  text-align: center;
  font-family: var(--mono);
  margin: 6px 0;
  overflow: hidden;
}
.nav__upd {
  font-family: var(--mono);
  font-size: 0.74rem;
  color: var(--ink-soft);
  text-align: center;
}
.nav__live {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--up);
  text-align: center;
}
.live-dot {
  animation: live 1.4s steps(2, start) infinite;
}
@keyframes live {
  50% {
    opacity: 0.25;
  }
}
@media (prefers-reduced-motion: reduce) {
  .live-dot {
    animation: none;
  }
}

@media (max-width: 720px) {
  .nav {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
  }
  .nav__title,
  .nav__rule,
  .nav__live {
    display: none;
  }
  .nav__list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 4px;
    width: 100%;
  }
  .nav__list li {
    padding: 0;
    display: flex;
    align-items: center;
  }
  /* 指で押しやすい高さ（40px）を確保 */
  .nav__list a {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 6px;
  }
  .nav__list .ext {
    font-size: 0.75rem;
    margin-left: -4px;
  }
  .nav__upd {
    font-size: 0.75rem;
    margin-top: 2px;
  }
}
</style>
