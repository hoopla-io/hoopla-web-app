'use client';

import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useRouter, useSearchParams } from 'next/navigation';

import { PhoneInput } from '@/components/base/phone-input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import * as z from 'zod';

import { useAuth } from '@/context/auth-context';

const phoneSchema = z.object({
  phoneNumber: z.string().min(9, 'Invalid phone number'),
});

const codeSchema = z.object({
  code: z.string().length(5, 'Code must be 5 digits'),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function PhoneForm({ onSuccess }: { onSuccess: (sessionId: string) => void }) {
  const { login } = useAuth();
  const form = useForm({ resolver: zodResolver(phoneSchema) });

  const onSubmit = async (data: { phoneNumber: string }) => {
    try {
      const sterilizedPhoneNumber = data.phoneNumber.replace(/\+/g, '');
      const { sessionId } = await login(sterilizedPhoneNumber);
      onSuccess(sessionId);
    } catch {
      toast.error('Invalid phone number');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PhoneInput
                  {...field}
                  placeholder="Phone Number"
                  countries={['UZ']}
                  defaultCountry="UZ"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-white" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            'Send Code'
          )}
        </Button>
      </form>
    </Form>
  );
}

function CodeForm({ sessionId, onSuccess }: { sessionId: string; onSuccess?: () => void }) {
  const { confirmCode } = useAuth();
  const form = useForm({ resolver: zodResolver(codeSchema) });

  const onSubmit = async (data: { code: string }) => {
    try {
      await confirmCode(sessionId, Number(data.code));
      onSuccess?.();
    } catch {
      toast.error('Invalid verification code');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex justify-center">
                  <InputOTP
                    autoFocus
                    maxLength={5}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    {...field}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-white" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            'Verify'
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function Page() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const router = useRouter();

  const params = useSearchParams();
  const redirectUrl = params.get('from');

  const { isAuthenticated } = useAuth();

  const handleNavigateAfterLogin = (redirectUrl?: string | null) => {
    if (redirectUrl) {
      router.replace(redirectUrl);
    } else {
      router.replace('/profile');
    }
  };

  if (isAuthenticated) {
    handleNavigateAfterLogin(redirectUrl);
  }

  return (
    <div className="fixed inset-0 bg-black/10 z-51 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {sessionId ? 'Enter Verification Code' : 'Enter Phone Number'}
        </h2>
        {!sessionId ? (
          <PhoneForm onSuccess={setSessionId} />
        ) : (
          <CodeForm sessionId={sessionId} onSuccess={() => handleNavigateAfterLogin(redirectUrl)} />
        )}
      </div>
    </div>
  );
}
