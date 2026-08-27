import {
  loadGallery,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../services/firebase.js'
import { renderImagePicker, setupImagePicker } from '../components/image-picker.js'
import { renderIcons } from '../icons.js'
import { toast, confirmDialog, escapeHtml } from '../utils/dom.js'

const COLLECTION = 'gallery'

export async function renderGallery(root) {
  root.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl font-extrabold font-heading text-slate-900">Gallery</h2>
          <p class="text-xs text-slate-500 mt-0.5">Photos in the "Ponds & Harvesting Highlights" grid</p>
        </div>
        <button id="gallery-add" class="ck-btn-primary">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Add Photo</span>
        </button>
      </div>
      <div id="gallery-grid"></div>
    </div>
  `

  renderIcons()

  let items = []

  try {
    items = await loadGallery()
  } catch {
    document.getElementById('gallery-grid').innerHTML = errorState('Could not load gallery.')
    renderIcons()
    return
  }

  document.getElementById('gallery-add').addEventListener('click', () => openGalleryForm(null, items.length))

  renderGrid()

  function renderGrid() {
    const gridElement = document.getElementById('gallery-grid')

    if (items.length === 0) {
      gridElement.innerHTML = emptyState('No photos yet. Add your first one.')
    } else {
      gridElement.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${items.map((item, index) => galleryCard(item, index, items.length)).join('')}
        </div>
      `
    }

    gridElement.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = items.find((entry) => entry.id === button.dataset.edit)
        if (item) openGalleryForm(item, items.length)
      })
    })

    gridElement.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const item = items.find((entry) => entry.id === button.dataset.delete)
        if (item && confirmDialog(`Delete "${item.title}"?`)) {
          try {
            await deleteEntry(COLLECTION, item.id)
            toast('Photo deleted')
            renderGallery(root)
          } catch {
            toast('Could not delete. Check Firestore rules.', 'error')
          }
        }
      })
    })

    gridElement.querySelectorAll('[data-move-up]').forEach((button) => {
      button.addEventListener('click', () => moveItem(button.dataset.moveUp, -1))
    })

    gridElement.querySelectorAll('[data-move-down]').forEach((button) => {
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
      renderGrid()
    } catch {
      toast('Could not reorder. Check Firestore rules.', 'error')
    }
  }
}

function galleryCard(item, index, total) {
  const title = escapeHtml(item.title)
  const url = escapeHtml(item.url)

  return `
    <div class="ck-card overflow-hidden group">
      <div class="relative h-40 bg-slate-100">
        <img src="${url}" alt="${title}" class="w-full h-full object-cover">
        <div class="absolute top-2 left-2 flex gap-1">
          <button data-move-up="${item.id}" ${index === 0 ? 'disabled' : ''} class="w-7 h-7 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 flex items-center justify-center transition" aria-label="Move up">
            <span class="text-sm leading-none">&uarr;</span>
          </button>
          <button data-move-down="${item.id}" ${index === total - 1 ? 'disabled' : ''} class="w-7 h-7 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 flex items-center justify-center transition" aria-label="Move down">
            <span class="text-sm leading-none">&darr;</span>
          </button>
        </div>
      </div>
      <div class="p-3 flex items-center justify-between gap-2">
        <p class="text-xs font-semibold text-slate-800 truncate">${title}</p>
        <div class="flex gap-1 flex-shrink-0">
          <button data-edit="${item.id}" class="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition" aria-label="Edit">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button data-delete="${item.id}" class="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center transition" aria-label="Delete">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>
  `
}

function openGalleryForm(item, total) {
  const isEdit = Boolean(item)
  const values = { title: '', url: '', ...item }

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm overflow-y-auto'
  overlay.innerHTML = `
    <div class="min-h-screen flex items-start sm:items-center justify-center p-4">
      <form id="gallery-form" class="ck-card w-full max-w-lg p-5 sm:p-6 space-y-4 my-8">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold font-heading text-slate-900">${isEdit ? 'Edit Photo' : 'Add Photo'}</h3>
          <button type="button" id="gallery-close" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition" aria-label="Close">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div>
          <label for="gallery-title" class="ck-label">Caption</label>
          <input id="gallery-title" required value="${escapeHtml(values.title)}" placeholder="2 Massive Grow-out Ponds" class="ck-input">
        </div>

        ${renderImagePicker({ name: 'gallery-image', value: values.url, label: 'Photo' })}

        <div class="flex gap-2 pt-1">
          <button type="button" id="gallery-cancel" class="ck-btn-secondary flex-1">Cancel</button>
          <button type="submit" class="ck-btn-primary flex-1">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>${isEdit ? 'Save Changes' : 'Add Photo'}</span>
          </button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(overlay)
  renderIcons()

  setupImagePicker(overlay, () => {})

  const close = () => overlay.remove()
  overlay.querySelector('#gallery-close').addEventListener('click', close)
  overlay.querySelector('#gallery-cancel').addEventListener('click', close)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })

  overlay.querySelector('#gallery-form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const payload = {
      title: overlay.querySelector('#gallery-title').value.trim(),
      url: overlay.querySelector('[data-image-url]').value.trim(),
      order: isEdit ? item.order : total + 1,
    }

    if (!payload.title || !payload.url) {
      toast('Caption and photo are required', 'error')
      return
    }

    const submitButton = overlay.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Saving...</span>'
    renderIcons()

    try {
      if (isEdit) {
        await updateEntry(COLLECTION, item.id, payload)
      } else {
        await createEntry(COLLECTION, payload)
      }
      toast(isEdit ? 'Photo updated' : 'Photo added')
      close()
      const root = document.getElementById('shell-content')
      renderGallery(root)
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
      <i data-lucide="image" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
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
