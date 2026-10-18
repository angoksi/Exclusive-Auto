/* Демо данни. ВСИЧКИ автомобили, VIN номера, истории, отзиви и доставки са измислени и маркирани като демонстрационни. */
import 'dotenv/config';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth-hash';
import { DEFAULT_PRICING } from '../src/lib/pricing';
import { upsertNormalized } from '../src/lib/providers/sync';
import { computeCheckDigit } from '../src/lib/vin';
import type { NormalizedVehicle } from '../src/lib/providers/types';

const YEAR_CHAR = 'ABCDEFGHJKLMNPRSTVWXY123456789';
let seed = 20260101;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const day = 86400000;

function demoVin(year: number, i: number) {
  const yc = YEAR_CHAR[(year - 2010) % 30] ?? 'M';
  const body = `ZZDEMK${'ABCDEFGH'[i % 8]}${'JKLMNPRS'[(i * 3) % 8]}0${yc}D${String(100000 + i * 137).slice(-6)}`;
  return body.slice(0, 8) + computeCheckDigit(body) + body.slice(9);
}

type Row = [region: 'US' | 'CA' | 'KR', source: NormalizedVehicle['source'], make: string, model: string, trim: string, year: number, body: string, engine: string, fuel: string, trans: string, drive: string, color: string, hex: string, km: number, bid: number, buyNow: number | null, location: string, damage: string | null, runs: boolean];

const ALL_ROWS: Row[] = [
  ['US', 'COPART', 'Tesla', 'Model 3', 'Long Range', 2021, 'sedan', 'Двоен електродвигател, 75 kWh', 'Електрически', 'Автоматична', '4x4 / AWD', 'Бял', 'e9ecef', 61000, 14200, null, 'Houston, TX', 'Предна част', true],
  ['US', 'COPART', 'BMW', 'X5', 'xDrive40i', 2019, 'suv', '3.0L R6 Turbo, 335 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '16181d', 78000, 17800, null, 'Dallas, TX', 'Задна част', true],
  ['US', 'IAAI', 'Ford', 'F-150', 'Lariat SuperCrew', 2020, 'pickup', '3.5L V6 EcoBoost, 375 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Сив', '6c7078', 69000, 21500, 32900, 'Atlanta, GA', null, true],
  ['US', 'COPART', 'Mercedes-Benz', 'GLC 300', '4MATIC', 2020, 'suv', '2.0L Turbo, 255 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Сребрист', 'b7bcc4', 54000, 16300, null, 'Newark, NJ', 'Странична част', true],
  ['US', 'IAAI', 'Toyota', 'RAV4', 'Hybrid XSE', 2022, 'suv', '2.5L Hybrid, 219 к.с.', 'Хибрид', 'Автоматична', '4x4 / AWD', 'Син', '27466e', 32000, 19800, 27500, 'Chicago, IL', null, true],
  ['US', 'COPART', 'Audi', 'Q5', '45 TFSI Premium', 2021, 'suv', '2.0L TFSI, 261 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Сив', '555a63', 47000, 15900, null, 'Miami, FL', 'Вода/наводнение', false],
  ['US', 'COPART', 'Dodge', 'Charger', 'R/T Scat Pack', 2020, 'sedan', '6.4L V8 HEMI, 485 к.с.', 'Бензин', 'Автоматична', 'Задно', 'Червен', '9e1b22', 52000, 18700, null, 'Los Angeles, CA', 'Предна част', true],
  ['US', 'IAAI', 'Jeep', 'Grand Cherokee', 'Limited', 2019, 'suv', '3.6L V6, 295 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Бял', 'eceae5', 88000, 11400, 16900, 'Phoenix, AZ', null, true],
  ['US', 'COPART', 'Chevrolet', 'Camaro', 'SS', 2018, 'coupe', '6.2L V8, 455 к.с.', 'Бензин', 'Ръчна', 'Задно', 'Черен', '15161a', 59000, 17200, null, 'Charlotte, NC', 'Задна част', true],
  ['US', 'IAAI', 'Lexus', 'RX 350', 'F Sport', 2021, 'suv', '3.5L V6, 295 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Сив', '7a7f87', 41000, 22600, 31900, 'Seattle, WA', null, true],
  ['US', 'COPART', 'Porsche', 'Macan', 'S', 2019, 'suv', '3.0L V6 Turbo, 354 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Бял', 'f1f1f3', 66000, 24800, null, 'Orlando, FL', 'Предна част', true],
  ['US', 'COPART', 'Volkswagen', 'Golf GTI', 'Autobahn', 2021, 'hatch', '2.0L TSI, 241 к.с.', 'Бензин', 'Ръчна', 'Предно', 'Син', '1c3f7a', 36000, 12900, null, 'Denver, CO', 'Градушка', true],
  ['US', 'IAAI', 'Honda', 'CR-V', 'EX-L Hybrid', 2020, 'suv', '2.0L Hybrid, 212 к.с.', 'Хибрид', 'Автоматична', '4x4 / AWD', 'Сребрист', 'aeb2b8', 58000, 13700, 20900, 'Nashville, TN', null, true],
  ['US', 'COPART', 'Land Rover', 'Range Rover Sport', 'HSE', 2018, 'suv', '3.0L V6 Supercharged, 340 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '17191c', 83000, 15600, null, 'Boston, MA', 'Странична част', true],
  ['US', 'IAAI', 'Cadillac', 'Escalade', 'Premium Luxury', 2019, 'suv', '6.2L V8, 420 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '101114', 91000, 26900, null, 'Detroit, MI', 'Задна част', true],
  ['CA', 'COPART', 'Subaru', 'Outback', 'Premier XT', 2021, 'wagon', '2.4L Turbo, 260 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Зелен', '2f4a3a', 44000, 14100, null, 'Toronto, ON', 'Предна част', true],
  ['CA', 'COPART', 'Ford', 'Mustang', 'GT Premium', 2019, 'coupe', '5.0L V8, 460 к.с.', 'Бензин', 'Автоматична', 'Задно', 'Червен', 'a3141c', 47000, 19400, null, 'Calgary, AB', 'Странична част', true],
  ['CA', 'IAAI', 'Toyota', 'Highlander', 'Hybrid XLE', 2021, 'suv', '2.5L Hybrid, 243 к.с.', 'Хибрид', 'Автоматична', '4x4 / AWD', 'Сив', '5d6068', 52000, 21800, 29900, 'Vancouver, BC', null, true],
  ['CA', 'COPART', 'Hyundai', 'Tucson', 'Preferred', 2022, 'suv', '2.5L, 187 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Бял', 'ededee', 26000, 14900, null, 'Montreal, QC', 'Задна част', true],
  ['CA', 'IAAI', 'Lexus', 'NX 350h', 'Luxury', 2022, 'suv', '2.5L Hybrid, 239 к.с.', 'Хибрид', 'Автоматична', '4x4 / AWD', 'Бежов', 'c9bfae', 29000, 27900, 38500, 'Ottawa, ON', null, true],
  ['CA', 'COPART', 'Ram', '1500', 'Laramie', 2020, 'pickup', '5.7L V8 HEMI, 395 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '131417', 74000, 20300, null, 'Edmonton, AB', 'Градушка', true],
  ['CA', 'COPART', 'Mazda', 'CX-5', 'GT Turbo', 2021, 'suv', '2.5L Turbo, 256 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Червен', '8a1f25', 38000, 15200, null, 'Winnipeg, MB', 'Предна част', true],
  ['CA', 'IAAI', 'Volvo', 'XC60', 'T6 Inscription', 2020, 'suv', '2.0L T6, 310 к.с.', 'Plug-in хибрид', 'Автоматична', '4x4 / AWD', 'Сребрист', 'b4b8be', 56000, 17400, 24900, 'Halifax, NS', null, true],
  ['KR', 'ENCAR', 'Hyundai', 'Tucson', 'Inspiration', 2022, 'suv', '1.6 T-GDI, 180 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Бял', 'efefef', 28000, 0, 21500000, 'Seoul', null, true],
  ['KR', 'ENCAR', 'Kia', 'Sportage', 'Prestige', 2022, 'suv', '1.6 T-GDI, 180 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Сив', '60646c', 31000, 0, 20900000, 'Incheon', null, true],
  ['KR', 'KCAR', 'Genesis', 'GV70', '2.5T AWD', 2022, 'suv', '2.5L Turbo, 304 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '14151a', 24000, 0, 38900000, 'Seoul', null, true],
  ['KR', 'ENCAR', 'Genesis', 'G80', '3.5T Sport', 2021, 'sedan', '3.5L V6 Twin Turbo, 380 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Син', '1f2f54', 39000, 0, 44500000, 'Busan', null, true],
  ['KR', 'AUTOWINI', 'Kia', 'Carnival', 'Signature', 2022, 'van', '2.2L Diesel, 200 к.с.', 'Дизел', 'Автоматична', 'Предно', 'Бял', 'eeeeee', 36000, 0, 32800000, 'Incheon', null, true],
  ['KR', 'KCAR', 'Hyundai', 'Ioniq 5', 'Long Range AWD', 2022, 'suv', 'Двоен електродвигател, 77.4 kWh', 'Електрически', 'Автоматична', '4x4 / AWD', 'Сребрист', 'b9bdc3', 27000, 0, 36900000, 'Daegu', null, true],
  ['KR', 'ENCAR', 'Kia', 'EV6', 'GT-Line AWD', 2022, 'suv', 'Двоен електродвигател, 77.4 kWh', 'Електрически', 'Автоматична', '4x4 / AWD', 'Сив', '5c6169', 33000, 0, 37500000, 'Seoul', null, true],
  ['KR', 'AUTOWINI', 'Hyundai', 'Santa Fe', 'Calligraphy', 2021, 'suv', '2.2L Diesel, 202 к.с.', 'Дизел', 'Автоматична', '4x4 / AWD', 'Кафяв', '4a3a30', 52000, 0, 29900000, 'Incheon', null, true],
  ['KR', 'ENCAR', 'Genesis', 'G70', '2.0T Sport', 2021, 'sedan', '2.0L Turbo, 245 к.с.', 'Бензин', 'Автоматична', 'Задно', 'Червен', '8f1d24', 41000, 0, 31900000, 'Seoul', null, true],
  ['KR', 'KCAR', 'KGM', 'Torres', 'V7', 2023, 'suv', '1.5L Turbo, 170 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Зелен', '33483a', 14000, 0, 31200000, 'Pyeongtaek', null, true],
  ['KR', 'ENCAR', 'Hyundai', 'Palisade', 'Calligraphy', 2022, 'suv', '3.8L V6, 295 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Черен', '15161b', 38000, 0, 42800000, 'Busan', null, true],
  ['KR', 'AUTOWINI', 'Kia', 'K8', 'Hybrid Noblesse', 2022, 'sedan', '1.6 Turbo Hybrid, 230 к.с.', 'Хибрид', 'Автоматична', 'Предно', 'Бял', 'f0f0f1', 29000, 0, 33900000, 'Incheon', null, true],
  ['KR', 'ENCAR', 'Hyundai', 'Sonata', 'N Line', 2021, 'sedan', '2.5 T-GDI, 290 к.с.', 'Бензин', 'Автоматична', 'Предно', 'Сив', '676b73', 45000, 0, 22800000, 'Daejeon', null, true],
  ['KR', 'KCAR', 'Kia', 'Stinger', 'GT 3.3T', 2020, 'sedan', '3.3L V6 Twin Turbo, 370 к.с.', 'Бензин', 'Автоматична', '4x4 / AWD', 'Син', '233a63', 57000, 0, 33500000, 'Seoul', null, true],
  ['KR', 'AUTOWINI', 'Genesis', 'GV80', '3.0D AWD', 2021, 'suv', '3.0L Diesel, 278 к.с.', 'Дизел', 'Автоматична', '4x4 / AWD', 'Сребрист', 'aaaeb5', 49000, 0, 43900000, 'Busan', null, true],
];

const ROWS = ALL_ROWS.filter((r) => r[0] === 'KR');

const BODY_BG: Record<string, string> = { sedan: 'Седан', suv: 'SUV', hatch: 'Хечбек', wagon: 'Комби', coupe: 'Купе', pickup: 'Пикап', van: 'Ван' };
const DAMAGE_TXT: Record<string, string> = {
  'Предна част': 'Удар в предната част — повреди по броня, капак и фарове. Окачването подлежи на проверка при огледа.',
  'Задна част': 'Удар отзад — повреди по задна броня и капак на багажника.',
  'Странична част': 'Странични повреди по врати и праг. Купето е стабилно по данни на продавача.',
  'Градушка': 'Множество вдлъбнатини от градушка по покрива и капаците. Механиката е без забележки.',
  'Вода/наводнение': 'Автомобилът е бил засегнат от вода. Препоръчва се подробна инспекция на електрониката и интериора.',
};

async function main() {
  console.log('Чистене…');
  for (const m of ['notification', 'document', 'orderEvent', 'order', 'offer', 'inquiry', 'favorite', 'savedSearch', 'vehicleHistoryEvent', 'vehicleImage', 'vehicle', 'blogPost', 'faq', 'review', 'completedDelivery', 'setting', 'user'] as const) {
    await (db[m] as unknown as { deleteMany: () => Promise<unknown> }).deleteMany();
  }

  await db.setting.create({ data: { key: 'pricing', value: DEFAULT_PRICING as object } });
  await db.setting.create({ data: { key: 'site', value: { phone: '+359 896 547 850', phone2: '+359 895 948 420', email: '', hours: 'Пон–Пет: 09:00 – 18:00' } } });

  const pw = await hashPassword('Demo!12345');
  const [admin, , customer] = await Promise.all([
    db.user.create({ data: { email: 'admin@exclusive-auto.example', name: 'Администратор', role: 'ADMIN', passwordHash: pw, consentAt: new Date() } }),
    db.user.create({ data: { email: 'manager@exclusive-auto.example', name: 'Мениджър Продажби', role: 'MANAGER', passwordHash: pw, consentAt: new Date() } }),
    db.user.create({ data: { email: 'client@exclusive-auto.example', name: 'Демо Клиент', phone: '+359 88 111 2222', role: 'CUSTOMER', passwordHash: pw, consentAt: new Date() } }),
  ]);
  void admin;

  console.log('Автомобили…');
  let i = 0;
  const ids: string[] = [];
  for (const [region, source, make, model, trim, year, body, engine, fuel, trans, drive, color, hex, km, bid, buyNow, location, damage, runs] of ROWS) {
    i++;
    const isKR = region === 'KR';
    const currency = isKR ? 'KRW' : region === 'CA' ? 'CAD' : 'USD';
    const vin = demoVin(year, i);
    const saleType = i % 5 === 0 ? 'AUCTION' : 'BUY_NOW';
    const platform = { COPART: 'Copart', IAAI: 'IAAI', ENCAR: 'Encar', KCAR: 'K Car', AUTOWINI: 'Autowini', OTHER: 'Друг' }[source];
    const images = [0, 1, 2, 3].map((v) => `/api/demo-image/${body}/${hex}/${v}`);
    const v: NormalizedVehicle = {
      source, sourceId: `DEMO-${i}`, region, make, model, trim, year, vin, lotNumber: isKR ? undefined : String(40000000 + i * 8123), platform,
      saleType, currency, currentBid: saleType === 'AUCTION' ? Math.round((buyNow ?? 0) * 0.9) : undefined, buyNowPrice: buyNow ?? undefined,
      auctionDate: saleType === 'AUCTION' ? new Date(Date.now() + (2 + Math.floor(rnd() * 12)) * day) : undefined,
      location, country: isKR ? 'Южна Корея' : region === 'CA' ? 'Канада' : 'САЩ',
      odometerKm: km, engine, fuel, transmission: trans, drive, bodyType: BODY_BG[body], color,
      condition: damage ? (damage === 'Вода/наводнение' ? 'SALVAGE' : 'DAMAGED') : isKR ? 'EXCELLENT' : 'GOOD',
      primaryDamage: damage ?? undefined, secondaryDamage: damage && rnd() > 0.55 ? pick(['Леки драскотини', 'Повреден калник', 'Счупено стъкло']) : undefined,
      runsAndDrives: runs, hasKeys: rnd() > 0.1,
      description: `${year} ${make} ${model} ${trim}. ${damage ? DAMAGE_TXT[damage] : 'Автомобилът е в добро състояние, без видими структурни повреди по данни от източника.'} Това е ДЕМОНСТРАЦИОНЕН запис — данните са примерни и не отговарят на реален автомобил.`,
      features: ['Адаптивен темпомат', 'Камера за задно виждане', 'Навигация', 'Безключово отключване', fuel === 'Електрически' ? 'Бързо зареждане DC' : 'Подгряване на седалки'],
      images,
      history: [
        { date: new Date(Date.now() - 900 * day), type: 'Първа регистрация', description: `Регистриран в ${isKR ? 'Южна Корея' : region === 'CA' ? 'Канада' : 'САЩ'} (демо запис).`, odometerKm: 12, source: 'Демо данни' },
        { date: new Date(Date.now() - 420 * day), type: 'Сервизно обслужване', description: 'Планово обслужване (демо запис).', odometerKm: Math.round(km * 0.6), source: 'Демо данни' },
        ...(damage ? [{ date: new Date(Date.now() - 60 * day), type: 'Застрахователно събитие', description: `Докладвана повреда: ${damage} (демо запис).`, odometerKm: km, source: 'Демо данни' }] : []),
      ],
    };
    const id = await upsertNormalized(v, DEFAULT_PRICING, { isDemo: true });
    ids.push(id);
    if (i % 4 === 1) await db.vehicle.update({ where: { id }, data: { featured: true } });
  }
  // леко разместване на датите на добавяне
  const all = await db.vehicle.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  await Promise.all(all.map((v, n) => db.vehicle.update({ where: { id: v.id }, data: { createdAt: new Date(Date.now() - n * 7 * 3600_000) } })));

  console.log('Съдържание…');
  await db.faq.createMany({
    data: [
      ['Колко време отнема вносът?', 'Обичайно между 5 и 8 седмици от Южна Корея. Сроковете зависят от маршрута, графика на корабите и митническата обработка. Всяка поръчка получава ориентировъчна дата, която актуализираме при промяна.'],
      ['Как се формира крайната цена?', 'Цената включва стойността на автомобила, такси на платформата, транспорта до пристанище, международния транспорт, застраховката, митото, ДДС, митническите и пристанищните такси и нашата комисиона. В офертата показваме всеки компонент поотделно.'],
      ['Мога ли да огледам автомобила преди покупка?', 'Предоставяме подробен фото и видеоотчет. По желание организираме независима инспекция на място чрез партньорски сервиз.'],
      ['Фиксирана цена или търг?', 'Повечето корейски автомобили се предлагат с фиксирана цена от дилър или платформа. При търг цената зависи от наддаването — преди да наддаваме, договаряме с вас максимален таван.'],
      ['Гарантирана ли е цената в офертата?', 'Окончателната цена се потвърждава писмено в офертата, след като са известни тарифната класификация, курсовете и таксите към датата на сделката.'],
      ['Как плащам?', 'Плащането се извършва по банков път след подписване на договор. Не изискваме плащане преди да получите писмена оферта.'],
    ].map(([question, answer], position) => ({ question, answer, position })),
  });
  await db.review.createMany({
    data: [
      { author: 'Примерен клиент А.', city: 'София', text: 'Примерен отзив: ясна комуникация на всеки етап и точна разбивка на цената още преди покупката.', vehicle: 'Hyundai Ioniq 5', isDemo: true },
      { author: 'Примерен клиент Б.', city: 'Пловдив', text: 'Примерен отзив: автомобилът пристигна в обявения срок, а документите бяха подготвени без излишни грижи.', vehicle: 'Hyundai Tucson', isDemo: true },
      { author: 'Примерен клиент В.', city: 'Варна', text: 'Примерен отзив: консултантът обясни ясно разликата между фиксирана цена и търг и ми помогна да взема спокойно решение.', vehicle: 'Genesis GV70', isDemo: true },
    ],
  });
  await db.completedDelivery.createMany({
    data: [
      { title: 'Hyundai Ioniq 5', year: 2022, origin: 'KR', days: 52, city: 'София', isDemo: true, deliveredAt: new Date(Date.now() - 20 * day) },
      { title: 'Hyundai Tucson Inspiration', year: 2022, origin: 'KR', days: 44, city: 'Пловдив', isDemo: true, deliveredAt: new Date(Date.now() - 35 * day) },
      { title: 'Kia Sportage Hybrid', year: 2022, origin: 'KR', days: 47, city: 'Варна', isDemo: true, deliveredAt: new Date(Date.now() - 50 * day) },
      { title: 'Genesis GV70', year: 2022, origin: 'KR', days: 47, city: 'Бургас', isDemo: true, deliveredAt: new Date(Date.now() - 70 * day) },
    ],
  });
  await db.blogPost.createMany({
    data: [
      { slug: 'kak-se-formira-cenata-na-vnosa', title: 'Как се формира крайната цена при внос на автомобил', excerpt: 'От аукционните такси до ДДС — разбираме всеки компонент, за да няма изненади.', published: true, publishedAt: new Date(Date.now() - 12 * day), body: 'Крайната цена на внесен автомобил не е само покупната цена.\n\nПървият компонент е стойността на автомобила. Към нея се добавят аукционните такси, които зависят от платформата и от размера на офертата.\n\nСлед това следва транспортът до пристанището на заминаване и международният превоз. Тези разходи заедно със застраховката формират митническата стойност.\n\nМитото се начислява върху митническата стойност, а ДДС — върху сумата на митническата стойност и митото. Към тях се добавят митнически и пристанищни такси.\n\nВ офертата показваме всеки от тези редове поотделно, за да виждате къде отиват парите.' },
      { slug: 'proverka-na-avtomobil-ot-koreya', title: 'Как да проверим автомобил от Корея преди покупка', excerpt: 'Какво да поискаме от продавача и кои документи да сверим, преди да платим.', published: true, publishedAt: new Date(Date.now() - 25 * day), body: 'Преди покупка поискайте пълен фотоотчет, видео на двигателя и сервизна история.\n\nВ Корея за много автомобили има независими доклади за състоянието и застрахователна история — сверете ги с описанието на продавача.\n\nПроверете пробега, броя на предишните собственици и дали автомобилът е бил участник в застрахователно събитие.\n\nНакрая се уверете, че спецификацията му е подходяща за европейските изисквания.' },
      { slug: 'vnos-ot-yuzhna-koreya-predimstva', title: 'Внос от Южна Корея: предимства и особености', excerpt: 'Богато оборудвани модели, ниски пробези и преференциален режим за произход.', published: true, publishedAt: new Date(Date.now() - 40 * day), body: 'Южна Корея е интересен пазар за автомобили на Hyundai, Kia и Genesis с богата комплектация и сравнително нисък пробег.\n\nСпоразумението за свободна търговия между ЕС и Корея може да даде преференциално мито при доказан произход.\n\nПроверявайте съответствието на спецификацията с европейските изисквания — осветление, емисионен клас и допълнителна хомологация.' },
    ],
  });

  console.log('Заявки, оферти, поръчки…');
  const veh = await db.vehicle.findFirst({ where: { make: 'Hyundai' } });
  const inq = await db.inquiry.create({ data: { type: 'VEHICLE', userId: customer.id, vehicleId: veh?.id, name: customer.name, email: customer.email, phone: customer.phone, message: 'Интересувам се от доставка до София. Какъв е срокът?', consentAt: new Date(), status: 'QUOTED' } });
  await db.offer.create({ data: { inquiryId: inq.id, userId: customer.id, title: 'Hyundai Ioniq 5 — пълна доставка до София', totalEur: 24150, notes: 'Демо оферта. Включва всички такси до предаване.', validUntil: new Date(Date.now() + 7 * day), breakdown: { demo: true } } });
  const order = await db.order.create({ data: { number: 'EAT-2026-0001', userId: customer.id, vehicleTitle: 'Hyundai Tucson Inspiration 2022 (демо)', vin: demoVin(2022, 21), stage: 5, estimatedDelivery: new Date(Date.now() + 24 * day) } });
  const ev = [
    [1, 'Автомобилът е закупен', 'Seoul', 37.57, 126.98, 40],
    [2, 'Транспорт до пристанище', 'Seoul → Incheon', 37.46, 126.7, 36],
    [3, 'Приет в пристанище', 'Incheon', 37.45, 126.6, 33],
    [4, 'Натоварен на кораб', 'Incheon', 37.45, 126.6, 30],
    [5, 'Международен транспорт', 'Индийски океан', 5.5, 80.2, 8],
  ] as const;
  for (const [stage, title, location, lat, lng, ago] of ev) {
    await db.orderEvent.create({ data: { orderId: order.id, stage, title, location, lat, lng, note: stage === 5 ? 'Демо бележка: корабът е в рамките на графика.' : null, createdAt: new Date(Date.now() - ago * day) } });
  }
  await db.notification.create({ data: { userId: customer.id, title: 'Нова оферта', body: 'Получихте оферта за Hyundai Ioniq 5.', href: '/account/offers' } });
  await db.favorite.create({ data: { userId: customer.id, vehicleId: ids[0] } });
  console.log('Готово. Демо вход: client@exclusive-auto.example / Demo!12345 (admin@… и manager@… със същата парола).');
}

main().finally(() => db.$disconnect());
