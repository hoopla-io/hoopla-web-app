'use client';

import { useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';

export function InputOTPBase() {
  const [value, setValue] = useState('');
  return (
    <InputOTP
      maxLength={5}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      value={value}
      onChange={setValue}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
      </InputOTPGroup>
    </InputOTP>
  );
}
