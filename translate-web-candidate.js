const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'frontend/src/modules/web_candidate');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

function hasVietnamese(text) {
  return /[\u00C0-\u1EF9]/.test(text);
}

async function translateText(text) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=' +
    encodeURIComponent(text);
  const response = await fetch(url);
  if (!response.ok) return text;
  const data = await response.json();
  const translated = (data?.[0] || []).map((item) => item?.[0] || '').join('').trim();
  return translated || text;
}

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const quoteRegex = /"[^"\n]*"|'[^'\n]*'/g;
  const jsxTextRegex = />([^<>]*[\u00C0-\u1EF9][^<>]*)</g;
  const matches = [];

  let match;
  while ((match = quoteRegex.exec(content)) !== null) {
    const full = match[0];
    const quote = full[0];
    const body = full.slice(1, -1);
    if (!hasVietnamese(body)) continue;
    matches.push({ start: match.index, end: match.index + full.length, body, quote });
  }

  while ((match = jsxTextRegex.exec(content)) !== null) {
    const full = match[0];
    const body = match[1];
    const trimmed = body.trim();
    if (!trimmed || !hasVietnamese(trimmed)) continue;

    const startOffset = full.indexOf(body);
    const bodyStart = match.index + startOffset;
    const bodyEnd = bodyStart + body.length;

    matches.push({
      start: bodyStart,
      end: bodyEnd,
      body,
      quote: '',
      isJsxText: true,
    });
  }

  if (!matches.length) return false;

  const cache = new Map();
  const replacements = [];

  for (const item of matches) {
    let translated = cache.get(item.body);
    if (!translated) {
      try {
        translated = await translateText(item.body);
      } catch {
        translated = item.body;
      }
      cache.set(item.body, translated);
    }

    if (item.isJsxText) {
      const leading = item.body.match(/^\s*/)?.[0] ?? '';
      const trailing = item.body.match(/\s*$/)?.[0] ?? '';
      replacements.push({
        start: item.start,
        end: item.end,
        value: leading + translated + trailing,
      });
      continue;
    }

    const safe = translated
      .replace(/\\/g, '\\\\')
      .replace(new RegExp(item.quote, 'g'), '\\' + item.quote);

    replacements.push({
      start: item.start,
      end: item.end,
      value: item.quote + safe + item.quote,
    });
  }

  replacements.sort((a, b) => b.start - a.start);
  for (const replacement of replacements) {
    content =
      content.slice(0, replacement.start) +
      replacement.value +
      content.slice(replacement.end);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

(async () => {
  const files = walk(root);
  let changedFiles = 0;

  for (const filePath of files) {
    const changed = await processFile(filePath);
    if (changed) changedFiles += 1;
  }

  console.log(`Changed files: ${changedFiles}`);
})();
