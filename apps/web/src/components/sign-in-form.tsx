import { uiMessage } from "@/lib/locale";
import { LocalizedText, LocalizedValue } from "@/components/ui/LocalizedText";
import { Button } from "@labas/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import { Input } from "@labas/ui/components/input";
import { Label } from "@labas/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { env } from "@labas/env/web";
import { trackUmamiEvent, AnalyticsEvent } from "@/lib/umami";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useState } from "react";

import Loader from "./loader";

export default function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate({
    from: "/login",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (isSignUp) {
        await authClient.signUp.email({ name: value.name, email: value.email, password: value.password }, {
          onSuccess: () => { navigate({ to: "/dashboard" }); toast.success(uiMessage("注册成功")); },
          onError: (error) => { toast.error(uiMessage(error.error.message || "注册失败")); },
        });
        return;
      }
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            trackUmamiEvent(AnalyticsEvent.SIGN_IN);
            navigate({ to: "/dashboard" });
            toast.success(uiMessage("登录成功"));
          },
          onError: (error) => {
            const msg = error.error.message || error.error.statusText;
            toast.error(uiMessage(msg || "登录失败"));
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string(),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: `${env.VITE_SITE_URL}/dashboard`,
      },
      {
        onSuccess: () => {
          trackUmamiEvent(AnalyticsEvent.SIGN_IN);
        },
      },
    );
  };

  if (isPending) {
    return <Loader />;
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-lg border-muted rounded-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight"><LocalizedValue value={isSignUp ? "创建账号" : "欢迎回来"} /></CardTitle>
        <CardDescription><LocalizedValue value={isSignUp ? "注册后开始你的语言考试练习" : "使用邮箱和密码登录"} /></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {env.VITE_GOOGLE_AUTH_ENABLED && <><Button
          type="button"
          variant="outline"
          size="xl"
          className="w-full rounded-[var(--radius-lg)]"
          onClick={handleGoogleSignIn}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <LocalizedText source={"使用 Google 登录"} />
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground"><LocalizedText source={"或"} /></span>
          </div>
        </div></>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {isSignUp && <form.Field name="name">{(field) => <div className="space-y-2"><Label htmlFor={field.name}><LocalizedText source={"姓名"} /></Label><Input id={field.name} name={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></div>}</form.Field>}
          <div>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}><LocalizedText source={"Email"} /></Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)]"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500 text-sm">
                      <LocalizedValue value={error?.message} />
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}><LocalizedText source={"密码"} /></Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      <LocalizedText source={"忘记密码？"} />
                    </Link>
                  </div>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    autoComplete="current-password"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500 text-sm">
                      <LocalizedValue value={error?.message} />
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <form.Subscribe
            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" size="xl" className="w-full rounded-[var(--radius-lg)]" disabled={!canSubmit || isSubmitting}>
                <LocalizedValue value={isSubmitting ? (isSignUp ? "正在注册…" : "正在登录…") : (isSignUp ? "注册" : "登录")} />
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="text-center text-sm text-muted-foreground"><LocalizedValue value={isSignUp ? "已有账号？" : "还没有账号？"} /><button type="button" className="ml-1 font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setIsSignUp((current) => !current)}><LocalizedValue value={isSignUp ? "登录" : "创建账号"} /></button></p>
      </CardContent>
    </Card>
  );
}
