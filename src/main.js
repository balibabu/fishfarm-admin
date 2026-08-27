import './style.css'
import { watchAuth, isFirebaseConfigured } from './services/firebase.js'
import { renderIcons } from './icons.js'
import { renderLogin } from './views/login.js'
import { renderShell } from './views/shell.js'
import { renderFishes } from './views/fishes.js'
import { renderGallery } from './views/gallery.js'
import { renderVideos } from './views/videos.js'
import { renderSettings } from './views/settings.js'

const ROOT = document.getElementById('app')

const ROUTES = {
  fishes: renderFishes,
  gallery: renderGallery,
  videos: renderVideos,
  settings: renderSettings,
}

let authResolved = false

document.addEventListener('ck:icons', () => renderIcons())

function renderConfigNotice() {
  ROOT.innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="ck-card max-w-md p-8 text-center">
        <i data-lucide="settings" class="w-10 h-10 text-slate-300 mx-auto mb-4"></i>
        <h1 class="text-lg font-extrabold font-heading text-slate-900 mb-2">Firebase is not configured</h1>
        <p class="text-sm text-slate-500 leading-relaxed">
          Paste your Firebase web app config into <code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/services/firebase.js</code> to start using the admin panel.
        </p>
      </div>
    </div>
  `
  renderIcons()
}

function currentHashRoute() {
  const hash = window.location.hash.replace('#/', '').replace('#', '')
  return ROUTES[hash] ? hash : 'fishes'
}

function navigate(route) {
  window.location.hash = `/${route}`
}

function renderApp(user) {
  if (!user) {
    renderLogin(ROOT)
    renderIcons()
    return
  }

  const route = currentHashRoute()
  const content = renderShell(ROOT, route, navigate)
  ROUTES[route](content)
}

window.addEventListener('hashchange', () => {
  if (authResolved) renderApp(true)
})

if (!isFirebaseConfigured()) {
  renderConfigNotice()
} else {
  watchAuth((user) => {
    authResolved = true
    renderApp(user)
  })
}
