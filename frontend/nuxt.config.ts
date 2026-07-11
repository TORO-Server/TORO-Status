// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  ssr: true,

  nitro: {
    preset: "static",
  },

  app: {
    baseURL: "/",
    head: {
      htmlAttrs: { lang: "ja" },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "TORO STATUS // 稼働状況モニター",
      meta: [
        { name: "theme-color", content: "#02030a" },
        {
          name: "description",
          content:
            "TORO サーバーの稼働状況をリアルタイムに監視・公開する公式ステータスページ",
        },
      ],
      link: [
        {
          rel: "icon",
          href: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E%3Crect%20width='32'%20height='32'%20rx='4'%20fill='%2305060e'/%3E%3Crect%20x='6'%20y='6'%20width='20'%20height='6'%20rx='1'%20fill='%2311173a'%20stroke='%232a3360'/%3E%3Crect%20x='6'%20y='14'%20width='20'%20height='6'%20rx='1'%20fill='%2311173a'%20stroke='%232a3360'/%3E%3Crect%20x='6'%20y='22'%20width='20'%20height='6'%20rx='1'%20fill='%2311173a'%20stroke='%232a3360'/%3E%3Ccircle%20cx='10'%20cy='9'%20r='1.6'%20fill='%2335ff7b'/%3E%3Ccircle%20cx='10'%20cy='17'%20r='1.6'%20fill='%2335ff7b'/%3E%3Ccircle%20cx='10'%20cy='25'%20r='1.6'%20fill='%23ffb020'/%3E%3C/svg%3E",
        },
      ],
    },
  },

  css: ["~/assets/styles.css"],

  vite: {
    build: {
      modulePreload: false,
    },
  },
})
