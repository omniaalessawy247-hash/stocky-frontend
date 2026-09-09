import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export default function AnimatedNumber({ value, prefix = '', decimals = 0 }) {
  const motionValue = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState(0)
  const rounded = useTransform(motionValue, (latest) => Number(latest.toFixed(decimals)))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.1, ease: 'easeOut' })
    const unsubscribe = rounded.on('change', (latest) => setDisplayValue(latest))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value])

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, { maximumFractionDigits: decimals })}
    </span>
  )
}