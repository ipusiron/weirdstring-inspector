/**
 * theme-init - 最初の描画の前にテーマを決める。<head> で同期読み込みする。
 *
 * style.css の既定はライトで、ダークは <html> の data-theme="dark" で切り替える。
 * この判定を </body> 直前の script.js（DOMContentLoaded）で行うと、ライトで描いたあとに
 * ダークへ切り替わって見える。
 *
 * 保存した選択（localStorage の theme）が "light" か "dark" ならそれに従い、
 * なければ（想定外の値も）OS の設定に従う。localStorage が読めない環境でも落ちないよう try/catch で囲む。
 * ボタンのアイコン・aria-label・aria-pressed は script.js の updateThemeIcon() がこの値に合わせる。
 */
(function (global) {
  'use strict';

  var saved = null;
  try { saved = global.localStorage.getItem('theme'); } catch (e) { /* 使えない環境でも続行 */ }

  var prefersDark = !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  var theme = (saved === 'light' || saved === 'dark') ? saved : (prefersDark ? 'dark' : 'light');

  global.document.documentElement.setAttribute('data-theme', theme);
})(typeof window !== 'undefined' ? window : globalThis);
