"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  mode?: "fit" | "actual";
};

const INVOICE_WIDTH_PX = 794;

export function InvoicePreviewScaler({ children, mode = "fit" }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    function updateScale() {
      const el = shellRef.current;
      if (!el) return;
      setScale(mode === "actual" ? 1 : Math.min(1, el.clientWidth / INVOICE_WIDTH_PX));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    function measure() {
      const el = paperRef.current;
      if (!el) return;
      const child = el.firstElementChild as HTMLElement | null;
      const h = Math.max(
        el.offsetHeight,
        el.scrollHeight,
        child ? child.scrollHeight : 0,
        child ? child.offsetHeight : 0,
      );
      setPaperHeight(h);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    if (paper.firstElementChild) {
      observer.observe(paper.firstElementChild);
    }
    return () => observer.disconnect();
  }, [children, scale]);

  return (
    <div
      ref={shellRef}
      className="print-scale-shell w-full overflow-hidden pb-6"
      style={{ height: paperHeight > 0 ? Math.ceil(paperHeight * scale) + 28 : undefined }}
    >
      <div
        ref={paperRef}
        className="print-scale-paper origin-top-left bg-white"
        style={{
          width: INVOICE_WIDTH_PX,
          transform: scale < 1 ? `scale(${scale})` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
