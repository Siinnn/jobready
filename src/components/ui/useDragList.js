'use client'
import { useState, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Réordonnancement par glisser-déposer, basé sur l'API HTML5 native
// (aucune dépendance).
//
// Deux jeux de propriétés distincts, et c'est essentiel :
//   • handleProps(i) → sur la POIGNÉE seule, qui porte `draggable`
//   • dropProps(i)   → sur le conteneur, qui n'est que zone de dépôt
//
// Rendre tout le conteneur déplaçable casserait la sélection de texte et la
// saisie dans les champs qu'il contient : le navigateur démarrerait un
// déplacement au lieu de laisser sélectionner.
//
// Les flèches Monter/Descendre restent l'équivalent accessible au clavier.
// ─────────────────────────────────────────────────────────────────────────────
export default function useDragList(items, onReorder, keyOf = (x, i) => i) {
  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)

  const move = useCallback((from, to) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return
    const arr = [...items]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onReorder(arr)
  }, [items, onReorder])

  /** À placer sur la poignée : c'est le seul élément déplaçable. */
  const handleProps = useCallback((index) => {
    const key = keyOf(items[index], index)
    return {
      draggable: true,
      onDragStart: (e) => {
        setDragKey(key)
        e.dataTransfer.effectAllowed = 'move'
        try { e.dataTransfer.setData('text/plain', String(index)) } catch {}
        e.stopPropagation()
      },
      onDragEnd: () => { setDragKey(null); setOverKey(null) },
      style: { cursor: 'grab' },
    }
  }, [items, keyOf])

  /** À placer sur le conteneur : zone de dépôt, non déplaçable. */
  const dropProps = useCallback((index) => {
    const key = keyOf(items[index], index)
    return {
      onDragOver: (e) => {
        if (dragKey === null) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overKey !== key) setOverKey(key)
      },
      onDragLeave: () => { if (overKey === key) setOverKey(null) },
      onDrop: (e) => {
        if (dragKey === null) return
        e.preventDefault()
        const from = items.findIndex((it, i) => keyOf(it, i) === dragKey)
        if (from !== -1) move(from, index)
        setDragKey(null)
        setOverKey(null)
      },
    }
  }, [items, keyOf, dragKey, overKey, move])

  const isDragging = (index) => keyOf(items[index], index) === dragKey
  const isOver = (index) => keyOf(items[index], index) === overKey && !isDragging(index)

  return { handleProps, dropProps, move, isDragging, isOver, dragging: dragKey !== null }
}

/** Style visuel d'un élément pendant le déplacement. */
export function dragStyle({ dragging, over }) {
  return {
    opacity: dragging ? 0.4 : 1,
    boxShadow: over ? 'inset 0 3px 0 0 var(--c-primary)' : undefined,
    transition: 'opacity .12s',
  }
}
