import {
  loadVideos,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../services/firebase.js'
import { renderIcons } from '../icons.js'
import { toast, confirmDialog, escapeHtml, getYouTubeId } from '../utils/dom.js'

const COLLECTION = 'videos'

export async function renderVideos(root) {
  root.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl font-extrabold font-heading text-slate-900">Videos</h2>
          <p class="text-xs text-slate-500 mt-0.5">YouTube videos in the "Farm Videos" section</p>
        </div>
        <button id="video-add" class="ck-btn-primary">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Add Video</span>
        </button>
      </div>
      <div id="video-list"></div>
    </div>
  `

  renderIcons()

  let items = []

  try {
    items = await loadVideos()
  } catch {
    document.getElementById('video-list').innerHTML = errorState('Could not load videos.')
    renderIcons()
    return
  }

  document.getElementById('video-add').addEventListener('click', () => openVideoForm(null, items.length))

  renderList()

  function renderList() {
    const listElement = document.getElementById('video-list')

    if (items.length === 0) {
      listElement.innerHTML = emptyState('No videos yet. Add your first one.')
    } else {
      listElement.innerHTML = `<div class="space-y-3">${items.map((item, index) => videoRow(item, index, items.length)).join('')}</div>`
    }

    listElement.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = items.find((entry) => entry.id === button.dataset.edit)
        if (item) openVideoForm(item, items.length)
      })
    })

    listElement.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const item = items.find((entry) => entry.id === button.dataset.delete)
        if (item && confirmDialog(`Delete "${item.title}"?`)) {
          try {
            await deleteEntry(COLLECTION, item.id)
            toast('Video deleted')
            renderVideos(root)
          } catch {
            toast('Could not delete. Check Firestore rules.', 'error')
          }
        }
      })
    })

    listElement.querySelectorAll('[data-move-up]').forEach((button) => {
      button.addEventListener('click', () => moveVideo(button.dataset.moveUp, -1))
    })

    listElement.querySelectorAll('[data-move-down]').forEach((button) => {
      button.addEventListener('click', () => moveVideo(button.dataset.moveDown, 1))
    })

    renderIcons()
  }

  async function moveVideo(id, direction) {
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

function videoRow(item, index, total) {
  const title = escapeHtml(item.title)
  const videoId = escapeHtml(item.videoId)
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return `
    <div class="ck-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
      <div class="relative w-28 sm:w-36 flex-shrink-0">
        <img src="${thumbnail}" alt="${title}" class="w-full aspect-video rounded-lg object-cover border border-slate-200">
        <span class="absolute inset-0 flex items-center justify-center">
          <span class="w-8 h-6 bg-red-600 rounded-md flex items-center justify-center shadow">
            <i data-lucide="play" class="w-3 h-3 text-white fill-white"></i>
          </span>
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold font-heading text-sm text-slate-900 truncate">${title}</p>
        <a href="https://youtu.be/${videoId}" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
          youtu.be/${videoId}
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button data-move-up="${item.id}" ${index === 0 ? 'disabled' : ''} class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex items-center justify-center transition" aria-label="Move up">
          <span class="text-base leading-none">&uarr;</span>
        </button>
        <button data-move-down="${item.id}" ${index === total - 1 ? 'disabled' : ''} class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 flex items-center justify-center transition" aria-label="Move down">
          <span class="text-base leading-none">&darr;</span>
        </button>
        <button data-edit="${item.id}" class="w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-center transition" aria-label="Edit">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button data-delete="${item.id}" class="w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center transition" aria-label="Delete">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `
}

function openVideoForm(item, total) {
  const isEdit = Boolean(item)
  const values = { title: '', videoId: '', ...item }

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm overflow-y-auto'
  overlay.innerHTML = `
    <div class="min-h-screen flex items-start sm:items-center justify-center p-4">
      <form id="video-form" class="ck-card w-full max-w-lg p-5 sm:p-6 space-y-4 my-8">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-extrabold font-heading text-slate-900">${isEdit ? 'Edit Video' : 'Add Video'}</h3>
          <button type="button" id="video-close" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition" aria-label="Close">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div>
          <label for="video-title" class="ck-label">Title</label>
          <input id="video-title" required value="${escapeHtml(values.title)}" placeholder="Farm Tour: Massive Grow-out Ponds" class="ck-input">
        </div>

        <div>
          <label for="video-url" class="ck-label">YouTube link or video ID</label>
          <input id="video-url" required value="${escapeHtml(values.videoId)}" placeholder="https://www.youtube.com/watch?v=..." class="ck-input">
          <p id="video-id-preview" class="text-[11px] text-slate-400 mt-1.5"></p>
        </div>

        <div data-video-thumb class="hidden rounded-xl overflow-hidden border border-slate-200 relative">
          <img src="" alt="Video thumbnail" class="w-full aspect-video object-cover">
          <span class="absolute inset-0 flex items-center justify-center">
            <span class="w-12 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <i data-lucide="play" class="w-4 h-4 text-white fill-white"></i>
            </span>
          </span>
        </div>

        <div class="flex gap-2 pt-1">
          <button type="button" id="video-cancel" class="ck-btn-secondary flex-1">Cancel</button>
          <button type="submit" class="ck-btn-primary flex-1">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>${isEdit ? 'Save Changes' : 'Add Video'}</span>
          </button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(overlay)
  renderIcons()

  const urlInput = overlay.querySelector('#video-url')
  const idPreview = overlay.querySelector('#video-id-preview')
  const thumb = overlay.querySelector('[data-video-thumb]')
  const thumbImage = thumb.querySelector('img')

  const updatePreview = () => {
    const videoId = getYouTubeId(urlInput.value)
    if (videoId) {
      idPreview.textContent = `Video ID: ${videoId}`
      thumbImage.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      thumb.classList.remove('hidden')
    } else if (urlInput.value.trim()) {
      idPreview.textContent = 'Not a valid YouTube link yet'
      thumb.classList.add('hidden')
    } else {
      idPreview.textContent = ''
      thumb.classList.add('hidden')
    }
  }

  urlInput.addEventListener('input', updatePreview)
  updatePreview()

  const close = () => overlay.remove()
  overlay.querySelector('#video-close').addEventListener('click', close)
  overlay.querySelector('#video-cancel').addEventListener('click', close)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })

  overlay.querySelector('#video-form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const videoId = getYouTubeId(urlInput.value)

    if (!videoId) {
      toast('Could not read a YouTube video ID from that link', 'error')
      return
    }

    const payload = {
      title: overlay.querySelector('#video-title').value.trim(),
      videoId,
      order: isEdit ? item.order : total + 1,
    }

    if (!payload.title) {
      toast('Title is required', 'error')
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
      toast(isEdit ? 'Video updated' : 'Video added')
      close()
      const root = document.getElementById('shell-content')
      renderVideos(root)
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
      <i data-lucide="video" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
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
