import { createContext, useContext, useState, ReactNode } from 'react'

type ReusePhoto = {
  photo_url: string
  ingredients: string
} | null

type ReusePhotoContextType = {
  reusePhoto: ReusePhoto
  setReusePhoto: (photo: ReusePhoto) => void
}

const ReusePhotoContext = createContext<ReusePhotoContextType>({
  reusePhoto: null,
  setReusePhoto: () => {},
})

export function ReusePhotoProvider({ children }: { children: ReactNode }) {
  const [reusePhoto, setReusePhoto] = useState<ReusePhoto>(null)

  return (
    <ReusePhotoContext.Provider value={{ reusePhoto, setReusePhoto }}>
      {children}
    </ReusePhotoContext.Provider>
  )
}

export function useReusePhoto() {
  return useContext(ReusePhotoContext)
}