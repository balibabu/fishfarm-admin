import { signIn } from '../services/firebase.js'
import { toast } from '../utils/dom.js'

export function renderLogin(root) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <i data-lucide="fish" class="w-8 h-8 text-white"></i>
          </div>
          <h1 class="text-2xl font-extrabold font-heading text-slate-900">Fish Farm Admin</h1>
          <p class="text-sm text-slate-500 mt-1">Sign in to manage your website content</p>
        </div>

        <form id="login-form" class="ck-card p-6 space-y-4">
          <div>
            <label for="login-email" class="ck-label">Email</label>
            <div class="relative">
              <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="login-email" type="email" required autocomplete="email" placeholder="admin@example.com" class="ck-input pl-10">
            </div>
          </div>

          <div>
            <label for="login-password" class="ck-label">Password</label>
            <div class="relative">
              <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="login-password" type="password" required autocomplete="current-password" placeholder="••••••••" class="ck-input pl-10 pr-10">
              <button type="button" id="toggle-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <p id="login-error" class="hidden text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"></p>

          <button type="submit" id="login-submit" class="ck-btn-primary w-full">
            <i data-lucide="log-out" class="w-4 h-4 rotate-180"></i>
            <span>Sign In</span>
          </button>
        </form>
      </div>
    </div>
  `

  const form = document.getElementById('login-form')
  const passwordInput = document.getElementById('login-password')
  const toggleButton = document.getElementById('toggle-password')
  const errorElement = document.getElementById('login-error')
  const submitButton = document.getElementById('login-submit')

  toggleButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password'
    passwordInput.type = isPassword ? 'text' : 'password'
    toggleButton.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`
    document.dispatchEvent(new CustomEvent('ck:icons'))
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorElement.classList.add('hidden')

    const email = document.getElementById('login-email').value.trim()
    const password = passwordInput.value

    submitButton.disabled = true
    submitButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Signing In...</span>'
    document.dispatchEvent(new CustomEvent('ck:icons'))

    try {
      await signIn(email, password)
    } catch (error) {
      errorElement.textContent = getAuthErrorMessage(error.code)
      errorElement.classList.remove('hidden')
      submitButton.disabled = false
      submitButton.innerHTML = '<i data-lucide="log-out" class="w-4 h-4 rotate-180"></i><span>Sign In</span>'
      document.dispatchEvent(new CustomEvent('ck:icons'))
    }
  })
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
  }

  return messages[code] ?? 'Sign in failed. Please try again.'
}
