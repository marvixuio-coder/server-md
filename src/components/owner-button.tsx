import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OwnerPasswordBox } from "@/components/owner-gate";

export function OwnerButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
              void navigate({ to: "/owner" });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
