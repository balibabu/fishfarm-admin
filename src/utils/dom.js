export function qs(selector, root = document) {
  return root.querySelector(selector)
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)]
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;')
}

export function getYouTubeId(input) {
  const value = String(input ?? '').trim()
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }

  return /^[\w-]{11}$/.test(value) ? value : ''
}

export function toast(message, type = 'success') {
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-900',
  }

  const element = document.createElement('div')
  element.className = `fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] ${colors[type] ?? colors.info} text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw]`
  element.textContent = message
  document.body.appendChild(element)

  setTimeout(() => {
    element.style.transition = 'opacity 0.3s'
    element.style.opacity = '0'
    setTimeout(() => element.remove(), 300)
  }, 2600)
}

export function confirmDialog(message) {
  return window.confirm(message)
}
