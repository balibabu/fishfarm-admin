import {
  loadFishes,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../services/firebase.js'
import { renderImagePicker, setupImagePicker } from '../components/image-picker.js'
import { renderIcons } from '../icons.js'
import { toast, confirmDialog, escapeHtml } from '../utils/dom.js'

const COLLECTION = 'fishes'

export async function renderFishes(root) {
  root.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl font-extrabold font-heading text-slate-900">Fish Varieties</h2>
          <p class="text-xs text-slate-500 mt-0.5">Cards in the "Fish Varieties & Details" section</p>
        </div>
        <button id="fish-add" class="ck-btn-primary">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Add Fish</span>
        </button>
      </div>
      <div id="fish-list"></div>
    </div>
  `

  renderIcons()

  let items = []

  try {
    items = await loadFishes()
  } catch {
    document.getElementById('fish-list').innerHTML = errorState('Could not load fish varieties.')
    renderIcons()
    return
  }

  document.getElementById('fish-add').addEventListener('click', () => openFishForm(null, items.length))

  renderList()

  function renderList() {
    const listElement = document.getElementById('fish-list')

    if (items.length === 0) {
      listElement.innerHTML = emptyState('No fish varieties yet. Add your first one.')
    } else {
      listElement.innerHTML = `<div class="space-y-3">${items.map((fish, index) => fishRow(fish, index, items.length)).join('')}</div>`
    }

    listElement.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const fish = items.find((entry) => entry.id === button.dataset.edit)
        if (fish) openFishForm(fish, items.length)
      })
    })

    listElement.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const fish = items.find((entry) => entry.id === button.dataset.delete)
        if (fish && confirmDialog(`Delete "${fish.bhojpuriName}"?`)) {
          try {
            await deleteEntry(COLLECTION, fish.id)
            toast('Fish deleted')
            renderFishes(root)
          } catch {
            toast('Could not delete. Check Firestore rules.', 'error')
          }
        }
      })
    })

    listElement.querySelectorAll('[data-move-up]').forEach((button) => {
      button.addEventListener('click', () => moveItem(button.dataset.moveUp, -1))
    })

    listElement.querySelectorAll('[data-move-down]').forEach((button) => {
      button.addEventListener('click', () => moveItem(button.dataset.moveDown, 1))
    })

    renderIcons()
  }

  async function moveItem(id, direction) {
    const index = items.findIndex((entry) => entry.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= items.length) return

    ;[items[index], items[target]] = [items[target], items[index]]

    try {
      await Promise.all([
        updateEntry(COLLECTION, items[index].id, { order: index + 1 }),
        updateEntry(COLLECTION, items[target].id, { order: target + 1 }),
      ])
      renderList()
    } catch {
      toast('Could not reorder. Check Firestore rules.', 'error')
    }
  }
}

function fishRow(fish, index, total) {
  const name = escapeHtml(fish.bhojpuriName)
  const commonName = escapeHtml(fish.commonName)
  const status = escapeHtml(fish.status)
  const image = escapeHtml(fish.image)
  const isReady = status.toLowerCase().includes('ready')

  return `
    <div class="ck-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
      <img src="${image}" alt="${name}" class="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-200">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-bold font-heading text-sm text-slate-900 truncate">${name}</p>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${status}</span>
        </div>
        <p class="text-xs text-slate-500 truncate">${commonName} &middot; ${escapeHtml(fish.avgWeight)}</p>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button data-move-up="${fish.id}" ${index === 0 ? 'disabled' : ''} class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex items-center justify-center transition" aria-label="Move up">
          <span class="text-base leading-none">&uarr;</span>
        </button>
        <button data-move-down="${fish.id}" ${index === total - 1 ? 'disabled' : ''} class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex items-center justify-center transition" aria-label="Move down">
          <span class="text-base leading-none">&darr;</span>
        </button>
        <button data-edit="${fish.id}" class="w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition" aria-label="Edit">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button data-delete="${fish.id}" class="w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center transition" aria-label="Delete">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `
}

function openFishForm(fish, total) {
  const isEdit = Boolean(fish)
  const values = {
    bhojpuriName: '',
    commonName: '',
    avgWeight: '',
    description: '',
    status: 'Ready for Catch',
    image: '',
    ...fish,
  }

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm overflow-y-auto'
  overlay.innerHTML = `
    <div class="min-h-screen flex items-start sm:items-center justify-center p-4">
      <form id="fish-form" class="ck-card w-full max-w-lg p-5 sm:p-6 space-y-4 my-8">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold font-heading text-slate-900">${isEdit ? 'Edit Fish' : 'Add Fish'}</h3>
          <button type="button" id="fish-close" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition" aria-label="Close">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="fish-bhojpuri" class="ck-label">Name (local)</label>
            <input id="fish-bhojpuri" required value="${escapeHtml(values.bhojpuriName)}" placeholder="Rehu / Rohu (रेहू)" class="ck-input">
          </div>
          <div>
            <label for="fish-common" class="ck-label">Common name</label>
            <input id="fish-common" value="${escapeHtml(values.commonName)}" placeholder="Rohu Carp" class="ck-input">
          </div>
          <div>
            <label for="fish-weight" class="ck-label">Avg weight</label>
            <input id="fish-weight" value="${escapeHtml(values.avgWeight)}" placeholder="1.5 kg – 3.5 kg" class="ck-input">
          </div>
          <div>
            <label for="fish-status" class="ck-label">Status</label>
            <select id="fish-status" class="ck-input">
              ${['Ready for Catch', 'Available', 'Nursery Pond', 'Coming Soon', 'Sold Out'].map((option) => `
                <option value="${option}" ${option === values.status ? 'selected' : ''}>${option}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div>
          <label for="fish-description" class="ck-label">Description</label>
          <textarea id="fish-description" rows="3" placeholder="Short description shown on the card" class="ck-input">${escapeHtml(values.description)}</textarea>
        </div>

        ${renderImagePicker({ name: 'fish-image', value: values.image, label: 'Fish image' })}

        <div class="flex gap-2 pt-1">
          <button type="button" id="fish-cancel" class="ck-btn-secondary flex-1">Cancel</button>
          <button type="submit" class="ck-btn-primary flex-1">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>${isEdit ? 'Save Changes' : 'Add Fish'}</span>
          </button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(overlay)
  renderIcons()

  setupImagePicker(overlay, () => {})

  const close = () => overlay.remove()
  overlay.querySelector('#fish-close').addEventListener('click', close)
  overlay.querySelector('#fish-cancel').addEventListener('click', close)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })

  overlay.querySelector('#fish-form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const payload = {
      bhojpuriName: overlay.querySelector('#fish-bhojpuri').value.trim(),
      commonName: overlay.querySelector('#fish-common').value.trim(),
      avgWeight: overlay.querySelector('#fish-weight').value.trim(),
      description: overlay.querySelector('#fish-description').value.trim(),
      status: overlay.querySelector('#fish-status').value,
      image: overlay.querySelector('[data-image-url]').value.trim(),
      order: isEdit ? fish.order : total + 1,
    }

    if (!payload.bhojpuriName || !payload.image) {
      toast('Name and image are required', 'error')
      return
    }

    const submitButton = overlay.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Saving...</span>'
    renderIcons()

    try {
      if (isEdit) {
        await updateEntry(COLLECTION, fish.id, payload)
      } else {
        await createEntry(COLLECTION, payload)
      }
      toast(isEdit ? 'Fish updated' : 'Fish added')
      close()
      const root = document.getElementById('shell-content')
      renderFishes(root)
    } catch {
      toast('Could not save. Check Firestore rules.', 'error')
      submitButton.disabled = false
      submitButton.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i><span>Save</span>'
      renderIcons()
    }
  })
}

function emptyState(message) {
  return `
    <div class="ck-card p-10 text-center">
      <i data-lucide="fish" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
      <p class="text-sm text-slate-500">${message}</p>
    </div>
  `
}

function errorState(message) {
  return `
    <div class="ck-card p-10 text-center border-red-200 bg-red-50/50">
      <p class="text-sm font-semibold text-red-600">${message}</p>
      <p class="text-xs text-red-400 mt-1">Make sure Firestore is enabled and rules allow read/write.</p>
    </div>
  `
}
