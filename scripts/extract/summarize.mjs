// Compact summary of a section extraction JSON: tree with key styles/text/images.
import fs from 'node:fs';

const file = process.argv[2];
const maxDepth = Number(process.argv[3] ?? 99);
const maxChildren = Number(process.argv[4] ?? 24);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const KEY = [
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns',
  'width', 'height', 'maxWidth', 'minWidth', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'textAlign',
  'backgroundColor', 'backgroundImage', 'borderRadius', 'border', 'boxShadow',
  'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'overflow', 'opacity', 'transform', 'transition',
];

function summarize(node, depth) {
  if (!node) return;
  const pad = '  '.repeat(depth);
  const styles = {};
  for (const k of KEY) {
    if (node.styles?.[k] && node.styles[k] !== 'rgba(0, 0, 0, 0)') styles[k] = node.styles[k];
  }
  const img = node.images ? ` IMG(${node.images.w}x${node.images.h}) ${node.images.src?.slice(0, 90)} alt="${node.images.alt || ''}"` : '';
  const rect = node.rect ? ` [${node.rect.x},${node.rect.y} ${node.rect.w}x${node.rect.h}]` : '';
  console.log(
    `${pad}${node.tag}${node.classes ? '.' + node.classes.replace(/ /g, '.') : ''}${node.id ? '#' + node.id : ''}${rect}${img}` +
    (node.text ? ` "${node.text.slice(0, 120)}"` : '') +
    (Object.keys(styles).length ? ` | ${Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(' ')}` : '')
  );
  const kids = node.children || [];
  for (const c of kids.slice(0, maxChildren)) summarize(c, depth + 1);
  if (kids.length > maxChildren) {
    console.log(`${'  '.repeat(depth + 1)}... and ${kids.length - maxChildren} more children`);
  }
}

summarize(data, 0);
