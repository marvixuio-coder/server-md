import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OwnerPasswordBox } from "@/components/owner-gate";
import { checkOwnerAccess } from "@/lib/owner.functions";

export function OwnerButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const check = useServerFn(checkOwnerAccess);

  const goToPanel = () => void navigate({ to: "/owner" });

  return (
    <>
      <button
        onClick={async () => {
          // Already unlocked, or signed in with an owner account: go straight in.
          try {
            if ((await check()).owner) return goToPanel();
          } catch {
            // fall through to the password box
          }
          setOpen(true);
        }}
        className="flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold transition hover:scale-105 hover:border-primary"
      >
        <span>🛠️</span>
        لوحة التحكم
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex aspect-square w-[min(90vw,22rem)] max-w-none flex-col items-center justify-center rounded-3xl p-8 sm:rounded-3xl">
          <DialogTitle className="sr-only">لوحة التحكم</DialogTitle>
          <DialogDescription className="sr-only">اكتب كلمة السر للدخول للوحة التحكم</DialogDescription>
          <OwnerPasswordBox
            onUnlocked={() => {
              setOpen(false);
              goToPanel();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
