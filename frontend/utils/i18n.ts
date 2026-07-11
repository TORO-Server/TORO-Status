// UI 文言を一元管理するロケールオブジェクト（日本語）。
// Nuxt の utils/ 自動インポートにより、コンポーネントから import 不要で使用できる。

export const t = {
  site: {
    titleSuffix: "// 稼働状況モニター",
    titleDefault: "TORO STATUS // 稼働状況モニター",
    subtitle: "TORO サーバー 稼働状況モニター",
  },

  status: {
    up: "稼働中",
    degraded: "低下",
    down: "停止",
  } as Record<string, string>,

  overall: {
    allDown: "すべてのサービスが停止しています",
    someDown: "一部のサービスで障害が発生しています",
    degraded: "一部のサービスで応答が遅延しています",
    allUp: "すべてのサービスが正常に稼働しています",
  },

  nav: {
    title: "■ メニュー",
    lastUpdate: "最終更新",
    live: "監視稼働中",
    liveNote: "（24時間 自動）",
    items: {
      top: "トップ",
      status: "現在の稼働状況",
      about: "このサイトについて",
      services: "サービス一覧",
      links: "関連リンク",
      source: "ソースコード",
    },
  },

  section: {
    status: "■ 現在の稼働状況",
    about: "■ このサイトについて",
    services: "■ サービス一覧",
    links: "■ 関連リンク",
  },

  page: {
    lastUpdated: "最終更新：",
    loading: "読み込み中です…",
    fetchErrorLine1: "ステータスデータの読み込みに失敗しました。",
    fetchErrorLine2: "しばらく経ってから再度お試しください。",
    footerDesc: "本ページは TORO サーバー運営チームが提供する公式ステータスページです。",
    since: "Since 2024",
    lastUpdatedShort: "／ 最終更新 ",
    powered: "Powered by TypeScript",
    defaultTitle: "TORO Status",
    defaultSubtitle: "TORO サーバー 稼働状況モニター",
    defaultIntro:
      "TORO サーバーで提供する各サービスの稼働状況を、リアルタイムに監視・公開しています。障害や遅延が発生した場合は、本ページに反映されます。",
  },

  marquee:
    "TORO サーバー 稼働状況モニター ／ 各サービスの稼働状況を24時間自動で監視しています ／ 障害・メンテナンス情報は本ページにてお知らせいたします",

  card: {
    players: "プレイヤー",
    playersUnit: "名",
    stat: {
      h24: "24時",
      d7: "7日",
      d30: "30日",
      rt: "応答",
    },
  },

  bar: {
    clock: "現在時刻：",
    total: "監視対象：",
    totalUnit: "件",
    up: "稼働中：",
    upUnit: "件",
    avgRt: "平均応答時間：",
    rtUnit: "ms",
    lastCheck: "最終チェック：",
  },

  report: {
    down: (names: string) =>
      `${names} で障害が発生しています。復旧に向けて対応を進めています。`,
    degraded: (names: string) =>
      `${names} で応答の遅延を確認しています。状況を注視しています。`,
    allUp: (total: number) =>
      `監視対象 ${total} 件のサービスは、すべて正常に稼働しています。`,
    slow: (name: string, rt: number) =>
      `${name} の応答時間が ${rt}ms とやや高めの水準です。`,
    players: (count: number) =>
      `現在、Minecraft サーバーには ${count} 名が接続しています。`,
    note: "稼働状況は10分間隔で自動的に取得・更新されます。",
  },

  about: {
    lead: "本ページは、TORO サーバーで提供する各サービスの稼働状況をリアルタイムに監視・公開する公式ステータスページです。障害や遅延が発生した場合は、本ページに反映されます。",
    rows: [
      { k: "目的", v: "TORO サーバーで提供する各サービスの稼働状況の公開" },
      { k: "監視間隔", v: "10分間隔での自動チェック" },
      { k: "監視方式", v: "Minecraft Server List Ping ／ HTTP ヘルスチェック" },
    ],
  },

  links: {
    github: {
      label: "ソースコード（GitHub）",
      note: "本サイトのソースコードを公開しています。",
    },
    official: {
      label: "TORO サーバー 公式サイト",
      href: "https://torosaba.net/",
      note: "各サービスの本体サイトです。",
    },
  },

  sparkline: {
    collecting: "▓▒░ データ収集中 ░▒▓",
  },

  uptime: {
    ariaLabel: "30日間の稼働履歴",
    noData: "データなし",
  },

  error: {
    home: "▶ トップページへ戻る",
    notFound: {
      title: "ページが見つかりません",
      message1: "お探しのページは存在しないか、移動・削除された可能性があります。",
      message2: "URL をご確認のうえ、トップページよりアクセスしてください。",
    },
    server: {
      title: "エラーが発生しました",
      message1: "予期しないエラーが発生しました。",
      message2: "しばらく時間をおいてから再度お試しください。",
    },
  },
};
