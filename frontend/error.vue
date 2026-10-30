<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>();

const is404 = computed(() => props.error.statusCode === 404);

const errInfo = computed(() =>
  is404.value ? t.error.notFound : t.error.server
);

const title = computed(() =>
  is404.value
    ? `404 // ${t.error.notFound.title}`
    : `${props.error.statusCode} // ${t.error.server.title}`
);

useHead({ title });

function handleError() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="page">
    <div class="frame">
      <header class="masthead">
        <h1 class="rainbow glow">TORO Status</h1>
        <p class="subtitle">{{ t.site.subtitle }}</p>
      </header>

      <div class="body">
        <div class="err-box">
          <div class="err-code">{{ error.statusCode }}</div>
          <div class="err-bar" />
          <p class="err-title">{{ errInfo.title }}</p>
          <p class="err-msg">
            {{ errInfo.message1 }}<br />
            {{ errInfo.message2 }}
          </p>

          <button class="btn-home" @click="handleError">
            {{ t.error.home }}
          </button>
        </div>
      </div>

      <footer class="foot">
        <div class="foot__rule">──────────────────────────</div>
        <p class="foot__sub">{{ t.page.powered }}</p>
        <p class="foot__tech">© {{ new Date().getFullYear() }} TORO Server. All rights reserved.</p>
        <div class="foot__rule">──────────────────────────</div>
      </footer>
    </div>
  </div>
</template>

<style scoped>

/* ---- error body ---- */
.body {
  padding: 32px 16px;
  display: flex;
  justify-content: center;
}
.err-box {
  background: var(--paper);
  border: 2px ridge var(--rule-soft);
  padding: 28px 32px;
  text-align: center;
  max-width: 520px;
  width: 100%;
}
.err-code {
  font-family: var(--mono);
  font-size: clamp(3.5rem, 12vw, 6rem);
  font-weight: 900;
  color: var(--down);
  line-height: 1;
  margin-bottom: 4px;
  text-shadow: 3px 3px 0 rgba(204, 17, 34, 0.2);
  animation: flicker 3s steps(1, end) infinite;
}
@keyframes flicker {
  0%, 92%, 96%, 100% { opacity: 1; }
  93%, 95% { opacity: 0.6; }
  94% { opacity: 0.85; }
}
.err-bar {
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--down) 0px,
    var(--down) 8px,
    transparent 8px,
    transparent 14px
  );
  margin: 8px 0 16px;
}
.err-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--rule);
  margin: 0 0 12px;
  font-family: "ＭＳ Ｐゴシック", "MS PGothic", sans-serif;
}
.err-msg {
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.8;
  margin: 0 0 20px;
}
.btn-home {
  display: inline-block;
  padding: 8px 24px;
  background: var(--paper-head);
  border: 2px outset var(--rule);
  color: var(--rule);
  font-family: var(--mono);
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  transition: none;
}
.btn-home:hover {
  background: var(--rule);
  color: var(--paper);
  border-style: inset;
}
.btn-home:active {
  border-style: inset;
  transform: translate(1px, 1px);
}

@media (max-width: 480px) {
  .err-box { padding: 20px 16px; }
  .btn-home { min-height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .err-code { animation: none; }
}
</style>
