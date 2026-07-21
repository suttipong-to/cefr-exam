/* ยูทิลิตี้ร่วม: ไม่พึ่งไลบรารีภายนอก เพื่อให้ทำงานได้แม้เครือข่ายบล็อก CDN */

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* POST/GET ยูทิลิตี้ร่วม: รองรับ Apps Script Web App โดยเลี่ยงปัญหา 405/CORS เมื่อเกิด 302 redirect */
async function postJSON(url, payload) {
  // สำหรับ Apps Script Web App (script.google.com) การใช้ POST จะถูก 302 redirect ไปยัง script.googleusercontent.com
  // ซึ่งรองรับเฉพาะ GET หาก browser ส่ง POST ตามไปจะเกิด HTTP 405 Method Not Allowed ดังนั้นให้ส่งผ่าน GET payload query param
  if (url.indexOf('script.google.com') !== -1) {
    const getUrl = url + (url.indexOf('?') !== -1 ? '&' : '?') + 'payload=' + encodeURIComponent(JSON.stringify(payload));
    const resGet = await fetch(getUrl, { method: 'GET' });
    if (!resGet.ok) throw new Error('HTTP ' + resGet.status);
    const data = await resGet.json();

    // หาก Apps Script ยังเป็นโค้ดเก่าที่ doGet() คืนค่า CEFR exam backend is running (ผู้ใช้ยังไม่ได้ Deploy New version)
    // ให้พยายามส่งด้วย POST สำรองในกรณีที่เบราว์เซอร์อนุญาตการแปลง POST -> GET บน 302 redirect
    if (data && data.message === 'CEFR exam backend is running' && payload && payload.action) {
      const resPost = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (resPost.ok) return resPost.json();
    }
    return data;
  }

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
