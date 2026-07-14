/* ยูทิลิตี้ร่วม: ไม่พึ่งไลบรารีภายนอก เพื่อให้ทำงานได้แม้เครือข่ายบล็อก CDN */

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* POST เป็น text/plain เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS) */
async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* CSV parser รองรับ field ที่มีเครื่องหมายจุลภาค/อัญประกาศ ("") ในตัว */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, ''); // ตัด BOM
  const rows = [];
  let row = [], field = '', i = 0, inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const header = (rows.shift() || []).map(function (h) { return h.trim(); });
  return rows
    .filter(function (r) { return r.some(function (x) { return x !== ''; }); })
    .map(function (r) {
      const o = {};
      header.forEach(function (h, idx) { o[h] = (r[idx] == null ? '' : r[idx]).trim(); });
      return o;
    });
}
