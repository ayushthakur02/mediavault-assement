import { useEffect, useState } from 'react'

const useDebounce = <T,>(value:T, delay = 500) => {
    const[ debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay);
   
        return () => {
            clearTimeout(timer)
        }
    }, [delay, value])
   
    return debouncedValue
}

export default useDebounce