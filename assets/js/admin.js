/* หน้าแอดมิน: กรอก passphrase (ตรวจฝั่ง server) แล้วดูผล/สรุป/export พร้อมดูเฉลยและตรวจคำตอบรายข้อ */
(function () {
  const cfg = window.EXAM_CONFIG;
  let allRows = [];
  let passPercent = cfg.PASS_PERCENT;
  let answerKeys = null;

  // เฉลยสำรอง (ในกรณีที่ยังไม่ได้ Deploy Code.gs ใหม่ล่าสุดที่ส่ง answerKeys มาให้)
  const FALLBACK_KEYS = {
    'Set 1': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"},
    'Set 2': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"},
    'Set 3': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"}
  };

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
        answerKeys = resp.answerKeys || FALLBACK_KEYS;
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

    $('#view-keys-btn').addEventListener('click', function () {
      openKeysModal('Set 1');
    });

    $all('.key-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $all('.key-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderKeyTable(tab.getAttribute('data-set'));
      });
    });

    $all('.close-modal-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        const targetId = b.getAttribute('data-target');
        if (targetId && $('#' + targetId)) $('#' + targetId).hidden = true;
      });
    });

    $all('.modal-overlay').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m) m.hidden = true;
      });
    });

    $('#results-body').addEventListener('click', function (e) {
      const btn = e.target.closest('.inspect-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        const row = allRows.find(function (r) { return (r.timestamp + '-' + r.firstName) === id; });
        if (row) openInspectModal(row);
      }
    });
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
        '<td><span class="badge ' + (pass ? 'pass' : 'fail') + '">' + (pass ? 'ผ่าน' : 'ไม่ผ่าน') + '</span></td>' +
        '<td style="text-align:center"><button class="btn btn-ghost btn-sm inspect-btn" data-id="' + escapeHtml(r.timestamp + '-' + r.firstName) + '">🔍 ตรวจคำตอบ</button></td>';
      tbody.appendChild(tr);
    });
    $('#empty').hidden = rows.length > 0;
  }

  function openKeysModal(setName) {
    $('#keys-modal').hidden = false;
    $all('.key-tab').forEach(function (t) {
      if (t.getAttribute('data-set') === setName) t.classList.add('active');
      else t.classList.remove('active');
    });
    renderKeyTable(setName);
  }

  function renderKeyTable(setName) {
    const wrap = $('#keys-content');
    const keys = (answerKeys && answerKeys[setName]) ? answerKeys[setName] : (FALLBACK_KEYS[setName] || {});
    if (!Object.keys(keys).length) { wrap.innerHTML = '<p class="empty">ไม่พบข้อมูลเฉลยของ ' + escapeHtml(setName) + '</p>'; return; }

    let html = '<table class="inspect-table"><thead><tr><th style="width:120px">ข้อที่</th><th>เฉลยที่ถูกต้อง</th></tr></thead><tbody>';
    const total = Object.keys(keys).length;
    for (let i = 1; i <= total; i++) {
      html += '<tr><td><strong>ข้อ ' + i + '</strong></td><td><span class="badge pass" style="font-size:0.95rem">ตัวเลือก ' + escapeHtml(keys[i] || '-') + '</span></td></tr>';
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function openInspectModal(r) {
    const keys = (answerKeys && answerKeys[r.set]) ? answerKeys[r.set] : (FALLBACK_KEYS[r.set] || {});
    const studentAnswers = typeof r.answers === 'string' ? r.answers.split(',') : (Array.isArray(r.answers) ? r.answers : []);
    const pass = String(r.result).toUpperCase() === 'PASS';

    $('#inspect-title').textContent = '🔍 ตรวจคำตอบ: ' + r.firstName + ' ' + r.lastName + ' (' + r.set + ')';

    const sumWrap = $('#inspect-summary');
    sumWrap.innerHTML =
      '<div><span class="lbl">ชุดข้อสอบ</span><span class="val">' + escapeHtml(r.set) + '</span></div>' +
      '<div><span class="lbl">คะแนนรวม</span><span class="val">' + escapeHtml(r.score) + ' / ' + escapeHtml(r.total) + ' (' + escapeHtml(r.percent) + '%)</span></div>' +
      '<div><span class="lbl">ผลการประเมิน</span><span class="val"><span class="badge ' + (pass ? 'pass' : 'fail') + '">' + (pass ? 'ผ่าน' : 'ไม่ผ่าน') + '</span></span></div>' +
      '<div><span class="lbl">เวลาที่ใช้</span><span class="val">' + Math.round((Number(r.durationSec || 0)) / 60) + ' นาที</span></div>' +
      '<div><span class="lbl">วันที่ส่ง</span><span class="val">' + escapeHtml(fmtTime(r.timestamp)) + '</span></div>';

    let html = '<table class="inspect-table"><thead><tr><th>ข้อที่</th><th>คำตอบที่เลือก</th><th>เฉลยที่ถูกต้อง</th><th>ผลตรวจ</th></tr></thead><tbody>';
    const total = Number(r.total || Object.keys(keys).length || 50);
    let correctCount = 0;
    for (let i = 1; i <= total; i++) {
      const stuAns = String(studentAnswers[i - 1] || '-').trim().toUpperCase();
      const keyAns = String(keys[i] || '-').trim().toUpperCase();
      const isCorrect = (stuAns !== '-' && stuAns === keyAns);
      if (isCorrect) correctCount++;

      html += '<tr class="' + (isCorrect ? 'row-correct' : (stuAns === '-' ? '' : 'row-wrong')) + '">' +
        '<td><strong>ข้อ ' + i + '</strong></td>' +
        '<td>' + (stuAns === '-' ? '<span style="color:#94a3b8"><i>ไม่ได้ตอบ</i></span>' : '<strong style="color:' + (isCorrect ? 'var(--pass)' : 'var(--fail)') + '">' + escapeHtml(stuAns) + '</strong>') + '</td>' +
        '<td><strong style="color:var(--pass)">' + escapeHtml(keyAns) + '</strong></td>' +
        '<td>' + (isCorrect ? '✅ <span style="color:var(--pass);font-size:0.85rem">ถูกต้อง</span>' : (stuAns === '-' ? '⚪ <span style="color:#94a3b8;font-size:0.85rem">ข้าม</span>' : '❌ <span style="color:var(--fail);font-size:0.85rem">ผิด</span>')) + '</td>' +
      '</tr>';
    }
    html += '</tbody></table>';
    $('#inspect-content').innerHTML = html;
    $('#inspect-modal').hidden = false;
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
