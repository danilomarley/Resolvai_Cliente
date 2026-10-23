import { useEffect, useState } from 'react'
import { Icon } from './Icon'

// Prévia local das fotos escolhidas, antes do envio à API.
export function PhotoPreview({ photos, onRemove }: { photos: File[]; onRemove?: (index: number) => void }) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const next = photos.map((photo) => URL.createObjectURL(photo))
    setUrls(next)
    return () => next.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])
  if (!photos.length) return null
  return (
    <div className="scope-photos">
      {photos.map((photo, index) => (
        <figure key={`${photo.name}-${index}`}>
          {urls[index] && <img src={urls[index]} alt={`Foto anexada: ${photo.name}`} />}
          <figcaption>{photo.name}</figcaption>
          {onRemove && (
            <button type="button" aria-label={`Remover foto ${photo.name}`} onClick={() => onRemove(index)}>
              <Icon name="close" size={15} />
            </button>
          )}
        </figure>
      ))}
    </div>
  )
}
