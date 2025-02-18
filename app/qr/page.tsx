'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

import { useQr } from '@/app/qr/hooks/useQr';

import ProtectedRoute from '@/components/func/ProtectedRoute';

const QRPage = () => {
  const [qrValue, setQrValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const queryClient = useQueryClient();

  const { qrCode, isLoading } = useQr();

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
      <div className="p-4 space-y-6">
        <h2 className="text-2xl font-bold mb-4">QR Code</h2>
        <div className="bg-background p-6 rounded-lg shadow-md flex flex-col items-center">
          {isExpired ? (
            <div className="text-center">
              <p className="text-xl mb-4">QR code expired</p>
              <button
                onClick={regenerateQR}
                className="bg-primary text-background px-4 py-2 rounded flex items-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Regenerate QR
              </button>
            </div>
          ) : (
            <>
              <QRCode value={qrValue} size={200} />
              <p className="mt-4 text-lg font-semibold">Time remaining: {timeLeft}s</p>
            </>
          )}
        </div>
        {/* <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Purchase History</h3>
          <div className="space-y-4">
            <div className="bg-background p-4 rounded-lg shadow-md">
              <p className="font-semibold">Brew Haven</p>
              <p className="text-sm text-gray-600">June 15, 2023 - 2:30 PM</p>
              <p className="text-sm">Espresso (1)</p>
            </div>
            <div className="bg-background p-4 rounded-lg shadow-md">
              <p className="font-semibold">Brew Haven</p>
              <p className="text-sm text-gray-600">June 15, 2023 - 2:30 PM</p>
              <p className="text-sm">Espresso (1)</p>
            </div>
          </div>
        </div> */}
      </div>
    </ProtectedRoute>
  );
};

export default QRPage;
