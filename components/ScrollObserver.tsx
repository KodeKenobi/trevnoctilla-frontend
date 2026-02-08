"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { useIntersection } from "react-use"

interface ScrollObserverContextType {
  activeId: string | null
  setActiveId: (id: string | null) => void
  activeIndex: number | null
  setActiveIndex: (index: number | null) => void
}

const ScrollObserverContext = createContext<ScrollObserverContextType | undefined>(undefined)

export function ScrollObserver({
  children,
  className,
  as: Component = "div",
}: {
  children: (isHidden: boolean) => React.ReactNode
  className?: string
  as?: React.ElementType
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const isHidden = activeId === null

  return (
    <ScrollObserverContext.Provider value={{ activeId, setActiveId, activeIndex, setActiveIndex }}>
      <Component className={className}>{children(isHidden)}</Component>
    </ScrollObserverContext.Provider>
  )
}

function TriggerGroup({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}) {
  return <Component className={className}>{children}</Component>
}

interface TriggerProps {
  id: string
  index?: number // Optional, but usually derived from loop or passed
  children: (isActive: boolean) => React.ReactNode
  className?: string
  as?: React.ElementType
}

function Trigger({
  id,
  index,
  children,
  className,
  as: Component = "div",
}: TriggerProps) {
  const context = useContext(ScrollObserverContext)
  const ref = useRef<HTMLDivElement>(null)
  const intersection = useIntersection(ref, {
    root: null,
    rootMargin: "-50% 0px -50% 0px", // Middle of the viewport
    threshold: 0,
  })

  useEffect(() => {
    if (intersection?.isIntersecting) {
      context?.setActiveId(id)
      if (typeof index === 'number') {
        context?.setActiveIndex(index)
      } else {
        // Try to infer index from id if it matches features-X
        const match = id.match(/-(\d+)$/)
        if (match) {
          context?.setActiveIndex(parseInt(match[1]))
        }
      }
    }
  }, [intersection, id, index, context])

  const isActive = context?.activeId === id

  return (
    <Component ref={ref} id={id} className={className}>
      {children(isActive)}
    </Component>
  )
}

function ReactorGroup({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}) {
  // Inject index into Reactor children if they don't have it
  const childrenWithIndex = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === Reactor) {
      return React.cloneElement(child as React.ReactElement<any>, { index })
    }
    return child
  })

  return <Component className={className}>{childrenWithIndex}</Component>
}

interface ReactorProps {
  index?: number
  id?: string
  children: (isActive: boolean) => React.ReactNode
  className?: string
  as?: React.ElementType
}

function Reactor({
  index,
  id,
  children,
  className,
  as: Component = "div",
}: ReactorProps) {
  const context = useContext(ScrollObserverContext)
  
  let isActive = false
  if (id) {
    isActive = context?.activeId === id
  } else if (typeof index === 'number') {
    isActive = context?.activeIndex === index
  }

  return <Component className={className}>{children(isActive)}</Component>
}

// Attach sub-components
ScrollObserver.TriggerGroup = TriggerGroup
ScrollObserver.Trigger = Trigger
ScrollObserver.ReactorGroup = ReactorGroup
ScrollObserver.Reactor = Reactor
