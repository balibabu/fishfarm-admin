import { loadSettings, saveSettings } from '../services/firebase.js'
import { renderIcons } from '../icons.js'
import { toast } from '../utils/dom.js'

export async function renderSettings(root) {
  root.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="mb-6">
        <h2 class="text-xl font-extrabold font-heading text-slate-900">Settings</h2>
        <p class="text-xs text-slate-500 mt-0.5">Farm details, contact info and hero content</p>
      </div>

      <form id="settings-form" class="space-y-5">
        <section class="ck-card p-5 space-y-4">
          <h3 class="text-sm font-extrabold font-heading text-slate-900">Farm Details</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="settings-farm-name" class="ck-label">Farm name</label>
              <input id="settings-farm-name" value="" placeholder="Keshav Akikrit Fish Farm" class="ck-input">
            </div>
            <div>
              <label for="settings-tagline" class="ck-label">Tagline</label>
              <input id="settings-tagline" value="" placeholder="Farm Pickup Only • Naturally Raised" class="ck-input">
            </div>
            <div>
              <label for="settings-phone" class="ck-label">Phone number</label>
              <input id="settings-phone" value="" placeholder="+9779811162398" class="ck-input">
            </div>
            <div>
              <label for="settings-whatsapp" class="ck-label">WhatsApp number (with country code, no +)</label>
              <input id="settings-whatsapp" value="" placeholder="9779811162398" class="ck-input">
            </div>
            <div>
              <label for="settings-hours" class="ck-label">Opening hours</label>
              <input id="settings-hours" value="" placeholder="6:00 AM – 6:00 PM" class="ck-input">
            </div>
            <div>
              <label for="settings-map" class="ck-label">Google Maps link</label>
              <input id="settings-map" value="" placeholder="https://maps.app.goo.gl/..." class="ck-input">
            </div>
          </div>
          <div>
            <label for="settings-harvest" class="ck-label">Harvest notice (top alert bar)</label>
            <input id="settings-harvest" value="" placeholder="Upcoming Big Net Catch: Saturday at 6:00 AM" class="ck-input">
          </div>
        </section>

        <section class="ck-card p-5 space-y-4">
          <h3 class="text-sm font-extrabold font-heading text-slate-900">Hero Section</h3>
          <div>
            <label for="settings-hero-badge" class="ck-label">Badge text</label>
            <input id="settings-hero-badge" value="" placeholder="Fed on Pure Mill Scraps (Mustard Cake & Rice Bran)" class="ck-input">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="settings-hero-title" class="ck-label">Title</label>
              <input id="settings-hero-title" value="" placeholder="Fresh Catch Direct From" class="ck-input">
            </div>
            <div>
              <label for="settings-hero-highlight" class="ck-label">Title highlight (colored part)</label>
              <input id="settings-hero-highlight" value="" placeholder="Massive Mud Ponds" class="ck-input">
            </div>
          </div>
          <div>
            <label for="settings-hero-description" class="ck-label">Description</label>
            <textarea id="settings-hero-description" rows="3" placeholder="Raised naturally in 2 huge grow-out ponds..." class="ck-input"></textarea>
          </div>
        </section>

        <div class="flex justify-end gap-2">
          <button type="submit" id="settings-save" class="ck-btn-primary">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  `

  renderIcons()

  let settings = {}

  try {
    settings = await loadSettings()
  } catch {
    toast('Could not load settings from Firestore', 'error')
  }

  const fields = {
    farmName: 'settings-farm-name',
    tagline: 'settings-tagline',
    phoneNumber: 'settings-phone',
    whatsappNumber: 'settings-whatsapp',
    openingHours: 'settings-hours',
    mapUrl: 'settings-map',
    harvestNotice: 'settings-harvest',
  }

  for (const [key, id] of Object.entries(fields)) {
    document.getElementById(id).value = settings[key] ?? ''
  }

  const hero = settings.hero ?? {}
  document.getElementById('settings-hero-badge').value = hero.badge ?? ''
  document.getElementById('settings-hero-title').value = hero.title ?? ''
  document.getElementById('settings-hero-highlight').value = hero.titleHighlight ?? ''
  document.getElementById('settings-hero-description').value = hero.description ?? ''

  document.getElementById('settings-form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const payload = {
      farmName: document.getElementById('settings-farm-name').value.trim(),
      tagline: document.getElementById('settings-tagline').value.trim(),
      phoneNumber: document.getElementById('settings-phone').value.trim(),
      whatsappNumber: document.getElementById('settings-whatsapp').value.trim(),
      openingHours: document.getElementById('settings-hours').value.trim(),
      mapUrl: document.getElementById('settings-map').value.trim(),
      harvestNotice: document.getElementById('settings-harvest').value.trim(),
      hero: {
        badge: document.getElementById('settings-hero-badge').value.trim(),
        title: document.getElementById('settings-hero-title').value.trim(),
        titleHighlight: document.getElementById('settings-hero-highlight').value.trim(),
        description: document.getElementById('settings-hero-description').value.trim(),
      },
    }

    const saveButton = document.getElementById('settings-save')
    saveButton.disabled = true
    saveButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Saving...</span>'
    renderIcons()

    try {
      await saveSettings(payload)
      toast('Settings saved')
    } catch {
      toast('Could not save. Check Firestore rules.', 'error')
    } finally {
      saveButton.disabled = false
      saveButton.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i><span>Save Settings</span>'
      renderIcons()
    }
  })
}
