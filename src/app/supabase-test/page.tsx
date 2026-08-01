"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type TestState =
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function SupabaseTestPage() {
  const [testState, setTestState] = useState<TestState>({
    status: "loading",
    message: "Supabase bağlantısı kontrol ediliyor...",
  });

  useEffect(() => {
    let isMounted = true;

    async function testConnection() {
      try {
        const supabase = createClient();

        const { count, error } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true });

        if (!isMounted) {
          return;
        }

        if (error) {
          setTestState({
            status: "error",
            message: `Bağlantı kurulamadı: ${error.message}`,
          });
          return;
        }

        setTestState({
          status: "success",
          message: `Supabase bağlantısı başarılı. Görüntülenebilen aktif ilan sayısı: ${
            count ?? 0
          }`,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setTestState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Bilinmeyen bir bağlantı hatası oluştu.",
        });
      }
    }

    testConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  const isSuccess = testState.status === "success";
  const isError = testState.status === "error";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-6 text-[#2A2A2A]">
      <section className="w-full max-w-xl rounded-[32px] bg-[#F8F6F2] p-8 text-center shadow-[0_26px_80px_rgba(42,42,42,0.13)] sm:p-12">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] text-3xl font-semibold shadow-[0_18px_45px_rgba(42,42,42,0.12)] ${
            isSuccess
              ? "bg-[#F6A04D]"
              : isError
                ? "bg-[#2A2A2A] text-[#F8F6F2]"
                : "bg-[#F6A04D]/45"
          }`}
        >
          {isSuccess ? "✓" : isError ? "!" : "…"}
        </div>

        <p className="mt-7 text-sm font-semibold tracking-[0.22em] text-[#2A2A2A]/55">
          AYDEMİR İNŞAAT
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Supabase Bağlantı Testi
        </h1>

        <p className="mt-6 text-base leading-8 text-[#2A2A2A]/65">
          {testState.message}
        </p>

        <a
          href="/"
          className="mt-8 inline-flex rounded-[20px] bg-[#F6A04D] px-6 py-4 font-semibold shadow-[0_14px_35px_rgba(42,42,42,0.12)] transition-all duration-300 hover:-translate-y-1"
        >
          Ana Sayfaya Dön
        </a>
      </section>
    </main>
  );
}
