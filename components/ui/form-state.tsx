"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

type ActionState = {
  success: boolean;
  message: string;
};

const initialState: ActionState = {
  success: false,
  message: "",
};

export function FormState({
  action,
  submitLabel,
  resetOnSuccess = true,
  children,
}: {
  action: (state: ActionState, payload: FormData) => Promise<ActionState>;
  submitLabel: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && resetOnSuccess) {
      formRef.current?.reset();
    }
  }, [resetOnSuccess, state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {children}
      {state.message ? (
        <p className={state.success ? "text-sm text-emerald-300" : "text-sm text-amber-200"}>{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Memproses..." : submitLabel}
      </Button>
    </form>
  );
}
