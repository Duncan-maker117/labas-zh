# DUNCAN 品牌素材

用户已于 2026-10-24 指定以 **DUNCAN** 作为网站对外名称，并提供深蓝色 D 字母、青色上升箭头及 DUNCAN 字标组合标志。

- [用户提供的原始标志](DUNCAN_用户提供原始标志.png)：原始附件完整副本，2736 × 912 像素。保留原件，不覆盖。
- 网站浏览器图标、导航标志、安装图标与分享预览可以从原件制作适配版本；交付时须说明派生素材位置。
- 网页仍以 `apps/web/` 为实际修改入口；本目录只放品牌素材与其说明。

本次具体替换范围见[UI 专用聊天任务](../01_项目资料/05_UI品牌改造/UI专用聊天任务.md)。

## 已适配的站点素材

- `apps/web/public/duncan-logo.png`：与原始标志逐字节一致的网页副本。
- `apps/web/public/duncan-mark.svg`、`duncan-icon.png`：从原图 D 字母区域通过 SVG 视窗适配的方形标志，保留青色箭头与原有细节。
- `apps/web/public/hero_img-*.webp`、`not_found-*.webp`：DUNCAN 首页品牌画面及 404 配图。
- `apps/web/public/opengraph-image.png`、`twitter-image.jpg`、`og_image.png`：1200 × 630 分享图。
- 旧 `logo-*.webp` 与 `labas_icon.png` 地址已同步新标志，兼容旧资源链接。PWA、favicon 和 apple-touch 图标由构建流程从 `duncan-icon.png` 生成到 `apps/web/dist/`。

在项目根目录运行 `bun scripts/generate-brand-assets.ts` 可重新生成以上公开素材，再运行 `bun run build` 生成安装图标。脚本使用仓库已有 sharp，不需要安装新依赖。

品牌名称、路径和颜色入口为 `apps/web/src/lib/brand.ts`；导航与登录 Logo 使用 `apps/web/src/components/BrandLogo.tsx`。原图保持不变，后续不必在多个页面重复制作标志。
