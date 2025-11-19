async function loadData() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    updateOverall(data);
    updatePhaseCards(data);
  } catch (e) {
    console.error('Failed to load data.json', e);
  }
}

function pct(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

function formatUSD(amount) {
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function updateOverall(data) {
  const overall = data.overall || {};
  const raised = overall.raised || 0;
  const goal = overall.goal || 0;
  const donors = overall.donors || 0;

  const raisedEl = document.getElementById('overall-raised');
  const goalEl = document.getElementById('overall-goal');
  const donorsEl = document.getElementById('overall-donors');
  const progressEl = document.getElementById('overall-progress');

  if (!raisedEl) return; // not on this page

  raisedEl.textContent = formatUSD(raised);
  goalEl.textContent = formatUSD(goal);
  donorsEl.textContent = donors + ' supporters';
  progressEl.style.width = pct(raised, goal) + '%';
}

function updatePhaseCards(data) {
  const phases = data.phases || {};
  const phaseOrder = ['education1', 'education2', 'education3', 'mother2025', 'mother2026'];

  // determine completed status
  const completed = {};
  phaseOrder.forEach(key => {
    const p = phases[key];
    if (p && p.raised >= p.goal) completed[key] = true;
  });

  const lockRules = {
    education1: null,
    education2: 'education1',
    education3: 'education2',
    mother2025: null,
    mother2026: 'mother2025'
  };

  phaseOrder.forEach(key => {
    const card = document.querySelector(`[data-phase="${key}"]`);
    if (!card) return;
    const p = phases[key] || {};
    const goal = p.goal || 0;
    const raised = p.raised || 0;
    const prc = pct(raised, goal);

    const fill = card.querySelector('.card-progress-fill');
    const label = card.querySelector('.card-progress-label span:nth-child(1)');
    const status = card.querySelector('.card-progress-label span:nth-child(2)');
    const meta = card.querySelector('.card-meta');
    const lockBadge = card.querySelector('.card-lock');

    if (fill) fill.style.width = prc + '%';
    if (label) label.textContent = `${formatUSD(raised)} / ${formatUSD(goal)}`;
    if (status) status.textContent = prc + '%';

    if (meta) {
      meta.textContent = (p.donors || 0) + ' supporters';
    }

    const prev = lockRules[key];
    const isLocked = prev && !completed[prev];

    if (isLocked) {
      card.classList.add('card-locked');
      if (lockBadge) {
        lockBadge.innerHTML = '🔒 Locked<br><span style="font-size:11px;color:#9ca3af">Opens when ' +
          (phases[prev]?.name || prev) + ' is 100% funded</span>';
      }
      card.onclick = e => e.preventDefault();
    } else {
      card.classList.remove('card-locked');
      if (lockBadge) {
        lockBadge.textContent = completed[key] ? '✅ Funded' : '🟢 Open';
      }
    }
  });
}

/* Form logic – build mailto link */

function setupForm() {
  const form = document.getElementById('support-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();
    const country = form.elements['country'].value.trim();
    const message = form.elements['message'].value.trim();
    const rawAmount = form.elements['custom-amount'].value.trim();

    const chosen = [];
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) chosen.push(cb.value);
    });

    const amount = rawAmount ? rawAmount : 'To be agreed';

    let body = '';
    body += `Name: ${name || '-'}\n`;
    body += `Email: ${email || '-'}\n`;
    body += `Country/City: ${country || '-'}\n`;
    body += `Chosen services/donation:\n`;
    chosen.forEach(item => (body += ` - ${item}\n`));
    body += `\nPlanned amount: ${amount}\n\n`;
    body += `Message:\n${message || '-'}\n`;

    const mail = encodeURIComponent(body);
    const subject = encodeURIComponent('Support for Education & Mother\'s Insurance');

    window.location.href = `mailto:farsoun@icloud.com?subject=${subject}&body=${mail}`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupForm();
});
