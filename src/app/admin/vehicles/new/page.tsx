import { VehicleForm } from '@/components/admin/vehicle-form';

export const metadata = { title: 'Нов автомобил — админ' };

export default function NewVehicle() {
  return (<div className="space-y-6"><h1 className="text-3xl">Нов автомобил</h1><div className="card p-6"><VehicleForm /></div><p className="text-sm text-muted">Снимките и историята могат да се добавят и подреждат след първото запазване.</p></div>);
}
