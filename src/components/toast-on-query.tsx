"use client";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

export default function ToastOnQuery() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const ok = url.searchParams.get("ok");
    const err = url.searchParams.get("err");
    if (ok) {
      toast.success("Saved successfully");
      url.searchParams.delete("ok");
      window.history.replaceState({}, "", url.toString());
    }
    if (err) {
      toast.error(err || "Something went wrong");
      url.searchParams.delete("err");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  return null;
}


