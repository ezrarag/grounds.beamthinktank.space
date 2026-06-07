const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b1712" />
  <path d="M14 42V24l18-10 18 10v18" fill="none" stroke="#d7c6a5" stroke-width="4" stroke-linejoin="round" />
  <path d="M22 42V30h20v12" fill="none" stroke="#88aa8f" stroke-width="4" stroke-linejoin="round" />
  <path d="M18 48h28" stroke="#edf3ea" stroke-width="4" stroke-linecap="round" />
</svg>`

export function GET() {
  return new Response(icon, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  })
}
