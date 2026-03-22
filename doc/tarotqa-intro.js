const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'TarotQA';
pres.title = 'AI塔罗占卜平台 TarotQA';

// Color palette - Mystical Purple & Gold
const colors = {
  primary: "2D1B4E",      // Deep purple
  secondary: "D4AF37",    // Gold
  accent: "8B0000",       // Dark red
  background: "1A0F2E",   // Dark blue-black
  text: "F5F5F5",         // Light text
  textMuted: "B8A9C9",    // Muted purple
  white: "FFFFFF",
  darkPurple: "1A0F2E"
};

// Helper for shadow (fresh object each time)
const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.3 });

// ========== SLIDE 1: Title ==========
let slide1 = pres.addSlide();
slide1.background = { color: colors.primary };

// Decorative gold circle
slide1.addShape(pres.shapes.OVAL, {
  x: 7.5, y: -1, w: 4, h: 4,
  fill: { color: colors.secondary, transparency: 20 }
});

slide1.addShape(pres.shapes.OVAL, {
  x: -1, y: 3.5, w: 3, h: 3,
  fill: { color: colors.accent, transparency: 30 }
});

slide1.addText("AI塔罗占卜平台", {
  x: 0.5, y: 1.8, w: 9, h: 1,
  fontSize: 44, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, align: "center"
});

slide1.addText("TarotQA", {
  x: 0.5, y: 2.8, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Georgia", italic: true,
  color: colors.white, align: "center"
});

slide1.addText("探索命运的奥秘 · AI 赋能的传统智慧", {
  x: 0.5, y: 4, w: 9, h: 0.5,
  fontSize: 18, fontFace: "Microsoft YaHei",
  color: colors.textMuted, align: "center"
});

slide1.addShape(pres.shapes.LINE, {
  x: 3.5, y: 3.8, w: 3, h: 0,
  line: { color: colors.secondary, width: 2 }
});

// ========== SLIDE 2: Project Overview ==========
let slide2 = pres.addSlide();
slide2.background = { color: colors.white };

// Left accent bar
slide2.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.15, h: 5.625,
  fill: { color: colors.secondary }
});

slide2.addText("项目概述", {
  x: 0.5, y: 0.3, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Microsoft YaHei", bold: true,
  color: colors.primary, margin: 0
});

slide2.addText("纯前端静态Web应用，无需后端服务", {
  x: 0.5, y: 1.1, w: 9, h: 0.5,
  fontSize: 16, fontFace: "Microsoft YaHei",
  color: colors.textMuted
});

// Feature cards - 2x2 grid
const features = [
  { icon: "🎴", title: "真实塔罗牌图片", desc: "78张精美塔罗牌" },
  { icon: "🔮", title: "AI深度解读", desc: "MiniMax API驱动" },
  { icon: "📱", title: "响应式设计", desc: "桌面/平板/手机" },
  { icon: "⚡", title: "开箱即用", desc: "无需注册登录" }
];

features.forEach((feat, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.6 + col * 4.6;
  const y = 1.8 + row * 1.7;

  slide2.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 4.2, h: 1.4,
    fill: { color: "F8F6FA" },
    shadow: makeShadow()
  });

  slide2.addText(feat.icon, {
    x: x + 0.2, y: y + 0.3, w: 0.8, h: 0.8,
    fontSize: 32
  });

  slide2.addText(feat.title, {
    x: x + 1.1, y: y + 0.25, w: 2.8, h: 0.5,
    fontSize: 16, fontFace: "Microsoft YaHei", bold: true,
    color: colors.primary, margin: 0
  });

  slide2.addText(feat.desc, {
    x: x + 1.1, y: y + 0.75, w: 2.8, h: 0.4,
    fontSize: 12, fontFace: "Microsoft YaHei",
    color: colors.textMuted, margin: 0
  });
});

slide2.addText("v2.9  |  2026", {
  x: 0.5, y: 5.2, w: 9, h: 0.3,
  fontSize: 10, color: colors.textMuted, align: "right"
});

// ========== SLIDE 3: 78 Tarot Cards ==========
let slide3 = pres.addSlide();
slide3.background = { color: colors.background };

slide3.addText("78 张塔罗牌", {
  x: 0.5, y: 0.3, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide3.addText("完整的塔罗牌体系", {
  x: 0.5, y: 1, w: 9, h: 0.4,
  fontSize: 14, color: colors.textMuted, margin: 0
});

// Two columns - Major and Minor Arcana
// Major Arcana
slide3.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.6, w: 4.3, h: 3.5,
  fill: { color: colors.primary },
  shadow: makeShadow()
});

slide3.addText("大阿卡纳", {
  x: 0.7, y: 1.8, w: 3.9, h: 0.6,
  fontSize: 22, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide3.addText("Major Arcana", {
  x: 0.7, y: 2.3, w: 3.9, h: 0.4,
  fontSize: 12, fontFace: "Georgia", italic: true,
  color: colors.textMuted, margin: 0
});

slide3.addText([
  { text: "22 张经典塔罗牌", options: { bullet: true, breakLine: true } },
  { text: "愚者 (0) → 世界 (21)", options: { bullet: true, breakLine: true } },
  { text: "代表人生旅程的重大课题", options: { bullet: true } }
], {
  x: 0.7, y: 2.8, w: 3.9, h: 2,
  fontSize: 14, fontFace: "Microsoft YaHei",
  color: colors.text, margin: 0
});

// Minor Arcana
slide3.addShape(pres.shapes.RECTANGLE, {
  x: 5.2, y: 1.6, w: 4.3, h: 3.5,
  fill: { color: colors.primary },
  shadow: makeShadow()
});

slide3.addText("小阿卡纳", {
  x: 5.4, y: 1.8, w: 3.9, h: 0.6,
  fontSize: 22, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide3.addText("Minor Arcana", {
  x: 5.4, y: 2.3, w: 3.9, h: 0.4,
  fontSize: 12, fontFace: "Georgia", italic: true,
  color: colors.textMuted, margin: 0
});

slide3.addText([
  { text: "56 张元素牌", options: { bullet: true, breakLine: true } },
  { text: "权杖 · 圣杯 · 宝剑 · 金币", options: { bullet: true, breakLine: true } },
  { text: "每组 14 张 (A, 1-10, 王后/国王)", options: { bullet: true, breakLine: true } },
  { text: "代表日常生活的细微变化", options: { bullet: true } }
], {
  x: 5.4, y: 2.8, w: 3.9, h: 2.2,
  fontSize: 14, fontFace: "Microsoft YaHei",
  color: colors.text, margin: 0
});

// ========== SLIDE 4: 5 Spreads ==========
let slide4 = pres.addSlide();
slide4.background = { color: colors.white };

slide4.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 1.2,
  fill: { color: colors.primary }
});

slide4.addText("五大牌阵 · 占卜方式", {
  x: 0.5, y: 0.35, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.white, margin: 0
});

const spreads = [
  { name: "单牌阵", cards: "1张", use: "快速简单占卜" },
  { name: "三牌阵", cards: "3张", use: "过去/现在/未来" },
  { name: "爱情金字塔", cards: "4张", use: "情感专项分析" },
  { name: "马蹄铁牌阵", cards: "7张", use: "运势综合分析" },
  { name: "凯尔特十字", cards: "10张", use: "深度详细解读" }
];

spreads.forEach((spread, i) => {
  const y = 1.5 + i * 0.78;

  // Number circle
  slide4.addShape(pres.shapes.OVAL, {
    x: 0.5, y: y + 0.08, w: 0.5, h: 0.5,
    fill: { color: colors.secondary }
  });

  slide4.addText(String(i + 1), {
    x: 0.5, y: y + 0.08, w: 0.5, h: 0.5,
    fontSize: 16, fontFace: "Arial", bold: true,
    color: colors.primary, align: "center", valign: "middle"
  });

  // Card count badge
  slide4.addShape(pres.shapes.RECTANGLE, {
    x: 2.2, y: y + 0.15, w: 0.9, h: 0.35,
    fill: { color: colors.accent }
  });

  slide4.addText(spread.cards, {
    x: 2.2, y: y + 0.15, w: 0.9, h: 0.35,
    fontSize: 11, fontFace: "Microsoft YaHei", bold: true,
    color: colors.white, align: "center", valign: "middle"
  });

  slide4.addText(spread.name, {
    x: 3.3, y: y + 0.08, w: 3, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei", bold: true,
    color: colors.primary, margin: 0
  });

  slide4.addText(spread.use, {
    x: 6.3, y: y + 0.12, w: 3.2, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: colors.textMuted, margin: 0
  });
});

// ========== SLIDE 5: AI Interpretation ==========
let slide5 = pres.addSlide();
slide5.background = { color: colors.background };

slide5.addText("AI 深度解读", {
  x: 0.5, y: 0.3, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide5.addText("MiniMax 大模型驱动 · 专业的塔罗解读", {
  x: 0.5, y: 1, w: 9, h: 0.4,
  fontSize: 14, color: colors.textMuted, margin: 0
});

// Feature boxes - 3 columns
const aiFeatures = [
  { title: "智能角色", desc: "根据问题类型匹配专业顾问角色" },
  { title: "深度分析", desc: "结合牌阵位置和牌义综合解读" },
  { title: "Markdown 渲染", desc: "优雅的分段显示，支持加粗列表" }
];

aiFeatures.forEach((feat, i) => {
  const x = 0.5 + i * 3.1;

  slide5.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.6, w: 2.9, h: 2.2,
    fill: { color: colors.primary },
    shadow: makeShadow()
  });

  // Gold top accent
  slide5.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.6, w: 2.9, h: 0.08,
    fill: { color: colors.secondary }
  });

  slide5.addText(feat.title, {
    x: x + 0.2, y: 1.85, w: 2.5, h: 0.5,
    fontSize: 18, fontFace: "Microsoft YaHei", bold: true,
    color: colors.secondary, margin: 0
  });

  slide5.addText(feat.desc, {
    x: x + 0.2, y: 2.4, w: 2.5, h: 1.2,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: colors.text, margin: 0
  });
});

// Rate limit note
slide5.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 4.1, w: 9, h: 1.2,
  fill: { color: "2D1B4E", transparency: 50 }
});

slide5.addText("⏱️ 60秒冷却机制", {
  x: 0.7, y: 4.25, w: 8.6, h: 0.4,
  fontSize: 14, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide5.addText("防止滥用，确保每位用户都能获得及时的 AI 解读服务", {
  x: 0.7, y: 4.65, w: 8.6, h: 0.5,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: colors.textMuted, margin: 0
});

// ========== SLIDE 6: Technical Architecture ==========
let slide6 = pres.addSlide();
slide6.background = { color: colors.white };

slide6.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 1.2,
  fill: { color: colors.primary }
});

slide6.addText("技术架构", {
  x: 0.5, y: 0.35, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.white, margin: 0
});

// Tech stack grid
const techStack = [
  { name: "React 18", desc: "UI 框架" },
  { name: "Vite 5", desc: "构建工具" },
  { name: "React Router", desc: "路由管理" },
  { name: "CSS Variables", desc: "样式方案" },
  { name: "markdown-it", desc: "Markdown 渲染" },
  { name: "DOMPurify", desc: "XSS 防护" }
];

techStack.forEach((tech, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.5 + col * 3.1;
  const y = 1.5 + row * 1.5;

  slide6.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: 2.9, h: 1.2,
    fill: { color: "F8F6FA" },
    line: { color: colors.secondary, width: 1 }
  });

  slide6.addText(tech.name, {
    x: x, y: y + 0.25, w: 2.9, h: 0.5,
    fontSize: 16, fontFace: "Arial", bold: true,
    color: colors.primary, align: "center", margin: 0
  });

  slide6.addText(tech.desc, {
    x: x, y: y + 0.7, w: 2.9, h: 0.4,
    fontSize: 12, fontFace: "Microsoft YaHei",
    color: colors.textMuted, align: "center", margin: 0
  });
});

slide6.addText("纯前端静态部署 · 全球 CDN 加速", {
  x: 0.5, y: 4.8, w: 9, h: 0.5,
  fontSize: 14, fontFace: "Microsoft YaHei",
  color: colors.accent, align: "center"
});

// ========== SLIDE 7: Mobile Support ==========
let slide7 = pres.addSlide();
slide7.background = { color: colors.background };

slide7.addText("移动端适配", {
  x: 0.5, y: 0.3, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, margin: 0
});

slide7.addText("响应式设计 · 跨平台兼容", {
  x: 0.5, y: 1, w: 9, h: 0.4,
  fontSize: 14, color: colors.textMuted, margin: 0
});

// Device comparison
const devices = [
  { name: "桌面端", width: "≥1024px", icon: "💻" },
  { name: "平板端", width: "768-1023px", icon: "📱" },
  { name: "手机端", width: "<768px", icon: "📱" }
];

devices.forEach((device, i) => {
  const x = 0.5 + i * 3.1;

  slide7.addShape(pres.shapes.RECTANGLE, {
    x: x, y: 1.6, w: 2.9, h: 2.8,
    fill: { color: colors.primary },
    shadow: makeShadow()
  });

  slide7.addText(device.icon, {
    x: x, y: 1.8, w: 2.9, h: 0.8,
    fontSize: 40, align: "center"
  });

  slide7.addText(device.name, {
    x: x, y: 2.7, w: 2.9, h: 0.5,
    fontSize: 20, fontFace: "Microsoft YaHei", bold: true,
    color: colors.secondary, align: "center", margin: 0
  });

  slide7.addText(device.width, {
    x: x, y: 3.3, w: 2.9, h: 0.4,
    fontSize: 14, fontFace: "Arial",
    color: colors.text, align: "center", margin: 0
  });
});

slide7.addText("顶部固定导航 · 优化的触摸区域 · 移除不必要的动画", {
  x: 0.5, y: 4.8, w: 9, h: 0.5,
  fontSize: 12, color: colors.textMuted, align: "center"
});

// ========== SLIDE 8: Conclusion ==========
let slide8 = pres.addSlide();
slide8.background = { color: colors.primary };

// Decorative elements
slide8.addShape(pres.shapes.OVAL, {
  x: -2, y: -2, w: 6, h: 6,
  fill: { color: colors.secondary, transparency: 15 }
});

slide8.addShape(pres.shapes.OVAL, {
  x: 7, y: 3, w: 5, h: 5,
  fill: { color: colors.accent, transparency: 20 }
});

slide8.addText("探索命运的指引", {
  x: 0.5, y: 1.8, w: 9, h: 0.8,
  fontSize: 40, fontFace: "Microsoft YaHei", bold: true,
  color: colors.secondary, align: "center"
});

slide8.addText("TarotQA - AI塔罗占卜平台", {
  x: 0.5, y: 2.8, w: 9, h: 0.6,
  fontSize: 24, fontFace: "Georgia", italic: true,
  color: colors.white, align: "center"
});

slide8.addShape(pres.shapes.LINE, {
  x: 3.5, y: 3.6, w: 3, h: 0,
  line: { color: colors.secondary, width: 2 }
});

slide8.addText([
  { text: "开箱即用 · 无需注册", options: { breakLine: true } },
  { text: "AI 深度解读 · 专业塔罗分析", options: { breakLine: true } },
  { text: "完整的 78 张塔罗牌体系", options: {} }
], {
  x: 0.5, y: 4, w: 9, h: 1.2,
  fontSize: 16, fontFace: "Microsoft YaHei",
  color: colors.textMuted, align: "center"
});

slide8.addText("tarotqa.com", {
  x: 0.5, y: 5.1, w: 9, h: 0.4,
  fontSize: 14, fontFace: "Arial",
  color: colors.secondary, align: "center"
});

// Save
pres.writeFile({ fileName: "e:/git_workspace/tarotqa-web/doc/TarotQA-介绍.pptx" })
  .then(() => console.log("PPT created: TarotQA-介绍.pptx"))
  .catch(err => console.error(err));
