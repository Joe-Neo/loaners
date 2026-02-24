import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = "qr-scanner-container";

  useEffect(() => {
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        undefined
      )
      .catch((err) => {
        console.error("Scanner start error:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Scan Barcode / QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div id={divId} className="w-full" />
        <div className="px-4 py-3 text-center text-sm text-gray-500">
          Point camera at barcode or QR code
        </div>
      </div>
    </div>
  );
}
