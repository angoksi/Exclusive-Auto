import type { Metadata } from 'next';
import { Clock, Mail, Phone } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';
import { PageHero } from '@/components/page-hero';
import { getUser } from '@/lib/auth';
import { getSiteInfo, telHref } from '@/lib/site';

export const metadata: Metadata = { title: 'Контакти', description: 'Свържете се с екипа на EXCLUSIVE AUTO TRADE — телефон, имейл, адрес и форма за запитване.', alternates: { canonical: '/contact' } };

export default async function Contact() {
  const [user, site] = await Promise.all([getUser(), getSiteInfo()]);
  const items = [
    [Phone, 'Телефон', site.phone, telHref(site.phone)],
    ...(site.phone2 ? [[Phone, 'Втори телефон', site.phone2, telHref(site.phone2)]] : []),
    ...(site.email ? [[Mail, 'Имейл', site.email, `mailto:${site.email}`]] : []),
    [Clock, 'Работно време', site.hours, null],
  ] as [typeof Phone, string, string, string | null][];
  return (
    <>
      <PageHero eyebrow="Контакти" title="Нека поговорим за вашия автомобил" text="Отговаряме в рамките на работния ден." />
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_1.2fr]">
        <ul className="space-y-4">
          {items.map(([Icon, l, v, href]) => (
            <li key={l} className="card flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-md bg-copper-100 text-copper-700"><Icon className="size-5" /></span><div><p className="text-xs text-muted">{l}</p>{href ? <a href={href} className="font-bold text-navy-900 hover:text-copper-700">{v}</a> : <p className="font-bold text-navy-900">{v}</p>}</div></li>
          ))}
        </ul>
        <div className="card p-7"><h2 className="mb-5 text-xl">Изпратете запитване</h2><InquiryForm type="CONTACT" user={user} /></div>
      </div>
    </>
  );
}
