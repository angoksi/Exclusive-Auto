import { PasswordForm, ProfileForm } from '@/components/settings-forms';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteAccount } from '@/lib/actions/user';

export const metadata = { title: 'Настройки на профила' };

export default async function Settings() {
  const u = await requireUser('/account/settings');
  const row = await db.user.findUniqueOrThrow({ where: { id: u.id } });
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl">Настройки</h1>
      <ProfileForm user={{ name: row.name, email: row.email, phone: row.phone, notifyEmail: row.notifyEmail }} />
      <PasswordForm />
      <form action={deleteAccount} className="card space-y-3 p-6">
        <h2 className="text-lg">Изтриване на профила</h2>
        <p className="text-sm text-muted">Профилът и свързаните с него данни (любими, запитвания, оферти, известия) ще бъдат изтрити безвъзвратно съгласно правото ви на изтриване по GDPR.</p>
        <Button variant="danger">Изтрий профила ми</Button>
      </form>
    </div>
  );
}
