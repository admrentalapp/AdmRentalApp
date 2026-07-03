import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type GearConfig = {
  teeth: number
  radius: number
  position: [number, number, number]
  color: number
  speed: number
  opacity: number
}

const GEARS: GearConfig[] = [
  { teeth: 16, radius: 2.6, position: [-3.4, 1.4, 0], color: 0xdc2626, speed: 0.35, opacity: 0.9 },
  { teeth: 12, radius: 1.7, position: [-0.6, -0.6, -0.5], color: 0xf87171, speed: -0.5, opacity: 0.8 },
  { teeth: 20, radius: 3.2, position: [3.6, 1.1, -1.6], color: 0x52525b, speed: 0.22, opacity: 0.6 },
  { teeth: 10, radius: 1.2, position: [2.2, -1.9, 0.4], color: 0xef4444, speed: -0.7, opacity: 0.85 },
  { teeth: 14, radius: 2.1, position: [-4.6, -2.2, -2.2], color: 0x3f3f46, speed: 0.4, opacity: 0.5 },
]

function createGearShape(teeth: number, radius: number) {
  const shape = new THREE.Shape()

  const toothDepth = radius * 0.18
  const rootRadius = radius - toothDepth
  const tipRadius = radius
  const stepCount = teeth * 4
  const angleStep = (Math.PI * 2) / stepCount

  for (let i = 0; i <= stepCount; i += 1) {
    const angle = i * angleStep
    const phase = i % 4
    const r = phase === 0 || phase === 3 ? rootRadius : tipRadius
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) {
      shape.moveTo(x, y)
    } else {
      shape.lineTo(x, y)
    }
  }

  const hole = new THREE.Path()
  hole.absarc(0, 0, radius * 0.35, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  return shape
}

export function LoginBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x09090b, 0.05)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.z = 11

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(4, 6, 8)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xdc2626, 1.1)
    rimLight.position.set(-6, -3, 4)
    scene.add(rimLight)

    scene.add(new THREE.AmbientLight(0x404046, 0.9))

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 2,
      curveSegments: 24,
    }

    const gearMeshes: { mesh: THREE.Mesh; speed: number }[] = []

    for (const config of GEARS) {
      const shape = createGearShape(config.teeth, config.radius)
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometry.center()

      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity: config.opacity,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...config.position)
      mesh.rotation.x = Math.random() * 0.4 - 0.2
      scene.add(mesh)
      gearMeshes.push({ mesh, speed: config.speed })
    }

    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    function onPointerMove(event: PointerEvent) {
      const rect = container!.getBoundingClientRect()
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }

    window.addEventListener('pointermove', onPointerMove)

    function onResize() {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let frameId = 0

    function animate() {
      const delta = clock.getDelta()

      for (const { mesh, speed } of gearMeshes) {
        mesh.rotation.z += speed * delta
      }

      pointer.x += (target.x - pointer.x) * 0.04
      pointer.y += (target.y - pointer.y) * 0.04

      camera.position.x = pointer.x * 1.1
      camera.position.y = -pointer.y * 0.8
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    if (prefersReduced) {
      renderer.render(scene, camera)
    } else {
      animate()
    }

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      for (const { mesh } of gearMeshes) {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
