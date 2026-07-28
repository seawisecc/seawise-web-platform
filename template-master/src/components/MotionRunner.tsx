"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Menjalankan pengamat scroll SETELAH hydration selesai.
 *
 * Kelas `is-in` ditambahkan ke elemen yang dirender React. Kalau penambahan
 * itu terjadi sebelum hydration, React membandingkan DOM dengan hasil render
 * servernya, menemukan atribut class yang berbeda, dan melempar hydration
 * mismatch. useEffect dijamin berjalan sesudahnya, jadi urutannya aman.
 */
export function MotionRunner() {
  const pathname = usePathname();

  useEffect(() => {
    // Penyembunyian awal ditangani CSS lewat media query `scripting`.
    // Komponen ini hanya bertugas menyalakan kelas `is-in` saat elemen
    // masuk layar — dan karena berjalan di useEffect, ia dijamin terjadi
    // setelah hydration sehingga tidak ada ketidakcocokan DOM.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    function scan() {
      document
        .querySelectorAll(".reveal:not(.is-in), .reveal-group:not(.is-in)")
        .forEach((el) => observer.observe(el));
    }

    scan();

    // Konten bisa bertambah setelah render awal — misalnya saat berpindah
    // halaman tanpa muat ulang penuh.
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
