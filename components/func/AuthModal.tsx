'use client';

import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { PhoneInput } from '@/components/base/phone-input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';

import { useAuth } from '@/app/context/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login, confirmCode } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { sessionId } = await login(phoneNumber);
      setSessionId(sessionId);
    } catch {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    setError(null);
    setIsLoading(true);

    try {
      await confirmCode(sessionId, Number(code));
      onSuccess?.();
      onClose();
    } catch {
      setError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!sessionId) return;

    setError(null);
    setIsLoading(true);

    console.log('This is not working yet');

    // try {
    //   await resendSms(sessionId);
    // } catch (err) {
    //   setError("Failed to resend code");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-51 flex items-center justify-center">
        <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
          <h2 className="text-2xl font-bold mb-4">
            {sessionId ? 'Enter Verification Code' : 'Enter Phone Number'}
          </h2>

          {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">{error}</div>}

          {!sessionId ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <PhoneInput
                  type="tel"
                  placeholder="Phone Number"
                  defaultCountry="UZ"
                  countries={['UZ']}
                  onChange={e => {
                    const phone = e.replace(/\+/g, '');
                    setPhoneNumber(phone);
                  }}
                  required
                />
              </div>
              <Button type="submit" className="w-full text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Send Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={5}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  value={code}
                  onChange={setCode}
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
              <Button type="submit" className="w-full text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Verify'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                Resend Code
              </Button>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}
