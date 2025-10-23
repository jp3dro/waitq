"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/modal";

export default function QRCodeModal({ open, onClose, listName, displayToken, businessName }: {
  open: boolean;
  onClose: () => void;
  listName: string;
  displayToken?: string;
  businessName?: string;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [providerIndex, setProviderIndex] = useState<number>(0);
  const printRef = useRef<HTMLDivElement | null>(null);

  const displayUrl = useMemo(() => {
    if (!displayToken) return null;
    const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : "");
    return `${base}/display/${encodeURIComponent(displayToken)}`;
  }, [displayToken]);

  useEffect(() => {
    const providers = [
      (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=2&data=${encodeURIComponent(t)}`,
      (t: string) => `https://quickchart.io/qr?size=512&margin=2&text=${encodeURIComponent(t)}`,
      (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|2&chl=${encodeURIComponent(t)}`,
    ];
    if (open && displayUrl) {
      setProviderIndex(0);
      setImgUrl(providers[0](displayUrl));
    } else if (!open) {
      setImgUrl(null);
      setProviderIndex(0);
    }
  }, [open, displayUrl]);

  const onPrint = () => {
    if (!printRef.current) return;
    const contents = printRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.ownerDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset=\"utf-8\" />
      <title>Print QR</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"; }
        .sheet { width: 100%; height: 100%; display: grid; place-items: center; }
        .wrap { text-align: center; }
        .title { font-size: 20pt; font-weight: 700; margin-bottom: 16mm; }
        .qr { width: 120mm; height: 120mm; margin: 0 auto; }
        .url { margin-top: 8mm; font-size: 11pt; color: #555; word-break: break-all; }
      </style>
    </head><body><div class=\"sheet\">${contents}</div>
    <script>
      (function(){
        function cleanup(){
          try { setTimeout(function(){ parent.document.body.removeChild(window.frameElement); }, 100); } catch(e){}
        }
        function doPrint(){
          try { window.focus(); } catch(e){}
          try { window.print(); } catch(e){}
          cleanup();
        }
        window.addEventListener('load', function(){
          var img = document.getElementById('qr-img');
          if (img && !img.complete) {
            img.onload = doPrint;
            img.onerror = doPrint;
          } else {
            doPrint();
          }
        });
      })();
    </script>
    </body></html>`);
    doc.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="QR code"
      footer={
        <>
          <button onClick={onClose} className="action-btn">Cancel</button>
          <button onClick={() => onPrint()} className="action-btn action-btn--primary">Print</button>
        </>
      }
    >
      <div className="grid gap-4">
        {!displayUrl ? (
          <p className="text-sm text-muted-foreground">No public display token is configured for this list.</p>
        ) : (
          <>
            <div ref={printRef} className="wrap">
              <div className="title">{businessName ? `${businessName} – ${listName}` : listName}</div>
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img id="qr-img" src={imgUrl} alt="QR code" className="qr"
                  onError={() => {
                    const providers = [
                      (t: string) => `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=2&data=${encodeURIComponent(t)}`,
                      (t: string) => `https://quickchart.io/qr?size=512&margin=2&text=${encodeURIComponent(t)}`,
                      (t: string) => `https://chart.googleapis.com/chart?cht=qr&chs=512x512&chld=L|2&chl=${encodeURIComponent(t)}`,
                    ];
                    if (displayUrl && providerIndex < providers.length - 1) {
                      const next = providerIndex + 1;
                      setProviderIndex(next);
                      setImgUrl(providers[next](displayUrl));
                    }
                  }}
                />
              ) : (
                <div className="qr flex items-center justify-center">Generating…</div>
              )}
              {/* URL intentionally hidden per requirements */}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}


