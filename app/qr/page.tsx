'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import QRCode from 'react-qr-code';

import { format } from 'date-fns';

import { useQr } from '@/app/qr/hooks/useQr';

import ProtectedRoute from '@/components/func/ProtectedRoute';

const QRPage = () => {
  const [qrValue, setQrValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const queryClient = useQueryClient();

  const { qrCode, isLoading, orders } = useQr();

  const generateQR = () => {
    if (!qrCode) return;

    setQrValue(qrCode.qrCode);
    const timeDifference = (qrCode.expireAt - new Date().getTime() / 1000) << 0;
    setTimeLeft(timeDifference);
    setIsExpired(false);
  };

  const regenerateQR = () => {
    queryClient.refetchQueries({
      queryKey: ['qr'],
    });
  };

  useEffect(() => {
    generateQR();
  }, [qrCode]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsExpired(true);
    }
  }, [timeLeft]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 space-y-6">
        <div className="bg-background p-8 rounded-lg shadow-md flex flex-col items-center">
          {isExpired ? (
            <div className="text-center">
              <p className="text-xl mb-6 font-semibold">QR code expired</p>
              <div className="relative overflow-hidden rounded-md">
                <QRCode
                  value={'Regenerate qr code, bro)'}
                  size={200}
                  className="p-2 blur-sm opacity-50"
                />
                <button
                  onClick={regenerateQR}
                  className="w-full h-full text-primary p-4 rounded-md flex items-center justify-center absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <RotateCw size={80} />
                </button>
              </div>
            </div>
          ) : (
            <Fragment>
              <QRCode value={qrValue} size={200} />
              <p className="mt-4 text-lg font-semibold">Time remaining: {timeLeft}s</p>
            </Fragment>
          )}
        </div>
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
