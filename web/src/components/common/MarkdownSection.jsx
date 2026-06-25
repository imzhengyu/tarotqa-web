import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

let mdRendererPromise;
const getMdRenderer = (plugins) => mdRendererPromise ??= (async () => {
  const [{ default: MarkdownIt }, DOMPurifyModule, ...pluginModules] = await Promise.all([
    import('markdown-it'),
    import('dompurify'),
    ...plugins.map((p) => p.loader())
  ]);
  const DOMPurify = DOMPurifyModule.default;
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
  pluginModules.forEach((pluginModule, idx) => {
    const plugin = pluginModule.default || pluginModule;
    md.use(plugin, plugins[idx].options);
  });
  return { md, DOMPurify };
})();

const MARKDOWN_ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'strong', 'em', 'del', 'mark',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div'
];

const MARKDOWN_ALLOWED_ATTR = ['href', 'src', 'alt', 'class', 'target', 'rel', 'style'];

export default function MarkdownSection({ content, plugins = [], fallback = null }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!content) {
      setHtml('');
      return undefined;
    }
    getMdRenderer(plugins).then(({ md, DOMPurify }) => {
      if (cancelled) return;
      try {
        const rendered = md.render(content);
        const clean = DOMPurify.sanitize(rendered, {
          ALLOWED_TAGS: MARKDOWN_ALLOWED_TAGS,
          ALLOWED_ATTR: MARKDOWN_ALLOWED_ATTR
        });
        setHtml(clean);
      } catch (error) {
        console.error('[Markdown渲染] 解析失败:', error);
      }
    });
    return () => { cancelled = true; };
  }, [content, plugins]);

  if (!content) return fallback;
  if (!html) return <pre className="markdown-loading">{content}</pre>;
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

MarkdownSection.propTypes = {
  content: PropTypes.string,
  plugins: PropTypes.arrayOf(PropTypes.shape({
    loader: PropTypes.func.isRequired,
    options: PropTypes.any
  })),
  fallback: PropTypes.node
};
