declare function gtag(...args: unknown[]): void

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof gtag === 'undefined') return
  gtag('event', name, params)
}
