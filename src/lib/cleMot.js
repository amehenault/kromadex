export function cleMot(mot) {
  return String(mot || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((m) => {
      if (m.length <= 3) return m;
      if (m.endsWith('eaux')) return m.slice(0, -1);
      if (m.endsWith('aux')) return `${m.slice(0, -3)}al`;
      return m.replace(/[sx]$/, '');
    })
    .join(' ');
}
