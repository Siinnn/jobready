'use client'
// Ancienne page — l'éditeur vit désormais sur /editeur.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CVEditorRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/editeur') }, [router])
  return null
}
