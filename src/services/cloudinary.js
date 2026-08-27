const CLOUD_NAME = ''
const UNSIGNED_UPLOAD_PRESET = ''

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UNSIGNED_UPLOAD_PRESET)
}

export async function uploadImage(file, onProgress) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured')
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UNSIGNED_UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', url)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        try {
          const response = JSON.parse(request.responseText)
          resolve(response.secure_url)
        } catch {
          reject(new Error('Invalid Cloudinary response'))
        }
      } else {
        reject(new Error(`Upload failed (${request.status})`))
      }
    }

    request.onerror = () => reject(new Error('Network error during upload'))
    request.send(formData)
  })
}
