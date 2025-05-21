'use client';

import { Coffee, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

import { useQr } from '@/app/qr/hooks/useQr';

import ProtectedRoute from '@/components/func/ProtectedRoute';

const QRPage = () => {
  const [qrValue, setQrValue] = useState('');

  const { qrCode, orders } = useQr();

  const generateQR = () => {
    if (!qrCode) return;

    setQrValue(qrCode.qrCode);
  };

  useEffect(() => {
    generateQR();
  }, [qrCode]);

  if (!qrCode) {
    return <p>Loading...</p>;
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 space-y-4">
        <div className="bg-background p-4 rounded-lg shadow-md flex items-center justify-between">
          <div className="w-1/2 mr-4 border-2 border-x-slate-700/10 p-6 rounded-md">
            <div>Subscription:</div>
            <p className="font-bold text-3xl">Rootine</p>
            <Separator className="my-2 w-full" />
            <div className="text-md">Active until:</div>
            <p className="font-bold text-xl">{format(qrCode.expireAt * 1000, 'dd.MM.yyyy')}</p>
          </div>
          <QRCode value={qrValue} size={200} />
        </div>
        <CoffeeStatusSection dailyLimit={1} drankCoffees={1} />
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Purchase History</h3>
          <div className="space-y-4">
            {orders?.map(order => (
              <div key={order.id} className="bg-background p-4 rounded-lg shadow-md">
                <p className="font-semibold">{order.partnerName}</p>
                <p className="text-sm text-gray-600">
                  {format(order.purchasedAtUnix * 1000, 'HH:mm:ss, dd.MM.yyyy')}
                </p>
                <p className="text-sm">{order.shopName}</p>
              </div>
            ))}

            {orders?.length === 0 && <p className="text-sm text-gray-600">No orders found</p>}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default QRPage;

type CoffeeStatusProps = {
  dailyLimit: number;
  drankCoffees: number;
};

export function CoffeeStatusSection({ dailyLimit, drankCoffees }: CoffeeStatusProps) {
  const percentage = Math.min((drankCoffees / dailyLimit) * 100, 100);
  const remaining = Math.max(dailyLimit - drankCoffees, 0);
  const dailyLimitReached = drankCoffees >= dailyLimit;

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-brown-600" />
            Daily Coffee Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{drankCoffees} drank</span>
            <span>{remaining} left</span>
          </div>
          <Progress value={percentage} />
        </CardContent>
      </Card>

      {dailyLimitReached && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Daily Limit Reached</AlertTitle>
          <AlertDescription>
            You've already had {dailyLimit} cups today. Time to chill ☕
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
