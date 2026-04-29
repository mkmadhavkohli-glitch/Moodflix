import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

/* ─────────────────────────────────────────────
   CineCameraCanvas — dedicated Three.js canvas
   for the hero section 3D camera model
───────────────────────────────────────────── */
function CineCameraCanvas() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // ✅ FIX 1: Enable ACES Filmic tone mapping for cinematic shine
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.6

    // ✅ FIX 2: Set correct output color space for accurate brightness
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      renderer.setSize(w, h)
      camCam.aspect = w / h
      camCam.updateProjectionMatrix()
    }

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene()
    const camCam = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    camCam.position.set(0, 1.5, 18)
    camCam.lookAt(0, 0, 0)

    /* ── Lights ── */
    // ✅ FIX 3: Stronger ambient to lift overall brightness
    scene.add(new THREE.AmbientLight(0x8866ff, 0.9))

    // ✅ FIX 4: Much stronger key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(8, 10, 12)
    keyLight.castShadow = true
    scene.add(keyLight)

    // ✅ FIX 5: Stronger rim and fill lights
    const rimLight = new THREE.PointLight(0x7c5cfc, 5.0, 50)
    rimLight.position.set(-10, 5, -4)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x5cf0fc, 3.5, 40)
    fillLight.position.set(10, -4, 8)
    scene.add(fillLight)

    // ✅ FIX 6: Extra top light for metallic sheen on top surfaces
    const topLight = new THREE.DirectionalLight(0xffffff, 1.5)
    topLight.position.set(0, 20, 5)
    scene.add(topLight)

    // ✅ FIX 7: Extra front fill light
    const frontLight = new THREE.PointLight(0xaaddff, 2.0, 35)
    frontLight.position.set(0, 2, 15)
    scene.add(frontLight)

    const lensSpot = new THREE.SpotLight(0x5cf0fc, 6, 30, Math.PI / 7, 0.35, 1.2)
    lensSpot.position.set(0, 0, 14)
    lensSpot.target.position.set(0, 0, 0)
    scene.add(lensSpot)
    scene.add(lensSpot.target)

    /* ── Materials ── */
    // ✅ FIX 8: Body color lifted to rich dark blue-purple, higher metalness
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1535,
      roughness: 0.12,
      metalness: 0.95,
      envMapIntensity: 1.5,
    })

    // ✅ FIX 9: Accent material with emissive blue glow
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x221848,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0x2a1a5e,
      emissiveIntensity: 0.25,
    })

    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0a0520,
      roughness: 0.0,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      emissive: 0x5cf0fc,
      emissiveIntensity: 1.2,
    })

    const glowEdgeMat = new THREE.LineBasicMaterial({ color: 0x7c5cfc, transparent: true, opacity: 0.85 })
    const cyanEdgeMat = new THREE.LineBasicMaterial({ color: 0x5cf0fc, transparent: true, opacity: 0.9 })
    const pinkEdgeMat = new THREE.LineBasicMaterial({ color: 0xfc5c9c, transparent: true, opacity: 0.8 })

    // ✅ FIX 10: Gold with stronger emissive for that metallic glint
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.08,
      metalness: 0.98,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.35,
    })

    const shutMat = new THREE.MeshStandardMaterial({
      color: 0xfc5c9c,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0xfc5c9c,
      emissiveIntensity: 1.2,
    })

    const addEdges = (geo, mat, parent, pos, rot) => {
      const el = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat)
      if (pos) el.position.copy(pos)
      if (rot) el.rotation.copy(rot)
      parent.add(el)
    }

    /* ── Camera Group ── */
    const cg = new THREE.Group()
    scene.add(cg)

    // 1. Main body
    const bodyG = new THREE.BoxGeometry(5.4, 3.2, 2.8)
    cg.add(new THREE.Mesh(bodyG, bodyMat))
    addEdges(bodyG, glowEdgeMat, cg)

    // 2. Grip
    const gripG = new THREE.BoxGeometry(1.05, 3.2, 2.4)
    const gripM = new THREE.Mesh(gripG, accentMat)
    gripM.position.set(3.2, 0, 0)
    cg.add(gripM)
    addEdges(gripG, glowEdgeMat, cg, new THREE.Vector3(3.2, 0, 0))

    // 3. Top plate
    const topG = new THREE.BoxGeometry(5.4, 0.28, 2.8)
    const topM = new THREE.Mesh(topG, accentMat)
    topM.position.set(0, 1.74, 0)
    cg.add(topM)
    addEdges(topG, pinkEdgeMat, cg, new THREE.Vector3(0, 1.74, 0))

    // 4. Viewfinder hump
    const vfG = new THREE.BoxGeometry(1.7, 0.9, 1.9)
    const vfM = new THREE.Mesh(vfG, accentMat)
    vfM.position.set(-0.9, 2.17, 0.1)
    cg.add(vfM)
    addEdges(vfG, pinkEdgeMat, cg, new THREE.Vector3(-0.9, 2.17, 0.1))

    // 5. Viewfinder eyepiece
    const vpG = new THREE.CylinderGeometry(0.28, 0.32, 0.5, 16)
    const vpM = new THREE.Mesh(vpG, accentMat)
    vpM.rotation.x = Math.PI / 2
    vpM.position.set(-0.9, 2.17, -1.4)
    cg.add(vpM)

    // 6. Accessory shoe
    const shoeM = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.9), goldMat)
    shoeM.position.set(0.8, 1.93, 0.3)
    cg.add(shoeM)

    // 7. Shutter button
    const shutM2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 20), shutMat)
    shutM2.position.set(2.4, 1.73, 0.8)
    cg.add(shutM2)

    // 8. Mode dial
    const dialG = new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24)
    const dialM = new THREE.Mesh(dialG, goldMat)
    dialM.position.set(1.6, 1.84, -0.3)
    cg.add(dialM)
    addEdges(dialG, cyanEdgeMat, cg, new THREE.Vector3(1.6, 1.84, -0.3))

    // 9. Lens barrel
    const lensBarG = new THREE.CylinderGeometry(1.15, 1.2, 1.8, 40)
    const lensBarM = new THREE.Mesh(lensBarG, accentMat)
    lensBarM.rotation.x = Math.PI / 2
    lensBarM.position.set(0, 0, 2.28)
    cg.add(lensBarM)
    addEdges(lensBarG, cyanEdgeMat, cg,
      new THREE.Vector3(0, 0, 2.28),
      new THREE.Euler(Math.PI / 2, 0, 0))

    // 10. Focus ring (gold torus)
    const focusM = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.12, 8, 40), goldMat)
    focusM.position.set(0, 0, 2.65)
    cg.add(focusM)

    // 11. Zoom ring (purple torus)
    const zoomG = new THREE.TorusGeometry(1.18, 0.1, 8, 40)
    const zoomM = new THREE.Mesh(zoomG, new THREE.MeshStandardMaterial({
      color: 0x7c5cfc,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x7c5cfc,
      emissiveIntensity: 0.6,
    }))
    zoomM.position.set(0, 0, 1.7)
    cg.add(zoomM)
    addEdges(zoomG, glowEdgeMat, cg, new THREE.Vector3(0, 0, 1.7))

    // 12. Lens front glass
    const lensFront = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), lensGlassMat)
    lensFront.position.set(0, 0, 3.2)
    cg.add(lensFront)

    // 13. Lens reflection rings
    ;[0.72, 0.5, 0.3].forEach((r, i) => {
      const rm = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.018, 6, 40),
        new THREE.MeshBasicMaterial({
          color: [0x5cf0fc, 0x7c5cfc, 0xffffff][i],
          transparent: true,
          opacity: [0.6, 0.45, 0.35][i],
        })
      )
      rm.position.set(0, 0, 3.21 + i * 0.008)
      cg.add(rm)
    })

    // 14. Lens specular highlight — ✅ FIX 11: bigger, brighter specular
    const specM = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    )
    specM.position.set(0.3, 0.28, 3.22)
    cg.add(specM)

    // 14b. Second small specular dot for extra realism
    const spec2M = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.7 })
    )
    spec2M.position.set(-0.25, -0.2, 3.22)
    cg.add(spec2M)

    // 15. Back panel
    const backG = new THREE.BoxGeometry(5.4, 3.2, 0.15)
    const backM = new THREE.Mesh(backG, accentMat)
    backM.position.set(0, 0, -1.55)
    cg.add(backM)
    addEdges(backG, glowEdgeMat, cg, new THREE.Vector3(0, 0, -1.55))

    // 16. LCD screen
    const lcdM = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 2.0, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0x0a0520,
        roughness: 0.05,
        metalness: 0.2,
        emissive: 0x7c5cfc,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.95,
      })
    )
    lcdM.position.set(-0.3, -0.1, -1.64)
    cg.add(lcdM)
    addEdges(new THREE.BoxGeometry(2.8, 2.0, 0.06), cyanEdgeMat, cg, new THREE.Vector3(-0.3, -0.1, -1.64))

    // 17. Film reel
    const reelG = new THREE.TorusGeometry(0.55, 0.1, 8, 32)
    const reelM = new THREE.Mesh(reelG, new THREE.MeshStandardMaterial({
      color: 0x3a2a6a,
      roughness: 0.3,
      metalness: 0.75,
      emissive: 0x7c5cfc,
      emissiveIntensity: 0.3,
    }))
    reelM.position.set(-2.4, 0.2, 1.45)
    cg.add(reelM)
    addEdges(reelG, glowEdgeMat, cg, new THREE.Vector3(-2.4, 0.2, 1.45))

    // 18. Brand plate
    const bpM = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.35, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x7c5cfc,
        roughness: 0.1,
        metalness: 0.95,
        emissive: 0x7c5cfc,
        emissiveIntensity: 0.9,
      })
    )
    bpM.position.set(-1.2, -0.9, 1.46)
    cg.add(bpM)

    // 19. Strap lugs
    ;[[-2.55, 1.0, 0.4], [-2.55, -0.6, 0.4]].forEach(p => {
      const lm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.55), goldMat)
      lm.position.set(...p)
      cg.add(lm)
    })

    // 20. Floating particles around camera
    const fpg = new THREE.BufferGeometry()
    const fp = new Float32Array(120 * 3)
    const fc = new Float32Array(120 * 3)
    const fcList = [[0.486, 0.361, 0.988], [0.988, 0.361, 0.612], [0.361, 0.941, 0.988]]
    for (let i = 0; i < 120; i++) {
      const ang = Math.random() * Math.PI * 2
      const rad = 4 + Math.random() * 5
      const ht = (Math.random() - 0.5) * 7
      fp[i * 3] = Math.cos(ang) * rad
      fp[i * 3 + 1] = ht
      fp[i * 3 + 2] = Math.sin(ang) * rad
      const c = fcList[i % 3]
      fc[i * 3] = c[0]; fc[i * 3 + 1] = c[1]; fc[i * 3 + 2] = c[2]
    }
    fpg.setAttribute('position', new THREE.BufferAttribute(fp, 3))
    fpg.setAttribute('color', new THREE.BufferAttribute(fc, 3))
    const floatPts = new THREE.Points(fpg,
      new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.85 }))
    scene.add(floatPts)

    /* ── Drag to rotate ── */
    let isDragging = false, prevX = 0, prevY = 0
    let rotY = 0.3, rotX = 0.12
    let velX = 0, velY = 0
    let autoRotate = true

    const onMouseDown = e => { isDragging = true; autoRotate = false; prevX = e.clientX; prevY = e.clientY }
    const onMouseUp   = () => { isDragging = false }
    const onMouseMove = e => {
      if (!isDragging) return
      velY += (e.clientX - prevX) * 0.008
      velX += (e.clientY - prevY) * 0.006
      prevX = e.clientX; prevY = e.clientY
    }
    const onTouchStart = e => { isDragging = true; autoRotate = false; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY }
    const onTouchEnd   = () => { isDragging = false }
    const onTouchMove  = e => {
      if (!isDragging) return
      velY += (e.touches[0].clientX - prevX) * 0.008
      velX += (e.touches[0].clientY - prevY) * 0.006
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    resize()
    window.addEventListener('resize', resize)

    /* ── Animation loop ── */
    let t = 0
    let reqId
    const animate = () => {
      reqId = requestAnimationFrame(animate)
      t += 0.016

      if (autoRotate) {
        rotY += 0.004
        rotX = Math.sin(t * 0.3) * 0.12
      } else {
        rotY += velY; rotX += velX
        rotX = Math.max(-0.6, Math.min(0.6, rotX))
        velY *= 0.91; velX *= 0.91
        if (Math.abs(velX) < 0.0005 && Math.abs(velY) < 0.0005 && !isDragging) {
          autoRotate = true
        }
      }

      cg.rotation.y = rotY
      cg.rotation.x = rotX
      cg.position.y = Math.sin(t * 0.6) * 0.35

      // ✅ FIX 12: More dramatic pulsing for extra shimmer
      lensGlassMat.emissiveIntensity = 0.9 + Math.sin(t * 1.8) * 0.45
      shutMat.emissiveIntensity      = 1.0 + Math.sin(t * 2.2 + 1) * 0.45
      lensSpot.intensity             = 5.0 + Math.sin(t * 1.8) * 2.0
      rimLight.intensity             = 4.5 + Math.sin(t * 0.9 + 2) * 1.2

      reelM.rotation.z  += 0.018
      floatPts.rotation.y += 0.0018

      renderer.render(scene, camCam)
    }
    animate()

    return () => {
      cancelAnimationFrame(reqId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={wrapRef} className="hero-cam-wrap">
      <div className="cam-glow-ring" />
      <canvas ref={canvasRef} id="cam-canvas" style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />
      <p className="cam-hint">Drag to rotate</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BackgroundCanvas — floating orbs + particles
───────────────────────────────────────────── */
function BackgroundCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    camera.position.set(0, 0, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    // ✅ Background canvas also gets tone mapping for consistency
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const orbGeo = new THREE.SphereGeometry(1, 24, 24)
    const mats = {
      p: new THREE.MeshPhongMaterial({ color: 0x7c5cfc, transparent: true, opacity: 0.18, emissive: 0x7c5cfc, emissiveIntensity: 0.35 }),
      k: new THREE.MeshPhongMaterial({ color: 0xfc5c9c, transparent: true, opacity: 0.15, emissive: 0xfc5c9c, emissiveIntensity: 0.35 }),
      c: new THREE.MeshPhongMaterial({ color: 0x5cf0fc, transparent: true, opacity: 0.13, emissive: 0x5cf0fc, emissiveIntensity: 0.35 }),
    }
    const orbs = []
    ;[
      { m: 'p', s: 4.5, x: -12, y: 8,   z: -10 },
      { m: 'k', s: 3.2, x: 14,  y: -5,  z: -8  },
      { m: 'c', s: 2.2, x: 4,   y: 12,  z: -15 },
      { m: 'p', s: 1.8, x: -8,  y: -12, z: -5  },
      { m: 'k', s: 3.8, x: -4,  y: -4,  z: -18 },
      { m: 'c', s: 2.8, x: -16, y: 2,   z: -12 },
    ].forEach(o => {
      const mesh = new THREE.Mesh(orbGeo, mats[o.m].clone())
      mesh.scale.setScalar(o.s)
      mesh.position.set(o.x, o.y, o.z)
      mesh.userData = { bx: o.x, by: o.y, t: Math.random() * 100 }
      scene.add(mesh); orbs.push(mesh)
    })

    const pg = new THREE.BufferGeometry()
    const pp = new Float32Array(300 * 3), pc = new Float32Array(300 * 3)
    const cls = [[0.486, 0.361, 0.988], [0.988, 0.361, 0.612], [0.361, 0.941, 0.988]]
    for (let i = 0; i < 300; i++) {
      pp[i * 3] = (Math.random() - 0.5) * 90
      pp[i * 3 + 1] = (Math.random() - 0.5) * 70
      pp[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10
      const c = cls[i % 3]; pc[i * 3] = c[0]; pc[i * 3 + 1] = c[1]; pc[i * 3 + 2] = c[2]
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    pg.setAttribute('color', new THREE.BufferAttribute(pc, 3))
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.55 }))
    scene.add(pts)

    const r1 = new THREE.Mesh(new THREE.TorusGeometry(14, 0.035, 8, 100), new THREE.MeshBasicMaterial({ color: 0x7c5cfc, transparent: true, opacity: 0.06 }))
    r1.rotation.x = Math.PI / 3; r1.position.set(-5, 2, -18); scene.add(r1)
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(9, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: 0xfc5c9c, transparent: true, opacity: 0.05 }))
    r2.rotation.set(Math.PI / 5, Math.PI / 4, 0); r2.position.set(12, -4, -14); scene.add(r2)

    scene.add(new THREE.AmbientLight(0x7c5cfc, 0.6))
    const pl1 = new THREE.PointLight(0xfc5c9c, 1.2, 80); pl1.position.set(15, -10, -5); scene.add(pl1)
    const pl2 = new THREE.PointLight(0x5cf0fc, 0.9, 60); pl2.position.set(-15, 10, -8); scene.add(pl2)

    let mx = 0, my = 0
    const onMove = e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = -(e.clientY / window.innerHeight - 0.5) * 2 }
    document.addEventListener('mousemove', onMove, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    let t = 0, reqId
    const loop = () => {
      reqId = requestAnimationFrame(loop); t += 0.007
      orbs.forEach(o => {
        o.userData.t += 0.004
        o.position.x = o.userData.bx + Math.sin(o.userData.t * 1.1) * 2.5
        o.position.y = o.userData.by + Math.cos(o.userData.t * 0.9) * 2
      })
      pts.rotation.y += 0.0002
      r1.rotation.z += 0.0012; r2.rotation.z -= 0.0009
      camera.position.x += (mx * 2.5 - camera.position.x) * 0.02
      camera.position.y += (my * 1.5 - camera.position.y) * 0.02
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(reqId)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}

/* ─────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────── */
export default function Landing() {

  /* Navbar scroll effect */
  useEffect(() => {
    const nav = document.getElementById('land-nav')
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('land-visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.land-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const moods = [
    { emoji: '😂', label: 'Happy' },    { emoji: '😢', label: 'Sad' },
    { emoji: '😤', label: 'Angry' },    { emoji: '😰', label: 'Anxious' },
    { emoji: '🥰', label: 'Romantic' }, { emoji: '😴', label: 'Bored' },
    { emoji: '🤩', label: 'Excited' },  { emoji: '😌', label: 'Calm' },
    { emoji: '🌙', label: 'Nostalgic' },{ emoji: '🤔', label: 'Curious' },
    { emoji: '😎', label: 'Bold' },     { emoji: '🎃', label: 'Spooky' },
  ]

  const features = [
    { icon: '🎭', color: 'fi-purple', title: 'Mood-Based Recs',   desc: '12 emotions × language + platform + format filters = recommendations that match how you feel right now.' },
    { icon: '🤖', color: 'fi-pink',   title: 'AI Chatbot',        desc: 'Chat with MoodFlix AI powered by Llama 3 via GROQ. Responds in English, Hindi, or Hinglish automatically.' },
    { icon: '🌌', color: 'fi-cyan',   title: '3D Immersive UI',   desc: 'Three.js floating orbs, glassmorphism cards, and a deep-space aesthetic that makes browsing feel cinematic.' },
    { icon: '💎', color: 'fi-gold',   title: 'Hidden Gems',       desc: 'Beyond obvious picks — MoodFlix uncovers underrated films and wild-card suggestions you\'d never find alone.' },
    { icon: '🔐', color: 'fi-purple', title: 'Secure Auth',       desc: 'Sign in with email or Google OAuth via Supabase. Your watchlist, preferences, and chat history — always yours.' },
    { icon: '📱', color: 'fi-pink',   title: 'Fully Responsive',  desc: 'Dark glassmorphism UI that looks stunning on every screen — from 4K monitors to mobile devices.' },
  ]

  return (
    <>
      {/* ── Inline styles ── */}
      <style>{`
        .land-page *,
        .land-page *::before,
        .land-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .land-page {
          font-family: 'Inter', sans-serif;
          background: #050814;
          color: #e2e8f0;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* blobs */
        .land-blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 1; filter: blur(80px);
          animation: blobMove 12s ease-in-out infinite;
        }
        .land-blob1 { width:500px;height:500px;top:-100px;right:-100px;background:radial-gradient(circle,rgba(124,92,252,0.12),transparent 70%);animation-delay:0s; }
        .land-blob2 { width:400px;height:400px;bottom:10%;left:-80px;background:radial-gradient(circle,rgba(252,92,156,0.1),transparent 70%);animation-delay:-6s; }
        .land-blob3 { width:300px;height:300px;top:50%;left:50%;background:radial-gradient(circle,rgba(92,240,252,0.06),transparent 70%);animation-delay:-3s; }
        @keyframes blobMove {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(30px,-20px) scale(1.05)}
          66%{transform:translate(-20px,15px) scale(0.97)}
        }

        /* navbar */
        #land-nav {
          position:fixed;top:0;left:0;right:0;z-index:100;
          padding:0 5%;height:72px;
          display:flex;align-items:center;justify-content:space-between;
          background:rgba(5,8,20,0);border-bottom:1px solid transparent;
          transition:all 0.4s ease;
        }
        #land-nav.scrolled {
          background:rgba(5,8,20,0.88);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .land-logo { display:flex;align-items:center;gap:10px;text-decoration:none; }
        .land-logo-cube {
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,#7c5cfc,#fc5c9c);
          display:flex;align-items:center;justify-content:center;
          font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff;
          box-shadow:0 8px 24px rgba(124,92,252,0.5);
          animation:cubePulse 3s ease-in-out infinite;
        }
        @keyframes cubePulse {
          0%,100%{box-shadow:0 8px 24px rgba(124,92,252,0.5)}
          50%{box-shadow:0 8px 40px rgba(252,92,156,0.7),0 0 60px rgba(124,92,252,0.3)}
        }
        .land-logo-text {
          font-family:'Syne',sans-serif;font-weight:800;font-size:20px;
          background:linear-gradient(135deg,#7c5cfc,#fc5c9c,#5cf0fc);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .land-nav-links { display:flex;align-items:center;gap:8px; }
        .land-nav-link {
          padding:8px 18px;border-radius:10px;font-size:14px;font-weight:500;
          text-decoration:none;color:rgba(255,255,255,0.6);
          transition:all 0.25s ease;border:1px solid transparent;
        }
        .land-nav-link:hover{color:#fff;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1)}
        .land-nav-btn {
          padding:9px 22px;border-radius:10px;font-size:14px;font-weight:600;
          text-decoration:none;color:#fff;
          background:linear-gradient(135deg,#7c5cfc,#fc5c9c);
          box-shadow:0 4px 16px rgba(124,92,252,0.4);
          transition:all 0.25s ease;
        }
        .land-nav-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(124,92,252,0.6)}
        .land-nav-btn.outline {
          background:transparent;border:1px solid rgba(124,92,252,0.4);
          color:rgba(255,255,255,0.8);box-shadow:none;margin-right:6px;
        }
        .land-nav-btn.outline:hover{background:rgba(124,92,252,0.1);border-color:#7c5cfc;color:#fff}

        /* hero */
        .land-hero {
          position:relative;z-index:10;min-height:100vh;
          display:grid;grid-template-columns:1fr 1fr;
          align-items:center;padding:100px 6% 60px;gap:0;
        }
        .land-hero-text { display:flex;flex-direction:column;align-items:flex-start; }
        .land-badge {
          display:inline-flex;align-items:center;gap:8px;
          padding:7px 16px;border-radius:50px;
          background:rgba(124,92,252,0.12);border:1px solid rgba(124,92,252,0.3);
          font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);
          letter-spacing:0.08em;text-transform:uppercase;margin-bottom:28px;
          animation:fadeInUp 0.8s ease forwards;
        }
        .land-badge-dot{width:6px;height:6px;border-radius:50%;background:#7c5cfc;animation:blink 2s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .land-hero-text h1 {
          font-family:'Syne',sans-serif;
          font-size:clamp(42px,5.5vw,76px);font-weight:800;line-height:1.05;
          margin-bottom:24px;text-align:left;
          animation:fadeInUp 0.8s 0.15s ease both;
        }
        .land-grad {
          background:linear-gradient(135deg,#fff 0%,#7c5cfc 40%,#fc5c9c 70%,#5cf0fc 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          display:block;
        }
        .land-hero-text p {
          font-size:clamp(15px,1.6vw,18px);color:rgba(255,255,255,0.5);line-height:1.75;
          max-width:460px;margin:0 0 40px;text-align:left;
          animation:fadeInUp 0.8s 0.25s ease both;
        }
        .land-cta { display:flex;align-items:center;gap:14px;flex-wrap:wrap;animation:fadeInUp 0.8s 0.35s ease both; }
        .land-btn {
          padding:15px 34px;border-radius:14px;font-size:16px;font-weight:600;
          text-decoration:none;transition:all 0.3s ease;
          display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;
        }
        .land-btn.primary {
          color:#fff;background:linear-gradient(135deg,#7c5cfc,#fc5c9c);
          box-shadow:0 8px 30px rgba(124,92,252,0.45);
        }
        .land-btn.primary:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(124,92,252,0.65)}
        .land-btn.ghost {
          color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.12);
        }
        .land-btn.ghost:hover{background:rgba(255,255,255,0.09);color:#fff}
        .land-arrow{transition:transform 0.25s ease}
        .land-btn.primary:hover .land-arrow{transform:translateX(4px)}

        /* camera wrap */
        .hero-cam-wrap {
          position:relative;display:flex;align-items:center;justify-content:center;height:520px;
        }
        #cam-canvas{width:100%;height:100%;display:block;}
        .cam-glow-ring {
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:380px;height:380px;border-radius:50%;
          background:radial-gradient(circle,rgba(124,92,252,0.18) 0%,rgba(92,240,252,0.09) 50%,transparent 75%);
          pointer-events:none;animation:glowPulse 3.5s ease-in-out infinite;
        }
        @keyframes glowPulse{0%,100%{opacity:0.8;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
        .cam-hint{
          position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
          font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.08em;
          text-transform:uppercase;white-space:nowrap;
        }

        /* scroll hint */
        .land-scroll-hint {
          position:absolute;bottom:32px;left:50%;transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:8px;
          animation:fadeInUp 1.2s 0.8s ease both;
          color:rgba(255,255,255,0.25);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;z-index:20;
        }
        .land-scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,rgba(124,92,252,0.6),transparent);animation:scrollDown 1.8s ease-in-out infinite}
        @keyframes scrollDown{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}

        /* sections */
        .land-section { position:relative;z-index:10;padding:80px 5%; }
        .land-section-center { text-align:center; }
        .land-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#7c5cfc;margin-bottom:14px;}
        .land-title{font-family:'Syne',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:800;color:#fff;margin-bottom:16px;line-height:1.1;}
        .land-sub{font-size:17px;color:rgba(255,255,255,0.4);max-width:480px;margin:0 auto 56px;line-height:1.65;}

        /* moods grid */
        .land-moods-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;max-width:900px;margin:0 auto;}
        .land-mood-pill{
          padding:16px 12px;border-radius:16px;cursor:pointer;
          background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;
        }
        .land-mood-pill:hover{transform:translateY(-6px) scale(1.04);border-color:rgba(124,92,252,0.4);background:rgba(124,92,252,0.08);box-shadow:0 20px 50px rgba(124,92,252,0.2);}
        .land-mood-emoji{font-size:28px;line-height:1;}
        .land-mood-label{font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);font-family:'Syne',sans-serif;}

        /* features grid */
        .land-features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1100px;margin:0 auto;}
        .land-feature-card{
          padding:32px 28px;border-radius:20px;
          background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
          transition:all 0.35s ease;position:relative;overflow:hidden;
        }
        .land-feature-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(124,92,252,0.08) 0%,transparent 70%);opacity:0;transition:opacity 0.3s ease;}
        .land-feature-card:hover{transform:translateY(-5px);border-color:rgba(124,92,252,0.25);box-shadow:0 24px 60px rgba(0,0,0,0.4);}
        .land-feature-card:hover::before{opacity:1;}
        .land-feature-icon{width:52px;height:52px;border-radius:14px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;font-size:22px;position:relative;z-index:1;}
        .fi-purple{background:linear-gradient(135deg,rgba(124,92,252,0.25),rgba(124,92,252,0.1));border:1px solid rgba(124,92,252,0.3)}
        .fi-pink{background:linear-gradient(135deg,rgba(252,92,156,0.25),rgba(252,92,156,0.1));border:1px solid rgba(252,92,156,0.3)}
        .fi-cyan{background:linear-gradient(135deg,rgba(92,240,252,0.25),rgba(92,240,252,0.1));border:1px solid rgba(92,240,252,0.3)}
        .fi-gold{background:linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.1));border:1px solid rgba(251,191,36,0.3)}
        .land-feature-card h3{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:10px;position:relative;z-index:1;}
        .land-feature-card p{font-size:14px;color:rgba(255,255,255,0.45);line-height:1.7;position:relative;z-index:1;}

        /* steps */
        .land-steps{display:flex;align-items:flex-start;justify-content:center;gap:0;max-width:850px;margin:0 auto;flex-wrap:wrap;}
        .land-step{flex:1;min-width:160px;padding:28px 20px;position:relative;}
        .land-step:not(:last-child)::after{content:'';position:absolute;top:48px;right:-1px;width:50%;height:1px;background:linear-gradient(to right,rgba(124,92,252,0.3),transparent);}
        .land-step-num{width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#7c5cfc,#fc5c9c);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff;margin:0 auto 18px;box-shadow:0 8px 24px rgba(124,92,252,0.4);}
        .land-step h4{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;}
        .land-step p{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.65;}

        /* stats */
        .land-stats-card{max-width:900px;margin:0 auto;background:rgba(124,92,252,0.06);border:1px solid rgba(124,92,252,0.18);border-radius:24px;padding:48px 40px;display:flex;justify-content:space-around;flex-wrap:wrap;gap:28px;text-align:center;}
        .land-stat-num{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;background:linear-gradient(135deg,#7c5cfc,#fc5c9c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:6px;}
        .land-stat-label{font-size:14px;color:rgba(255,255,255,0.4);font-weight:500;}

        /* tech pills */
        .land-tech-pills{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:700px;margin:0 auto;}
        .land-tech-pill{padding:9px 20px;border-radius:50px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);transition:all 0.25s ease;}
        .land-tech-pill:hover{background:rgba(124,92,252,0.12);border-color:rgba(124,92,252,0.4);color:#fff;transform:translateY(-2px);}
        .land-tech-pill span{color:#7c5cfc;margin-right:5px;}

        /* cta */
        .land-cta-box{max-width:620px;margin:0 auto;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:60px 48px;position:relative;overflow:hidden;text-align:center;}
        .land-cta-box::before{content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,92,252,0.12),transparent 70%);pointer-events:none;}
        .land-cta-box h2{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,42px);font-weight:800;color:#fff;margin-bottom:14px;position:relative;z-index:1;}
        .land-cta-box p{font-size:16px;color:rgba(255,255,255,0.45);margin-bottom:32px;line-height:1.65;position:relative;z-index:1;}
        .land-cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;}

        /* footer */
        .land-footer{position:relative;z-index:10;padding:28px 5%;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;color:rgba(255,255,255,0.25);font-size:13px;}
        .land-footer-logo{display:flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;background:linear-gradient(135deg,#7c5cfc,#fc5c9c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .land-footer-mini{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#7c5cfc,#fc5c9c);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;}

        /* reveal */
        .land-reveal{opacity:0;transform:translateY(28px);transition:all 0.7s cubic-bezier(0.22,1,0.36,1);}
        .land-visible{opacity:1;transform:translateY(0);}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

        /* responsive */
        @media(max-width:900px){
          .land-hero{grid-template-columns:1fr;text-align:center;padding:90px 5% 0;}
          .land-hero-text{align-items:center;}
          .land-hero-text h1,.land-hero-text p{text-align:center;}
          .hero-cam-wrap{height:380px;}
          .cam-glow-ring{width:260px;height:260px;}
          .land-step:not(:last-child)::after{display:none;}
        }
        @media(max-width:640px){
          .land-nav-links .land-nav-link{display:none;}
          .land-moods-grid{grid-template-columns:repeat(3,1fr);}
          .land-stats-card{padding:32px 20px;}
          .land-cta-box{padding:40px 24px;}
        }
      `}</style>

      <div className="land-page">
        {/* Blobs */}
        <div className="land-blob land-blob1" />
        <div className="land-blob land-blob2" />
        <div className="land-blob land-blob3" />

        {/* 3D background */}
        <BackgroundCanvas />

        {/* Navbar */}
        <nav id="land-nav">
          <Link to="/landing" className="land-logo">
            <div className="land-logo-cube">M</div>
            <span className="land-logo-text">MoodFlix</span>
          </Link>
          <div className="land-nav-links">
            <a href="#features" className="land-nav-link">Features</a>
            <a href="#how"      className="land-nav-link">How it Works</a>
            <Link to="/login"    className="land-nav-btn outline">Login</Link>
            <Link to="/register" className="land-nav-btn">Register →</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="land-hero" id="home">
          <div className="land-hero-text">
            <div className="land-badge">
              <span className="land-badge-dot" />
              AI-Powered Movie Discovery
            </div>
            <h1>
              Watch What
              <span className="land-grad">You Feel</span>
            </h1>
            <p>Tell us your mood — anger, joy, nostalgia, romance — and our AI curates the perfect movies &amp; series just for you. Powered by GROQ AI + TMDB.</p>
            <div className="land-cta">
              <Link to="/register" className="land-btn primary">
                Get Started Free <span className="land-arrow">→</span>
              </Link>
              <Link to="/login" className="land-btn ghost">Sign In</Link>
            </div>
          </div>

          <CineCameraCanvas />

          <div className="land-scroll-hint">
            <div className="land-scroll-line" />
            Scroll
          </div>
        </section>

        {/* Moods */}
        <section className="land-section land-section-center land-reveal" id="moods">
          <div className="land-eyebrow">Pick Your Vibe</div>
          <h2 className="land-title">12 Moods. Infinite Stories.</h2>
          <p className="land-sub">Every emotion deserves the right film. Choose how you feel and let MoodFlix do the rest.</p>
          <div className="land-moods-grid">
            {moods.map(m => (
              <Link to="/register" className="land-mood-pill" key={m.label}>
                <div className="land-mood-emoji">{m.emoji}</div>
                <div className="land-mood-label">{m.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="land-section land-reveal" id="features">
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div className="land-eyebrow">Why MoodFlix</div>
            <h2 className="land-title">Built Different</h2>
            <p className="land-sub">Not just another watchlist. MoodFlix understands how you feel — right now.</p>
          </div>
          <div className="land-features-grid">
            {features.map(f => (
              <div className="land-feature-card" key={f.title}>
                <div className={`land-feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="land-section land-section-center land-reveal" id="how">
          <div className="land-eyebrow">Simple Process</div>
          <h2 className="land-title">How It Works</h2>
          <p className="land-sub" style={{ marginBottom: '52px' }}>Three steps from mood to movie night.</p>
          <div className="land-steps">
            {[
              { n: '1', title: 'Pick Your Mood',    desc: 'Choose from 12 emotions — happy, sad, romantic, spooky, bold, and more.' },
              { n: '2', title: 'Set Preferences',   desc: 'Filter by language, streaming platform, and format (movie or series).' },
              { n: '3', title: 'Get Picks',          desc: 'Receive 7–8 curated recommendations with hidden gems and wild cards.' },
              { n: '4', title: 'Ask the AI',         desc: 'Chat with MoodFlix AI for spoiler-free summaries and deeper discovery.' },
            ].map(s => (
              <div className="land-step" key={s.n}>
                <div className="land-step-num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="land-section land-reveal">
          <div className="land-stats-card">
            {[
              { num: '12',    label: 'Mood Categories' },
              { num: '500K+', label: 'Movies in Database' },
              { num: '3',     label: 'Languages Supported' },
              { num: '∞',     label: 'Movie Nights' },
            ].map(s => (
              <div key={s.label}>
                <div className="land-stat-num">{s.num}</div>
                <div className="land-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section className="land-section land-section-center land-reveal">
          <div className="land-eyebrow">Built With</div>
          <h2 className="land-title" style={{ marginBottom: '14px' }}>The Tech Behind It</h2>
          <p className="land-sub">Modern stack, open APIs, zero cost to start.</p>
          <div className="land-tech-pills">
            {['⚛ React 18 + Vite','🎨 Tailwind CSS','✨ Framer Motion','🌐 Three.js',
              '🔐 Supabase Auth','🤖 GROQ / Llama 3','🎬 TMDB API','🚀 Node.js + Express','▲ Netlify','🟢 Render']
              .map(t => <div className="land-tech-pill" key={t}>{t}</div>)}
          </div>
        </section>

        {/* CTA */}
        <section className="land-section land-reveal">
          <div className="land-cta-box">
            <h2>Start Watching<br />What You Feel</h2>
            <p>Free forever. No credit card. Just your mood and a great movie night waiting.</p>
            <div className="land-cta-btns">
              <Link to="/register" className="land-btn primary">Create Free Account →</Link>
              <Link to="/login"    className="land-btn ghost">Already have one? Sign In</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="land-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="land-footer-mini">M</div>
            <span className="land-footer-logo">MoodFlix</span>
          </div>
          <span>Made with ❤️ · Powered by TMDB, GROQ &amp; Supabase</span>
          <span>MIT © 2026 MoodFlix</span>
        </footer>
      </div>
    </>
  )
}