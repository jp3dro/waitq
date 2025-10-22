"use client";
import { useEffect } from "react";
import { toastManager } from "@/hooks/use-toast";

export default function ToastOnQuery() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const ok = url.searchParams.get("ok");
    const err = url.searchParams.get("err");
    if (ok) {
      toastManager.add({
        title: "Success",
        description: "Saved successfully",
        type: "success",
      });
      url.searchParams.delete("ok");
      window.history.replaceState({}, "", url.toString());
    }
    if (err) {
      toastManager.add({
        title: "Error",
        description: err || "Something went wrong",
        type: "error",
      });
      url.searchParams.delete("err");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  return null;
}


