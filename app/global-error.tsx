"use client";

import "./globals.css";

/** Only reached when the root layout itself fails: no providers exist here, so the text is plain and bilingual. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="max-w-sm text-sm">Something went wrong. / حدث خطأ ما.</p>
        <button type="button" onClick={reset} className="min-h-11 rounded-full bg-[#114c61] px-6 text-sm font-medium text-white">
          Retry / إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
