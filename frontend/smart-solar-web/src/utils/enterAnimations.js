// ============================================================================
// File: enterAnimations.js
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Shared entrance-motion presets for Backoffice and Grid
// Operator pages. Pure Bootstrap 5 / Tailwind CSS animation utilities driven
// by the bl-fade-up keyframes in index.css. Literal class strings (picked by
// index) so Tailwind can generate them at build time. Pair with
// `motion-reduce:animate-none` for accessibility.
// Usage: className={`${ENTER_ANIMS[i % ENTER_ANIMS.length]} motion-reduce:animate-none`}
// NOTE: apply to a plain wrapper, never on the same element as a hover
// translate utility — the fill mode would override the hover transform.
// ============================================================================
export const ENTER_ANIMS = [
  'animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_0ms_both]',
  'animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_90ms_both]',
  'animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_180ms_both]',
  'animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_270ms_both]',
];

export const ENTER_FADE = 'animate-[bl-fade-in_600ms_ease-out_both]';

export const ENTER_UP =
  'animate-[bl-fade-up_600ms_cubic-bezier(0.16,1,0.3,1)_100ms_both]';
