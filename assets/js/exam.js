/* ตรรกะหน้าเริ่มต้น + หน้าทำข้อสอบ */
(function () {
  const cfg = window.EXAM_CONFIG;
  const page = document.body.dataset.page;
  if (page === 'start') initStart();
  if (page === 'exam') initExam();

  /* ---------- หน้าเริ่มต้น: กรอกชื่อ-นามสกุล ---------- */
  function initStart() {
    const setField = $('#set-field');
    if (!cfg.RANDOM_SET && setField) {
      setField.hidden = false;
      const choicesWrap = $('#set-choices');
      const selectElem = $('#set-select');
      if (choicesWrap) {
        choicesWrap.innerHTML = '';
        cfg.SETS.forEach(function (s, idx) {
          const card = document.createElement('label');
          card.className = 'set-choice';
          card.innerHTML =
            '<input type="radio" name="exam_set" value="' + escapeHtml(s.id) + '"' + (idx === 0 ? ' checked' : '') + '>' +
            '<span class="set-check"></span>' +
            '<span class="set-info">' +
              '<span class="set-name">' + escapeHtml(s.label || s.id) + '</span>' +
              '<span class="set-desc">' + escapeHtml(s.desc || '') + '</span>' +
            '</span>';
          choicesWrap.appendChild(card);
        });
      } else if (selectElem) {
        selectElem.innerHTML = '';
        cfg.SETS.forEach(function (s) {
          const opt = document.createElement('option');
          opt.value = s.id; opt.textContent = s.label || s.id;
          selectElem.appendChild(opt);
        });
      }
    }

    $('#start-btn').addEventListener('click', function () {
      const first = $('#first-name').value.trim();
      const last = $('#last-name').value.trim();
      const consent = $('#consent').checked;
      const err = $('#start-error');

      if (!first || !last) { showError(err, 'กรอกชื่อและนามสกุลให้ครบก่อนเริ่มทำข้อสอบ'); return; }
      if (!consent) { showError(err, 'กรุณายอมรับการเก็บข้อมูลเพื่อดำเนินการต่อ'); return; }

      let set;
      if (cfg.RANDOM_SET) {
        set = cfg.SETS[Math.floor(Math.random() * cfg.SETS.length)].id;
      } else {
        const checkedRadio = $('input[name="exam_set"]:checked');
        const selectElem = $('#set-select');
        if (checkedRadio) {
          set = checkedRadio.value;
        } else if (selectElem) {
          set = selectElem.value;
        } else {
          set = cfg.SETS[0].id;
        }
      }

      sessionStorage.setItem('exam', JSON.stringify({ firstName: first, lastName: last, set: set, startedAt: Date.now() }));
      location.href = 'exam.html';
    });
  }

  /* ---------- หน้าทำข้อสอบ ---------- */
  async function initExam() {
    const data = JSON.parse(sessionStorage.getItem('exam') || 'null');
    if (!data) { location.href = 'index.html'; return; }

    $('#exam-name').textContent = data.firstName + ' ' + data.lastName;
    $('#exam-set').textContent = data.set;

    const setDef = cfg.SETS.find(function (s) { return s.id === data.set; });
    let questions;
    try {
      const text = await (await fetch(setDef.file)).text();
      questions = parseCSV(text);
    } catch (e) {
      $('#questions').innerHTML = '<p class="error-block">โหลดข้อสอบไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง</p>';
      return;
    }

    const answers = {};
    const total = questions.length;
    renderQuestions(questions, answers);
    updateProgress(answers, total);

    let timer = null;
    if (cfg.TIME_LIMIT_MIN > 0) startTimer(cfg.TIME_LIMIT_MIN, function () { doSubmit(true); });

    $('#submit-btn').addEventListener('click', function () { doSubmit(false); });

    function renderQuestions(list, answersRef) {
      const wrap = $('#questions');
      wrap.innerHTML = '';
      list.forEach(function (q) {
        const no = q.No;
        const card = document.createElement('section');
        card.className = 'q-card';
        card.id = 'q-' + no;

        let opts = '';
        ['A', 'B', 'C', 'D'].forEach(function (letter) {
          const id = 'q' + no + letter;
          opts +=
            '<label class="opt" for="' + id + '">' +
              '<input type="radio" id="' + id + '" name="q' + no + '" value="' + letter + '">' +
              '<span class="opt-letter">' + letter + '</span>' +
              '<span class="opt-text">' + escapeHtml(q[letter]) + '</span>' +
            '</label>';
        });

        card.innerHTML =
          '<div class="q-head"><span class="q-no">' + escapeHtml(no) + '</span>' +
          '<p class="q-text">' + escapeHtml(q.Question) + '</p></div>' +
          '<div class="opts">' + opts + '</div>';
        wrap.appendChild(card);
      });

      wrap.addEventListener('change', function (e) {
        if (e.target && e.target.name && e.target.name.charAt(0) === 'q') {
          const no = e.target.name.slice(1);
          answersRef[no] = e.target.value;
          const card = $('#q-' + no);
          if (card) card.classList.remove('unanswered');
          updateProgress(answersRef, total);
        }
      });
    }

    function updateProgress(answersRef, totalN) {
      const done = Object.keys(answersRef).length;
      const pct = Math.round((done / totalN) * 100);
      $('#progress-bar').style.width = pct + '%';
      $('#progress-text').textContent = 'ตอบแล้ว ' + done + ' / ' + totalN + ' ข้อ';
    }

    async function doSubmit(auto) {
      const done = Object.keys(answers).length;
      const err = $('#exam-error');

      if (!auto) {
        if (done < total) {
          const firstUnanswered = questions.find(function (q) { return !answers[q.No]; });
          $all('.q-card').forEach(function (c) {
            const n = c.id.slice(2);
            if (!answers[n]) c.classList.add('unanswered');
          });

          if (cfg.REQUIRE_ALL_ANSWERED) {
            if (firstUnanswered) {
              const card = $('#q-' + firstUnanswered.No);
              showError(err, 'ยังตอบไม่ครบ เหลืออีก ' + (total - done) + ' ข้อ');
              if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          } else {
            // REQUIRE_ALL_ANSWERED = false: แจ้งเตือนข้อที่ยังไม่ได้ตอบ และถามยืนยันก่อนส่ง
            const msg = '⚠️ แจ้งเตือน: คุณยังตอบข้อสอบไม่ครบ!\n\n' +
                        '• ตอบแล้ว: ' + done + ' จาก ' + total + ' ข้อ\n' +
                        '• ยังไม่ได้ตอบ: ' + (total - done) + ' ข้อ\n\n' +
                        'คุณแน่ใจหรือไม่ว่าต้องการส่งคำตอบทันที (ข้อที่ข้ามไปจะไม่ได้คะแนน)?';
            if (!window.confirm(msg)) {
              showError(err, 'ยังตอบไม่ครบ เหลืออีก ' + (total - done) + ' ข้อ (ระบบไฮไลต์ข้อที่ข้ามด้วยกรอบสีแดงแล้ว)');
              if (firstUnanswered) {
                const card = $('#q-' + firstUnanswered.No);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              return;
            }
          }
        } else {
          // ตอบครบทุกข้อแล้ว: ถามยืนยันเพื่อความมั่นใจก่อนส่ง
          if (!window.confirm('✨ คุณตอบครบทั้ง ' + total + ' ข้อเรียบร้อยแล้ว\n\nยืนยันการส่งคำตอบหรือไม่?')) {
            return;
          }
        }
      }

      const btn = $('#submit-btn');
      btn.disabled = true;
      btn.textContent = auto ? 'หมดเวลา กำลังส่ง...' : 'กำลังส่งคำตอบ...';
      hideError(err);

      const durationSec = Math.round((Date.now() - (data.startedAt || Date.now())) / 1000);
      try {
        const resp = await postJSON(cfg.API_URL, {
          action: 'submit',
          firstName: data.firstName,
          lastName: data.lastName,
          set: data.set,
          answers: answers,
          durationSec: durationSec
        });
        if (resp.status === 'ok') {
          sessionStorage.removeItem('exam');
          location.href = 'done.html';
        } else {
          throw new Error(resp.message || 'server error');
        }
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'ส่งคำตอบ';
        showError(err, 'ส่งคำตอบไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
      }
    }

    function startTimer(minutes, onEnd) {
      const box = $('#timer'); box.hidden = false;
      let remaining = minutes * 60;
      const tick = function () {
        const m = Math.floor(remaining / 60), s = remaining % 60;
        box.textContent = 'เวลาที่เหลือ ' + m + ':' + (s < 10 ? '0' : '') + s;
        if (remaining <= 0) { clearInterval(timer); onEnd(); return; }
        remaining--;
      };
      tick();
      timer = setInterval(tick, 1000);
    }
  }

  function showError(el, msg) { el.textContent = msg; el.hidden = false; }
  function hideError(el) { el.hidden = true; }
})();
