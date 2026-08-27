import { isCloudinaryConfigured, uploadImage } from '../services/cloudinary.js'
import { renderIcons } from '../icons.js'
import { toast } from '../utils/dom.js'

export function renderImagePicker({ name, value = '', label = 'Image' }) {
  const cloudinaryEnabled = isCloudinaryConfigured()

  return `
    <div data-image-picker class="space-y-2">
      <span class="ck-label">${label}</span>

      <div class="flex gap-2">
        <div class="relative flex-1">
          <i data-lucide="link" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input type="url" name="${name}" value="${value ? String(value).replaceAll('"', '"') : ''}" placeholder="https://res.cloudinary.com/..." class="ck-input pl-10" data-image-url>
        </div>

        ${cloudinaryEnabled ? `
          <button type="button" class="ck-btn-secondary flex-shrink-0" data-image-upload>
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span class="hidden sm:inline">Upload</span>
          </button>
        ` : ''}
      </div>

      ${cloudinaryEnabled ? `
        <label class="flex items-center gap-2.5 border-2 border-dashed border-slate-300 rounded-xl px-3.5 py-3 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition cursor-pointer">
          <i data-lucide="upload" class="w-4 h-4 flex-shrink-0"></i>
          <span data-image-label>Or drop / choose an image file to upload to Cloudinary</span>
          <input type="file" accept="image/*" class="hidden" data-image-file>
        </label>
      ` : ''}

      <div data-image-preview class="${value ? '' : 'hidden'} relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        <img src="${value ? String(value).replaceAll('"', '"') : ''}" alt="Preview" class="w-full h-36 object-cover">
        <button type="button" class="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition" data-image-clear aria-label="Remove image">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <p data-image-progress class="hidden text-xs font-semibold text-blue-600"></p>
    </div>
  `
}

export function setupImagePicker(container, onChange) {
  const urlInput = container.querySelector('[data-image-url]')
  const fileInput = container.querySelector('[data-image-file]')
  const uploadButton = container.querySelector('[data-image-upload]')
  const preview = container.querySelector('[data-image-preview]')
  const previewImage = preview?.querySelector('img')
  const clearButton = container.querySelector('[data-image-clear]')
  const progress = container.querySelector('[data-image-progress]')

  const updatePreview = (src) => {
    if (!preview || !previewImage) return
    if (src) {
      previewImage.src = src
      preview.classList.remove('hidden')
    } else {
      preview.classList.add('hidden')
    }
    onChange?.(src)
  }

  urlInput?.addEventListener('change', () => updatePreview(urlInput.value.trim()))
  urlInput?.addEventListener('blur', () => updatePreview(urlInput.value.trim()))

  clearButton?.addEventListener('click', () => {
    urlInput.value = ''
    if (fileInput) fileInput.value = ''
    updatePreview('')
  })

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('Image must be under 10 MB', 'error')
      return
    }

    const label = container.querySelector('[data-image-label]')
    const originalText = label?.textContent

    if (uploadButton) uploadButton.disabled = true
    if (progress) {
      progress.classList.remove('hidden')
      progress.textContent = 'Uploading... 0%'
    }

    try {
      const url = await uploadImage(file, (percent) => {
        if (progress) progress.textContent = `Uploading... ${percent}%`
      })
      urlInput.value = url
      updatePreview(url)
      toast('Image uploaded')
    } catch (error) {
      toast(error.message || 'Upload failed', 'error')
    } finally {
      if (uploadButton) uploadButton.disabled = false
      if (progress) progress.classList.add('hidden')
      if (label && originalText) label.textContent = originalText
    }
  }

  fileInput?.addEventListener('change', () => handleFile(fileInput.files?.[0]))

  const dropZone = container.querySelector('label[data-image-file]')?.parentElement
  dropZone?.addEventListener('dragover', (event) => event.preventDefault())
  dropZone?.addEventListener('drop', (event) => {
    event.preventDefault()
    handleFile(event.dataTransfer?.files?.[0])
  })

  uploadButton?.addEventListener('click', () => fileInput?.click())

  renderIcons()
}
