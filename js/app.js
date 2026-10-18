// Общи помощни функции: хедър/футър, любими, карти на обяви, форми.
const SITE = { name: 'Exclusive Auto Trade', phone: '+359 888 000 000', email: 'office@exclusive-auto.bg', address: 'гр. София, бул. „Примерен“ 1' };

// Обявите идват от админ панела (localStorage); ако няма такива – от js/data.js
const CARS_KEY = 'eat_cars';
const ALL_CARS = (() => {
  try { const v = JSON.parse(localStorage.getItem(CARS_KEY)); if (Array.isArray(v)) return v; } catch { /* ignore */ }
  return DEFAULT_CARS;
})();
const CARS = ALL_CARS.filter(c => !c.hidden);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
const num = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
};
const favs = {
  list: () => store.get('eat_favs', []),
  has(id) { return this.list().includes(id); },
  toggle(id) {
    const l = this.list(), i = l.indexOf(id);
    i >= 0 ? l.splice(i, 1) : l.push(id);
    store.set('eat_favs', l);
    updateFavCount();
    return i < 0;
  }
};
function updateFavCount() {
  $$('[data-fav-count]').forEach(e => { const n = favs.list().length; e.textContent = n; e.hidden = !n; });
}

// Стилизирана илюстрация на автомобил (заместител на снимки)
function carSVG(car, big = false) {
  const suv = ['SUV'].includes(car.body), hatch = ['Хечбек', 'Комби'].includes(car.body), coupe = car.body === 'Купе';
  const roof = suv || car.body === 'Комби'
    ? 'L88 112 Q96 98 120 96 L250 96 Q276 98 292 114 L318 130'
    : hatch ? 'L100 112 Q108 98 130 96 L230 96 Q256 98 276 118 L312 130'
    : coupe ? 'L120 114 Q134 98 160 96 L220 96 Q250 100 276 122 L318 132'
    : 'L118 112 Q130 98 154 96 L224 96 Q252 100 272 120 L316 132';
  const id = 'g' + car.id + (big ? 'b' : '');
  return `<svg viewBox="0 0 400 220" role="img" aria-label="${car.brand} ${car.model}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${car.hex}"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".9" r=".7"><stop offset="0" stop-color="#d4af6a" stop-opacity=".28"/><stop offset="1" stop-color="#d4af6a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="400" height="220" fill="url(#${id}s)"/>
  <ellipse cx="200" cy="188" rx="150" ry="10" fill="#000" opacity=".5"/>
  <path d="M40 150 Q40 128 66 126 ${roof} L350 134 Q364 142 362 156 L362 168 L40 168 Z" fill="url(#${id})" stroke="#d4af6a" stroke-opacity=".55" stroke-width="1.4"/>
  <path d="M112 118 L130 104 Q138 100 150 100 L196 100 L196 124 Z M204 100 L226 100 Q246 102 262 122 L204 124 Z" fill="#0b0b0c" opacity=".8" stroke="#d4af6a" stroke-opacity=".35"/>
  <g fill="#0b0b0c" stroke="#d4af6a" stroke-width="2"><circle cx="110" cy="168" r="22"/><circle cx="296" cy="168" r="22"/></g>
  <g fill="#d4af6a" opacity=".85"><circle cx="110" cy="168" r="8"/><circle cx="296" cy="168" r="8"/></g>
  <rect x="352" y="144" width="12" height="6" rx="2" fill="#f3dca0"/>
</svg>`;
}

// Първа снимка на обявата или илюстрация, ако няма качени
function carImg(c, big = false) {
  return c.imgs && c.imgs.length ? `<img src="${c.imgs[0]}" alt="${c.brand} ${c.model}" loading="lazy">` : carSVG(c, big);
}

function cardHTML(c) {
  const on = favs.has(c.id);
  return `<article class="car-card">
    <a class="car-img" href="car.html?id=${c.id}">${carImg(c)}${c.tag ? `<span class="badge">${c.tag}</span>` : ''}</a>
    <button class="fav${on ? ' on' : ''}" data-fav="${c.id}" aria-label="Любими" aria-pressed="${on}">♥</button>
    <div class="car-body">
      <h3><a href="car.html?id=${c.id}">${c.brand} ${c.model}</a></h3>
      <ul class="meta"><li>${c.year}</li><li>${num(c.km)} км</li><li>${c.fuel}</li><li>${c.gearbox}</li></ul>
      <div class="car-foot"><strong class="price">${money(c.price)}</strong><a class="link" href="car.html?id=${c.id}">Детайли →</a></div>
    </div>
  </article>`;
}

// Делегиран клик за любими във всички списъци
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  const on = favs.toggle(+b.dataset.fav);
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on);
  document.dispatchEvent(new CustomEvent('favchange'));
});

const NAV = [['index.html', 'Начало'], ['cars.html', 'Автомобили'], ['finance.html', 'Лизинг и кредит'], ['sell.html', 'Изкупуване'], ['contact.html', 'Контакти']];

function layout() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const links = NAV.map(([h, t]) => `<a href="${h}"${h === page || (page === 'car.html' && h === 'cars.html') ? ' class="active"' : ''}>${t}</a>`).join('');
  $('#site-header').innerHTML = `
  <div class="topbar"><div class="wrap">
    <span>Пон–Съб: 09:00 – 18:30</span>
    <span><a href="tel:${SITE.phone.replace(/\s/g, '')}">${SITE.phone}</a> · <a href="mailto:${SITE.email}">${SITE.email}</a></span>
  </div></div>
  <div class="mainbar"><div class="wrap">
    <a class="brand" href="index.html"><img src="assets/logo.jpg" alt="${SITE.name}"></a>
    <nav id="nav">${links}</nav>
    <a class="fav-link" href="cars.html?fav=1" aria-label="Любими">♥<b data-fav-count hidden>0</b></a>
    <button class="burger" aria-label="Меню" aria-expanded="false">☰</button>
  </div></div>`;
  $('#site-footer').innerHTML = `
  <div class="wrap grid">
    <div><img class="flogo" src="assets/logo.jpg" alt="${SITE.name}"><p>Селектирани автомобили с проверена история, прозрачни цени и пълна подкрепа при покупка, лизинг и изкупуване.</p></div>
    <div><h4>Навигация</h4>${links}</div>
    <div><h4>Контакти</h4><p>${SITE.address}<br><a href="tel:${SITE.phone.replace(/\s/g, '')}">${SITE.phone}</a><br><a href="mailto:${SITE.email}">${SITE.email}</a></p></div>
    <div><h4>Работно време</h4><p>Понеделник – Събота<br>09:00 – 18:30<br>Неделя – почивен ден</p></div>
  </div>
  <div class="copy wrap">© ${new Date().getFullYear()} ${SITE.name}. Всички права запазени. · <a href="admin.html">Админ</a></div>`;
  $('.burger').addEventListener('click', e => {
    const o = $('#nav').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', o);
  });
  updateFavCount();
}

// Форми без бекенд: показват потвърждение. Свържете с вашия имейл/CRM услуга.
function wireForms() {
  $$('form[data-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('.form-ok', f.parentElement) || $('.form-ok');
    f.hidden = true;
    if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }));
}

document.addEventListener('DOMContentLoaded', () => { layout(); wireForms(); });
