/* หน้าแอดมิน: กรอก passphrase (ตรวจฝั่ง server) แล้วดูผล/สรุป/export */
(function () {
  const cfg = window.EXAM_CONFIG;
  let allRows = [];
  let passPercent = cfg.PASS_PERCENT;

  $('#login-btn').addEventListener('click', login);
  $('#pass-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });

  async function login() {
    const pass = $('#pass-input').value;
    const err = $('#login-error');
    const btn = $('#login-btn');
    if (!pass) { show(err, 'กรอกรหัสผ่านแอดมิน'); return; }

    btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ...'; hide(err);
    try {
      const resp = await postJSON(cfg.API_URL, { action: 'getResults', passphrase: pass });
      if (resp.status === 'ok') {
        allRows = resp.rows || [];
        passPercent = resp.passPercent || cfg.PASS_PERCENT;
        $('#gate').hidden = true;
        $('#dashboard').hidden = false;
        buildFilters();
        render();
      } else {
        throw new Error('unauthorized');
      }
    } catch (e) {
      show(err, 'รหัสไม่ถูกต้อง หรือเชื่อมต่อไม่สำเร็จ');
    } finally {
      btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
    }
  }

  function buildFilters() {
    const sel = $('#filter-set');
    const sets = Array.from(new Set(allRows.map(function (r) { return r.set; }))).sort();
    sel.innerHTML = '<option value="">ทุกชุด</option>';
    sets.forEach(function (s) {
      const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
    });
    sel.addEventListener('change', render);
    $('#filter-text').addEventListener('input', render);
    $('#export-btn').addEventListener('click', exportCSV);
  }

  function currentRows() {
    const setF = $('#filter-set').value;
    const txt = $('#filter-text').value.trim().toLowerCase();
    return allRows.filter(function (r) {
      if (setF && r.set !== setF) return false;
      if (txt) {
        const name = ((r.firstName || '') + ' ' + (r.lastName || '')).toLowerCase();
        if (name.indexOf(txt) === -1) return false;
      }
      return true;
    });
  }

  function render() {
    const rows = currentRows();

    // สรุป
    const n = rows.length;
    const avg = n ? (rows.reduce(function (a, r) { return a + Number(r.percent || 0); }, 0) / n) : 0;
    const passed = rows.filter(function (r) { return String(r.result).toUpperCase() === 'PASS'; }).length;
    $('#stat-count').textContent = n;
    $('#stat-avg').textContent = n ? avg.toFixed(1) + '%' : '–';
    $('#stat-pass').textContent = n ? passed + ' (' + Math.round((passed / n) * 100) + '%)' : '–';

    // ตาราง
    const tbody = $('#results-body');
    tbody.innerHTML = '';
    rows.slice().reverse().forEach(function (r) {
      const tr = document.createElement('tr');
      const pass = String(r.result).toUpperCase() === 'PASS';
      tr.innerHTML =
        '<td>' + escapeHtml(fmtTime(r.timestamp)) + '</td>' +
        '<td>' + escapeHtml(r.firstName) + ' ' + escapeHtml(r.lastName) + '</td>' +
        '<td>' + escapeHtml(r.set) + '</td>' +
        '<td class="num">' + escapeHtml(r.score) + '/' + escapeHtml(r.total) + '</td>' +
        '<td class="num">' + escapeHtml(r.percent) + '%</td>' +
        '<td><span class="badge ' + (pass ? 'pass' : 'fail') + '">' + (pass ? 'ผ่าน' : 'ไม่ผ่าน') + '</span></td>';
      tbody.appendChild(tr);
    });
    $('#empty').hidden = rows.length > 0;
  }

  function exportCSV() {
    const rows = currentRows();
    const header = ['timestamp', 'first_name', 'last_name', 'set', 'score', 'total', 'percent', 'result', 'answers', 'duration_sec'];
    const lines = [header.join(',')];
    rows.forEach(function (r) {
      const rec = [fmtTime(r.timestamp), r.firstName, r.lastName, r.set, r.score, r.total, r.percent, r.result, r.answers, r.durationSec];
      lines.push(rec.map(csvCell).join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'results_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(v) {
    v = String(v == null ? '' : v);
    if (/[",\r\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function fmtTime(t) {
    const d = new Date(t);
    if (isNaN(d.getTime())) return String(t || '');
    const p = function (x) { return x < 10 ? '0' + x : x; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function show(el, msg) { el.textContent = msg; el.hidden = false; }
  function hide(el) { el.hidden = true; }
})();
