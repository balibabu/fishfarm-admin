import { signOutUser, currentUserEmail } from '../services/firebase.js'
import { renderIcons } from '../icons.js'

const NAV_ITEMS = [
  { id: 'fishes', label: 'Fish Varieties', icon: 'fish' },
  { id: 'gallery', label: 'Gallery', icon: 'image' },
  { id: 'videos', label: 'Videos', icon: 'video' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

export function renderShell(root, route, onNavigate) {
  const email = currentUserEmail()

  root.innerHTML = `
    <div class="min-h-screen flex flex-col md:flex-row">
      <header class="bg-slate-900 text-white md:w-64 md:min-h-screen md:sticky md:top-0 flex-shrink-0">
        <div class="flex items-center justify-between md:flex-col md:items-start md:justify-start p-4 md:p-5">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i data-lucide="fish" class="w-5 h-5 text-white"></i>
            </div>
            <div class="min-w-0">
              <p class="font-extrabold font-heading text-sm leading-tight">Fish Farm Admin</p>
              <p class="text-[10px] text-slate-400 truncate">${email}</p>
            </div>
          </div>

          <button id="shell-menu" class="md:hidden text-slate-400 hover:text-white" aria-label="Toggle menu">
            <i data-lucide="x" class="w-5 h-5 hidden"></i>
            <i data-lucide="settings" class="w-5 h-5"></i>
          </button>

          <nav class="hidden md:flex md:flex-col md:gap-1 md:w-full md:mt-8">
            ${NAV_ITEMS.map((item) => navLink(item, route)).join('')}
          </nav>

          <div class="hidden md:block md:w-full md:mt-6">
            <button id="shell-logout" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div id="shell-mobile-nav" class="hidden md:hidden border-t border-slate-800 px-3 py-3 flex-col gap-1">
          ${NAV_ITEMS.map((item) => navLink(item, route)).join('')}
          <button id="shell-logout-mobile" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main id="shell-content" class="flex-1 min-w-0"></main>
    </div>
  `

  renderIcons()

  const mobileNav = document.getElementById('shell-mobile-nav')
  const menuButton = document.getElementById('shell-menu')
  const icons = menuButton.querySelectorAll('i')

  const setMenuState = (open) => {
    mobileNav.classList.toggle('hidden', !open)
    mobileNav.classList.toggle('flex', open)
    icons.forEach((icon, index) => icon.classList.toggle('hidden', index === 0 ? !open : open))
  }

  menuButton.addEventListener('click', () => {
    setMenuState(mobileNav.classList.contains('hidden'))
  })

  document.querySelectorAll('#shell-mobile-nav [data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      setMenuState(false)
      onNavigate(button.dataset.route)
    })
  })

  document.querySelectorAll('nav [data-route]').forEach((button) => {
    button.addEventListener('click', () => onNavigate(button.dataset.route))
  })

  document.getElementById('shell-logout').addEventListener('click', handleSignOut)
  document.getElementById('shell-logout-mobile').addEventListener('click', handleSignOut)

  return document.getElementById('shell-content')
}

function navLink(item, route) {
  const active = item.id === route

  return `
    <button data-route="${item.id}" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
      <i data-lucide="${item.icon}" class="w-4 h-4"></i>
      <span>${item.label}</span>
    </button>
  `
}

async function handleSignOut() {
  try {
    await signOutUser()
  } catch {
    window.location.reload()
  }
}
