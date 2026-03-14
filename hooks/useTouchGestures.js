

// Sistema de gestos touch para dispositivos móveis
import React, { useCallback, useEffect, useRef, useState } from 'react'

export default function useTouchGestures() {
  const [gestures, setGestures] = useState({
    swipeLeft: false,
    swipeRight: false,
    swipeUp: false,
    swipeDown: false,
    pinch: false,
    tap: false,
    doubleTap: false,
    longPress: false
  })

  const [touchData, setTouchData] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    angle: 0,
    velocity: 0,
    scale: 1,
    rotation: 0
  })

  const touchRef = useRef({
    startTime: 0,
    lastTap: 0,
    longPressTimer: null,
    isLongPress: false,
    initialDistance: 0,
    initialAngle: 0
  })

  // Configurações dos gestos
  const config = {
    swipeThreshold: 50, // Distância mínima para considerar swipe
    swipeVelocity: 0.3, // Velocidade mínima para swipe
    tapThreshold: 10, // Distância máxima para considerar tap
    tapTime: 300, // Tempo máximo para tap
    doubleTapTime: 300, // Tempo máximo entre taps para double tap
    longPressTime: 500, // Tempo para long press
    pinchThreshold: 0.1, // Mudança mínima de escala para pinch
    rotationThreshold: 5 // Ângulo mínimo para rotação
  }

  // Detectar gestos
  const detectGestures = useCallback((touches) => {
    const newGestures = {
      swipeLeft: false,
      swipeRight: false,
      swipeUp: false,
      swipeDown: false,
      pinch: false,
      tap: false,
      doubleTap: false,
      longPress: false
    }

    if (touches.length === 1) {
      const touch = touches[0]
      const deltaX = touchData.deltaX
      const deltaY = touchData.deltaY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = touchData.velocity

      // Detectar swipe
      if (distance > config.swipeThreshold && velocity > config.swipeVelocity) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            newGestures.swipeRight = true
          } else {
            newGestures.swipeLeft = true
          }
        } else {
          if (deltaY > 0) {
            newGestures.swipeDown = true
          } else {
            newGestures.swipeUp = true
          }
        }
      }

      // Detectar tap
      if (distance < config.tapThreshold) {
        const currentTime = Date.now()
        const timeDiff = currentTime - touchRef.current.lastTap

        if (timeDiff < config.doubleTapTime) {
          newGestures.doubleTap = true
        } else {
          newGestures.tap = true
        }

        touchRef.current.lastTap = currentTime
      }

      // Detectar long press
      if (touchRef.current.isLongPress) {
        newGestures.longPress = true
        touchRef.current.isLongPress = false
      }
    } else if (touches.length === 2) {
      // Detectar pinch e rotação
      const touch1 = touches[0]
      const touch2 = touches[1]

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * 180 / Math.PI

      if (touchRef.current.initialDistance > 0) {
        const scaleChange = distance / touchRef.current.initialDistance
        const angleChange = Math.abs(angle - touchRef.current.initialAngle)

        if (Math.abs(scaleChange - 1) > config.pinchThreshold) {
          newGestures.pinch = true
        }
      }

      touchRef.current.initialDistance = distance
      touchRef.current.initialAngle = angle
    }

    setGestures(newGestures)
    return newGestures
  }, [touchData, config])

  // Manipulador de touch start
  const handleTouchStart = useCallback((e) => {
    const touches = Array.from(e.touches)
    const touch = touches[0]

    touchRef.current.startTime = Date.now()
    touchRef.current.isLongPress = false

    setTouchData(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0
    }))

    // Configurar timer para long press
    touchRef.current.longPressTimer = setTimeout(() => {
      touchRef.current.isLongPress = true
    }, config.longPressTime)

    // Inicializar dados para pinch
    if (touches.length === 2) {
      const touch1 = touches[0]
      const touch2 = touches[1]

      touchRef.current.initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      touchRef.current.initialAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * 180 / Math.PI
    }
  }, [config.longPressTime])

  // Manipulador de touch move
  const handleTouchMove = useCallback((e) => {
    const touches = Array.from(e.touches)
    const touch = touches[0]

    const currentTime = Date.now()
    const deltaTime = currentTime - touchRef.current.startTime
    const deltaX = touch.clientX - touchData.startX
    const deltaY = touch.clientY - touchData.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = deltaTime > 0 ? distance / deltaTime : 0
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

    setTouchData(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      distance,
      angle,
      velocity
    }))

    // Cancelar long press se houver movimento
    if (distance > config.tapThreshold && touchRef.current.longPressTimer) {
      clearTimeout(touchRef.current.longPressTimer)
      touchRef.current.longPressTimer = null
    }
  }, [touchData.startX, touchData.startY, config.tapThreshold])

  // Manipulador de touch end
  const handleTouchEnd = useCallback((e) => {
    const touches = Array.from(e.touches)

    // Limpar timer de long press
    if (touchRef.current.longPressTimer) {
      clearTimeout(touchRef.current.longPressTimer)
      touchRef.current.longPressTimer = null
    }

    // Detectar gestos
    const detectedGestures = detectGestures(touches)

    // Resetar dados após um delay
    setTimeout(() => {
      setGestures(prev => ({
        ...prev,
        swipeLeft: false,
        swipeRight: false,
        swipeUp: false,
        swipeDown: false,
        pinch: false,
        tap: false,
        doubleTap: false,
        longPress: false
      }))

      setTouchData(prev => ({
        ...prev,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        velocity: 0
      }))
    }, 100)

    return detectedGestures
  }, [detectGestures])

  // Função para adicionar eventos em um elemento
  const attachTouchElement = useCallback((elementRef, options = {}) => {
    const element = elementRef.current
    if (!element) return null

    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onPinch,
      onTap,
      onDoubleTap,
      onLongPress,
      preventDefault = true
    } = options

    const handleTouchStartWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      handleTouchStart(e)
    }

    const handleTouchMoveWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      handleTouchMove(e)
    }

    const handleTouchEndWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      const detectedGestures = handleTouchEnd(e)

      // Executar callbacks
      if (detectedGestures.swipeLeft && onSwipeLeft) onSwipeLeft(e)
      if (detectedGestures.swipeRight && onSwipeRight) onSwipeRight(e)
      if (detectedGestures.swipeUp && onSwipeUp) onSwipeUp(e)
      if (detectedGestures.swipeDown && onSwipeDown) onSwipeDown(e)
      if (detectedGestures.pinch && onPinch) onPinch(e)
      if (detectedGestures.tap && onTap) onTap(e)
      if (detectedGestures.doubleTap && onDoubleTap) onDoubleTap(e)
      if (detectedGestures.longPress && onLongPress) onLongPress(e)
    }

    element.addEventListener('touchstart', handleTouchStartWrapper, { passive: false })
    element.addEventListener('touchmove', handleTouchMoveWrapper, { passive: false })
    element.addEventListener('touchend', handleTouchEndWrapper, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStartWrapper)
      element.removeEventListener('touchmove', handleTouchMoveWrapper)
      element.removeEventListener('touchend', handleTouchEndWrapper)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Função para adicionar eventos globais
  const attachGlobalTouchGestures = useCallback((options = {}) => {
    const {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onPinch,
      onTap,
      onDoubleTap,
      onLongPress,
      preventDefault = false
    } = options

    const handleTouchStartWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      handleTouchStart(e)
    }

    const handleTouchMoveWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      handleTouchMove(e)
    }

    const handleTouchEndWrapper = (e) => {
      if (preventDefault) e.preventDefault()
      const detectedGestures = handleTouchEnd(e)

      // Executar callbacks
      if (detectedGestures.swipeLeft && onSwipeLeft) onSwipeLeft(e)
      if (detectedGestures.swipeRight && onSwipeRight) onSwipeRight(e)
      if (detectedGestures.swipeUp && onSwipeUp) onSwipeUp(e)
      if (detectedGestures.swipeDown && onSwipeDown) onSwipeDown(e)
      if (detectedGestures.pinch && onPinch) onPinch(e)
      if (detectedGestures.tap && onTap) onTap(e)
      if (detectedGestures.doubleTap && onDoubleTap) onDoubleTap(e)
      if (detectedGestures.longPress && onLongPress) onLongPress(e)
    }

    document.addEventListener('touchstart', handleTouchStartWrapper, { passive: !preventDefault })
    document.addEventListener('touchmove', handleTouchMoveWrapper, { passive: !preventDefault })
    document.addEventListener('touchend', handleTouchEndWrapper, { passive: !preventDefault })

    return () => {
      document.removeEventListener('touchstart', handleTouchStartWrapper)
      document.removeEventListener('touchmove', handleTouchMoveWrapper)
      document.removeEventListener('touchend', handleTouchEndWrapper)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Verificar se é dispositivo touch
  const isTouchDevice = useCallback(() => {
    return typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    )
  }, [])

  // Obter informações do touch atual
  const getTouchInfo = useCallback(() => {
    return {
      ...touchData,
      isActive: touchData.distance > 0,
      direction: touchData.angle >= -45 && touchData.angle <= 45 ? 'right' :
                 touchData.angle >= 45 && touchData.angle <= 135 ? 'down' :
                 touchData.angle >= 135 || touchData.angle <= -135 ? 'left' : 'up'
    }
  }, [touchData])

  return {
    // Estado dos gestos
    gestures,
    touchData,
    
    // Funções principais
    attachTouchElement,
    attachGlobalTouchGestures,
    
    // Funções utilitárias
    isTouchDevice,
    getTouchInfo,
    
    // Configurações
    config
  }
}
