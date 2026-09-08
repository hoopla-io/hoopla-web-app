import { Loader2, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/func/PhoneInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth.context";
import type { OTPChannel } from "@/api/domains/auth";

const buildPhoneSchema = (t: TFunction) =>
  z.object({
    phoneNumber: z.string().min(9, t("loginForm.invalidPhoneNumber")),
  });

const buildCodeSchema = (t: TFunction) =>
  z.object({
    code: z
      .string()
      .length(6, t("loginForm.codeMustBe6Digits"))
      .regex(/^\d+$/, t("loginForm.codeMustBeDigitsOnly")),
  });

type Props = {
  /** Called after a successful code confirmation (e.g. to navigate). */
  onSuccess?: () => void;
};

export const LoginForm: FC<Props> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [channel, setChannel] = useState<OTPChannel | null>(null);
  const { login, confirmCode } = useAuth();
  const codeSectionRef = useRef<HTMLDivElement>(null);

  const phoneSchema = useMemo(() => buildPhoneSchema(t), [t]);
  const codeSchema = useMemo(() => buildCodeSchema(t), [t]);

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });
  const codeForm = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  // When the code step appears, bring it into view within the sheet so the
  // input isn't left hidden below the keyboard / bottom edge.
  useEffect(() => {
    if (!sessionId) return;
    const id = requestAnimationFrame(() =>
      codeSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    );
    return () => cancelAnimationFrame(id);
  }, [sessionId]);

  const onPhoneSubmit = async (
    data: { phoneNumber: string },
    selectedChannel: OTPChannel
  ) => {
    setChannel(selectedChannel);
    try {
      const cleaned = data.phoneNumber.replace(/\+/g, "");
      const { sessionId } = await login(cleaned, selectedChannel);
      setSessionId(sessionId);
    } catch {
      setChannel(null);
      toast.error(
        t("loginForm.couldNotSendCode", {
          channel:
            selectedChannel === "sms"
              ? t("loginForm.sms")
              : t("loginForm.telegram"),
        })
      );
    }
  };

  const requestCode = (selectedChannel: OTPChannel) => {
    void phoneForm.handleSubmit((data) =>
      onPhoneSubmit(data, selectedChannel)
    )();
  };

  const onCodeSubmit = async (data: { code: string }) => {
    try {
      await confirmCode(sessionId!, Number(data.code));
      onSuccess?.();
    } catch {
      toast.error(t("loginForm.invalidVerificationCode"));
    }
  };

  return (
    <>
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("loginForm.signIn")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {sessionId
            ? t("loginForm.enterCode", {
                channel:
                  channel === "telegram"
                    ? t("loginForm.telegram")
                    : t("loginForm.sms"),
              })
            : t("loginForm.enterPhoneNumber")}
        </p>
      </div>

      <div className="h-px bg-gray-100 mx-6" />

      <div className="p-6 space-y-5">
        {!sessionId ? (
          /* Step 1 — Phone Number */
          <Form {...phoneForm}>
            <form
              onSubmit={(event) => event.preventDefault()}
              className="space-y-4"
            >
              <FormField
                control={phoneForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-gray-700">
                      {t("loginForm.phoneNumber")}
                    </label>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        placeholder={t("loginForm.phoneNumber")}
                        countries={["UZ"]}
                        defaultCountry="UZ"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  value="sms"
                  className="h-12 text-base font-medium text-white rounded-xl"
                  disabled={phoneForm.formState.isSubmitting}
                  onClick={() => requestCode("sms")}
                >
                  {phoneForm.formState.isSubmitting && channel === "sms" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <MessageSquareText size={18} />
                      {t("loginForm.sms")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  value="telegram"
                  className="h-12 text-base font-medium text-white rounded-xl"
                  disabled={phoneForm.formState.isSubmitting}
                  onClick={() => requestCode("telegram")}
                >
                  {phoneForm.formState.isSubmitting && channel === "telegram" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {t("loginForm.telegram")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          /* Step 2 — Verification Code (phone field hidden to free space) */
          <div ref={codeSectionRef}>
            <Form {...codeForm}>
              <form
                onSubmit={codeForm.handleSubmit(onCodeSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-medium text-gray-700">
                        {t("loginForm.verificationCodeLabel")}
                      </label>
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          type="tel"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          className="h-12 rounded-xl text-base px-4 tracking-[0.3em] text-center font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                      <button
                        type="button"
                        onClick={() => {
                          setSessionId(null);
                          setChannel(null);
                          codeForm.reset();
                        }}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {t("loginForm.changeNumber")}
                      </button>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium text-white rounded-xl"
                  disabled={codeForm.formState.isSubmitting}
                >
                  {codeForm.formState.isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      {t("loginForm.verify")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </>
  );
};
