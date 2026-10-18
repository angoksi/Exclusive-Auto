import { PricingForm } from '@/components/admin/pricing-form';
import { RunButton } from '@/components/admin/action-form';
import { requireRole } from '@/lib/auth';
import { getPricing } from '@/lib/pricing-server';
import { recalcPrices, resetPricing } from '@/lib/actions/admin';

export const metadata = { title: 'Цени и мито — админ' };

export default async function AdminPricing() {
  await requireRole(['ADMIN']);
  const c = await getPricing();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Цени, мито и такси</h1>
      <p className="rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900">Стойностите по подразбиране са <strong>примерни</strong>. Преди публикуване ги съгласувайте с митнически брокер, актуалния ТАРИК/митническа тарифа, условията по ССТ ЕС–Корея и таксите на платформите. Курсовете се актуализират ръчно.</p>
      <div className="card p-6"><PricingForm c={c} /></div>
      <div className="flex flex-wrap gap-3"><RunButton action={recalcPrices} label="Преизчисли цените на обявите в EUR" /><RunButton action={resetPricing} label="Върни стойностите по подразбиране" /></div>
    </div>
  );
}
