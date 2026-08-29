import { useEffect, useState } from 'react'

export function useTypewriter(
  text: string,
  speed = 38,
  startDelay = 600,
  pauseDuration = 6000,
) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const typeText = () => {
      setDisplayed('')
      setDone(false)
      let i = 0
      intervalId = setInterval(() => {
        i += 1
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(intervalId)
          setDone(true)
          timeoutId = setTimeout(typeText, pauseDuration)
        }
      }, speed)
    }

    timeoutId = setTimeout(typeText, startDelay)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, speed, startDelay, pauseDuration])

  return { displayed, done }
}
