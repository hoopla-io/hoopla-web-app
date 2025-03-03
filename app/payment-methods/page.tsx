'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import PaymentApi from '@/lib/domains/payment';

import { usePaymentSystems } from '@/app/payment-methods/hooks/usePaymentSystems';

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^[0-9]+$/, 'Must be a valid number'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentSystemsPage() {
  const [selectedSystem, setSelectedSystem] = useState<PaymentSystem | null>(null);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const { paymentSystems, isLoading, isError, error } = usePaymentSystems();

  const searchParams = useSearchParams();
  const amountFromQuery = searchParams.get('amount') || '';

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: amountFromQuery },
  });

  const handlePaymentSystemClick = (system: PaymentSystem) => {
    setSelectedSystem(system);
    setIsPaymentDrawerOpen(true);
    form.reset();
  };

  const handleAmountSubmit = async (values: PaymentFormValues) => {
    try {
      const data = await PaymentApi.topUpViaPaymentSystem(
        selectedSystem?.id || 0,
        Number(values.amount),
      );
      setCheckoutUrl(data.checkoutUrl);
      setIsPaymentDrawerOpen(false);
      setIsCheckoutDrawerOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Payment Systems</h1>
      {Boolean(amountFromQuery) && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Choose a Payment System</AlertTitle>
            <AlertDescription>
              To continue, you must top up your account with this amount: {amountFromQuery}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paymentSystems.map(system => (
          <div
            key={system.id}
            className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePaymentSystemClick(system)}
          >
            <Image
              src={system.logoUrl || '/placeholder.svg'}
              alt={system.name}
              width={100}
              height={100}
              className="mb-2 object-contain"
            />
            <h2 className="text-lg font-semibold">{system.name}</h2>
          </div>
        ))}
      </div>

      {/* Payment Drawer */}
      <Drawer open={isPaymentDrawerOpen} onOpenChange={setIsPaymentDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Enter Payment Amount</DrawerTitle>
            <DrawerDescription>
              Please enter the amount you wish to pay using {selectedSystem?.name}.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAmountSubmit)} className="p-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter amount" className="py-8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DrawerFooter className="px-0">
                <Button type="submit" className="text-white w-full py-6">
                  Proceed to Payment
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>

      {/* Checkout Drawer */}
      <Drawer open={isCheckoutDrawerOpen} onOpenChange={setIsCheckoutDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Payment Checkout</DrawerTitle>
            <DrawerDescription>Scan the QR code or pay via the website.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            {checkoutUrl && (
              <QRCode value={checkoutUrl} size={180} className="border p-2 bg-white" />
            )}
            <Button asChild>
              <Link
                href={checkoutUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white"
              >
                Pay via Website
              </Link>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
