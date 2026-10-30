<script setup lang="ts">
// 関連リンク。企業公式として中立・敬体。相互リンク募集やバナー配布は行わない。
const props = defineProps<{ github?: string | null }>();
const repo = computed(
  () => props.github ?? "https://github.com/TORO-Server/upptime"
);

const links = computed(() => [
  { label: t.links.github.label, href: repo.value, note: t.links.github.note },
  { label: t.links.official.label, href: t.links.official.href, note: t.links.official.note },
]);
</script>

<template>
  <ul class="links">
    <li v-for="(l, i) in links" :key="i" class="links__item">
      <a :href="l.href" target="_blank" rel="noopener">{{ l.label }}</a>
      <span class="links__note">{{ l.note }}</span>
    </li>
  </ul>
</template>

<style scoped>
.links {
  list-style: none;
  margin: 0;
  padding: 0;
  color: var(--ink);
  font-size: 0.9rem;
}
.links__item {
  padding: 4px 0;
  border-bottom: 1px dotted var(--rule-soft);
}
.links__item:last-child {
  border-bottom: 0;
}
.links__note {
  display: block;
  color: var(--ink-soft);
  font-size: 0.8rem;
  margin-top: 1px;
}

/* スマホ: リンクを押しやすい高さに */
@media (max-width: 720px) {
  .links__item {
    padding: 0 0 6px;
  }
  .links__item a {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
  }
  .links__note {
    margin-top: 0;
  }
}
</style>
