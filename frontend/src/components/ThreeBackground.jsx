import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Particles ──
    const PARTICLE_COUNT = 180
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    const palette = [
      new THREE.Color('#7c5cfc'),
      new THREE.Color('#fc5c9c'),
      new THREE.Color('#5cf0fc'),
      new THREE.Color('#a78bfa'),
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
      sizes[i] = Math.random() * 1.5 + 0.3
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particleMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Floating Orbs ──
    const orbData = []
    const orbConfigs = [
      { radius: 4,   color: '#7c5cfc', x: -18, y: 10,  z: -10, speed: 0.0008 },
      { radius: 3,   color: '#fc5c9c', x: 20,  y: -8,  z: -15, speed: 0.0012 },
      { radius: 2.5, color: '#5cf0fc', x: 8,   y: 15,  z: -20, speed: 0.001  },
      { radius: 5,   color: '#7c5cfc', x: -10, y: -15, z: -25, speed: 0.0006 },
      { radius: 1.8, color: '#fc5c9c', x: 22,  y: 18,  z: -8,  speed: 0.0015 },
    ]

    orbConfigs.forEach(cfg => {
      const geo = new THREE.SphereGeometry(cfg.radius, 32, 32)
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.18,
        roughness: 0.1,
        metalness: 0.8,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(cfg.x, cfg.y, cfg.z)
      scene.add(mesh)
      orbData.push({ mesh, speed: cfg.speed, origY: cfg.y, t: Math.random() * Math.PI * 2 })
    })

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight('#7c5cfc', 3, 60)
    pointLight1.position.set(-20, 20, 10)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight('#fc5c9c', 3, 60)
    pointLight2.position.set(20, -10, 10)
    scene.add(pointLight2)

    // ── Mouse parallax ──
    let mouseX = 0, mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animation loop ──
    let reqId
    let t = 0
    const animate = () => {
      reqId = requestAnimationFrame(animate)
      t += 0.005

      // Rotate particle cloud
      particles.rotation.y = t * 0.06
      particles.rotation.x = t * 0.03

      // Float orbs
      orbData.forEach(o => {
        o.t += o.speed * 60
        o.mesh.position.y = o.origY + Math.sin(o.t) * 3
        o.mesh.rotation.x += 0.003
        o.mesh.rotation.y += 0.005
      })

      // Camera parallax
      camera.position.x += (mouseX * 4 - camera.position.x) * 0.04
      camera.position.y += (-mouseY * 4 - camera.position.y) * 0.04
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}
