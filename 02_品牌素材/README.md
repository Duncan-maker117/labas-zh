# DUNCAN 品牌素材

用户已于 2026-10-24 指定以 **DUNCAN** 作为网站对外名称，并提供深蓝色 D 字母、青色上升箭头及 DUNCAN 字标组合标志。

- [用户提供的原始标志](DUNCAN_用户提供原始标志.png)：原始附件完整副本，2736 × 912 像素。保留原件，不覆盖。
- [去白底透明标志](DUNCAN_透明标志.png)：2172 × 724，保留 D、青色箭头及 DUNCAN 字样，背景和字母内部空白均透明。当前网站从这份素材适配。
- 网站浏览器图标、导航标志、安装图标与分享预览可以从原件制作适配版本；交付时须说明派生素材位置。
- 网页仍以 `apps/web/` 为实际修改入口；本目录只放品牌素材与其说明。

本次具体替换范围见[UI 专用聊天任务](../01_项目资料/05_UI品牌改造/UI专用聊天任务.md)。

## 已适配的站点素材

- `apps/web/public/duncan-logo-transparent.png`：透明标志的网页副本。
- `apps/web/public/duncan-mark.svg`、`duncan-icon-transparent.png`：从透明标志 D 字母区域通过 SVG 视窗适配的透明方形标志。
- `apps/web/public/duncan-hero-*.webp`、`duncan-not-found-*.webp`：透明首页品牌画面及 404 配图，没有白色卡片底框。
- `apps/web/public/opengraph-image.png`、`twitter-image.jpg`、`og_image.png`：1200 × 630 分享图。
- 旧 `logo-*.webp`、`duncan-logo.png`、`duncan-icon.png`、`labas_icon.png`、`hero_img-*.webp` 和 `not_found-*.webp` 地址已同步透明版本，兼容旧资源链接。PWA、favicon 和 apple-touch 图标由构建流程从 `duncan-icon-transparent.png` 生成到 `apps/web/dist/`。普通图标保留透明背景；要求实底的 maskable/apple 图标使用页面暖米色 `#faf9f7`，不添加白色边框。

在项目根目录运行 `bun scripts/generate-brand-assets.ts` 可重新生成以上公开素材，再运行 `bun run build` 生成安装图标。脚本使用仓库已有 sharp，不需要安装新依赖。

品牌名称、路径和颜色入口为 `apps/web/src/lib/brand.ts`；导航与登录 Logo 使用 `apps/web/src/components/BrandLogo.tsx`。原图保持不变，后续不必在多个页面重复制作标志。

## 透明版生成说明

2026-10-24 根据用户“去掉白底，只保留 D、向上箭头和 DUNCAN 字样”的修正，使用内置 `image_gen` 编辑原图，设置 `transparent_background: true`。未使用 API/CLI 后备模式。最终素材保存为本目录的 `DUNCAN_透明标志.png`，后续网站素材脚本只做适配与格式转换。

本次实际提示词：

> Edit the provided DUNCAN logo into an exact transparent-background cutout for a website. Remove ONLY the white/off-white canvas/background including all white holes inside the D and letters. Keep the existing dark navy D, cyan diagonal upward arrow and its small cyan hub/detail, and the exact uppercase DUNCAN lettering with their original positions, colors, aspect ratio, edges and spacing. Do not redesign, redraw, simplify, add effects, add borders, add shadows, add a panel, change letters, change their shape, or add any new content. Return all original foreground artwork on a fully transparent background. Preserve the full horizontal composition and all its elements. The white original background is not part of the logo.
