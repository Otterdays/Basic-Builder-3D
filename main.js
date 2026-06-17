import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { api } from './api.js';

// [TRACE: main.js]
const ITEM_TYPES = [
    'block', 'beam', 'slab', 'column', 'pipe', 'plate', 'hook', 'lumber', 'pot', 'pex', 'spray',
    'fence_post', 'fence_rail', 'fence_panel', 'paintbrush', 'wedge', 'stairs'
];
const FENCE_ITEMS = ['fence_post', 'fence_rail', 'fence_panel'];
const FENCE_POST = 'fence_post';
const WOOD_MATERIALS = ['wood', 'dark_wood', 'light_wood', 'mahogany'];
const MATERIAL_KEYS = [
    'concrete', 'wood', 'brick', 'black_iron', 'sheetrock', 'terracotta', 'grass', 'asphalt', 'marble', 'cobblestone', 'shingles', 'glass', 'water', 'pex_red', 'pex_blue',
    'dark_wood', 'light_wood', 'mahogany', 'granite', 'sandstone', 'slate'
];
const TEXTURE_NAMES = [
    'wood', 'concrete', 'brick', 'steel', 'black_iron', 'sheetrock',
    'marble', 'cobblestone', 'shingles', 'grass', 'terracotta'
];

const BLUEPRINT_VERSION = 3;

/** Shown in the update modal - bump with each user-facing release (see DOCS/RULES_RELEASES.md). */
const STORAGE_SEEN_RELEASE_KEY = 'builder3d-seen-release';
const APP_RELEASE = {
    version: '1.2.0',
    dateLabel: '2026-06-17',
    highlights: [
        'Post-processing pipeline: contact-shadow ambient occlusion, subtle bloom on bright materials, and ACES filmic tone mapping for richer depth and color.',
        'Sidebar QoL: light/dark panel themes, Design card layout, per-section fold persistence, and staggered enter animation.',
        'Site & grid controls: separate 1 m placement grid (G) and 5 m guide lines; optional procedural sky clouds under Lighting.',
        'Takeoff panel: collapsible piece/material/level groups with Expand all / Collapse all.',
        'Draft restore uses a non-blocking modal so the scene keeps animating behind the prompt.',
        'WebGL Real-time Shadow Mapping & Sun Position Slider in the Lighting sidebar.',
        'Paintbrush Tool & Eyedropper (press I or middle-click placed block to copy it).',
        'Clone hovered parts with C for faster repeated architectural layouts.'
    ]
};

class BuilderApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.gridSize = 20;
        this.objects = [];
        this.currentMaterial = 'concrete';
        this.currentItem = 'block';
        this.textures = {};
        this.ghostObject = null;
        this.plane = null;
        this.innerPlane = null;
        this.gridHelper = null;
        this._nextId = 1;
        this.undoStack = [];
        this.redoStack = [];
        this._inHistory = false;
        this.ghostRotation = new THREE.Euler(0, 0, 0);
        this.currentAxis = 'y'; // x, y, or z
        this.fpMode = false;
        this.fp = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
        this.EYE_H = 1.64;
        this.PLAYER_HW = 0.24;
        this.PLAYER_H = 1.75;
        this.FP_SPEED = 4.2;
        this.FP_LOOK = 0.0022;
        this.isOrthographic = false;
        this.orthoSize = 15;
        this._savedOrbit = null;
        this._fpKeys = new Set();
        this.clock = new THREE.Clock();
        this._groundRay = new THREE.Raycaster();
        this._gOrigin = new THREE.Vector3();
        this._gDir = new THREE.Vector3(0, -1, 0);
        this._playerBox = new THREE.Box3();
        this._blockBox = new THREE.Box3();
        this._pMin = new THREE.Vector3();
        this._pMax = new THREE.Vector3();
        this._v1 = new THREE.Vector3();
        this._v2 = new THREE.Vector3();
        this._onPointerMove = (e) => {
            this.onFirstPersonPointerMove(e);
        };
        this._onPointerLockChange = () => {
            this.onPointerLockChange();
        };
        this._onFpKeyDown = (e) => {
            this.onFirstPersonKeyDown(e);
        };
        this._onFpKeyUp = (e) => {
            this.onFirstPersonKeyUp(e);
        };
        this._onCanvasClickLock = () => {
            this.requestPointerLockIfNeeded();
        };
        this.gridMajor = null;
        this.majorGridEnabled = false;
        this.measureMode = false;
        this._measureA = new THREE.Vector3();
        this._measureB = new THREE.Vector3();
        this._measurePointCount = 0;
        this._measureLine = null;
        this.lightingPreset = 'work';
        this.sunAngle = 45;
        this._ambientLight = null;
        this._hemiLight = null;
        this._dirLight = null;
        this._pointAccent = null;
        this._skyTexture = null;
        this._horizonGroup = null;
        this.skyCloudsEnabled = true;
        this.lastPlacedSnap = null;
        this.helpOpen = false;
        this._ghostBox = new THREE.Box3();
        this._othBox = new THREE.Box3();
        this._fpVelY = 0;
        this.FP_JUMP = 6.2;
        this.FP_GRAVITY = 15;
        this.FP_GROUND_SLOP = 0.06;
        this.SITE_OUTER_HALF = 50;
        this.particles = [];
        this._particlePool = [];
        this._perspCamera = null;
        this._orthoCamera = null;
        this._orthoState = null;
        this._orbitPolarMax = Math.PI / 2.1;
        this.statsVisible = false;
        this._fpsFrames = 0;
        this._fpsTime = 0;
        this._fineSnap = false;
        this._draftTimer = null;
        this.reducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.updateModalOpen = false;
        // Cloud state
        this._cloudProjects = [];
        this._cloudGallery = [];
        this._cloudSaveTargetId = null; // blueprint id if updating existing
        this._backendAvailable = false;
        this.siteGround = { outer: 'grass', inner: 'concrete' };
        this._fenceCycleIdx = 0;
        this.sidebarCollapsed = false;
        this._sidebarResizeActive = false;
        this.init();
    }

    async init() {
        this.setLoading(true);
        try {
            this.setupScene();
            this.setupLighting();
            this.setupComposer();
            await this.loadTextures();
            this.applyGroundMaterials(this.siteGround.outer, this.siteGround.inner);
            this.setupHelpers();
            this.createGhost();
            this.bindEvents();
            this.updateTakeoff();
            this.showToast('Ready - place parts or load a blueprint.', 'info');
            this.animate();
            // Non-blocking backend check - degrades gracefully if server not running
            this.checkBackend().catch(() => {});
        } catch (err) {
            console.error(err);
            this.showToast('Startup error - see console.', 'danger');
        } finally {
            this.setLoading(false);
            this.beginSidebarEnterAnimation();
            requestAnimationFrame(() => {
                this.tryRestoreDraft()
                    .catch((e) => console.warn('Draft restore skipped', e))
                    .finally(() => this.maybeShowReleaseModal());
            });
        }
    }

    beginSidebarEnterAnimation() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        if (this.reducedMotion) {
            sidebar.classList.remove('is-entering', 'is-ready');
            return;
        }
        sidebar.classList.add('is-entering');
        sidebar.querySelectorAll('.tool-section').forEach((el, i) => {
            el.style.setProperty('--enter-delay', `${i * 35}ms`);
        });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                sidebar.classList.add('is-ready');
                window.setTimeout(() => {
                    sidebar.classList.remove('is-entering', 'is-ready');
                    sidebar.querySelectorAll('.tool-section').forEach((el) => {
                        el.style.removeProperty('--enter-delay');
                    });
                }, 750);
            });
        });
    }

    setLoading(isLoading) {
        const el = document.getElementById('loading-screen');
        if (!el) return;
        el.classList.toggle('is-hidden', !isLoading);
        el.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }

    showToast(message, variant = 'info') {
        const host = document.getElementById('toast-host');
        if (!host) return;
        const node = document.createElement('div');
        node.className = `toast${variant === 'danger' ? ' toast--danger' : ''}`;
        node.textContent = message;
        host.appendChild(node);
        setTimeout(() => {
            node.remove();
        }, 3200);
    }

    shouldIgnoreKeyboard() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        return el.isContentEditable;
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x5f6a70, 28, 92);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 10, 10);
        this._perspCamera = this.camera;

        const canvas = document.querySelector('#builder-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        if (THREE.SRGBColorSpace) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 40;
        this.controls.maxPolarAngle = Math.PI / 2.1;

        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshStandardMaterial({
            color: 0x40533b,
            roughness: 0.95,
            metalness: 0.0
        });
        this.plane = new THREE.Mesh(planeGeo, planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.receiveShadow = true;
        this.scene.add(this.plane);

        const innerGeo = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2f,
            roughness: 0.8,
            metalness: 0.2
        });
        this.innerPlane = new THREE.Mesh(innerGeo, innerMat);
        this.innerPlane.rotation.x = -Math.PI / 2;
        this.innerPlane.position.y = 0.005; // Slightly above outer plane to prevent z-fighting
        this.innerPlane.receiveShadow = true;
        this.scene.add(this.innerPlane);

        this.createHorizonBackdrop();
        this.initSkyCloudsPref();
    }

    initSkyCloudsPref() {
        try {
            const raw = localStorage.getItem('builder3d-sky-clouds');
            if (raw === '0') this.skyCloudsEnabled = false;
        } catch (e) {
            /* ignore */
        }
        this.refreshSkyBackground();
        this.syncSkyCloudsToggle();
    }

    paintSkyCloudStreaks(ctx, w, h, preset) {
        if (!this.skyCloudsEnabled) return;
        const baseAlpha = preset === 'night' ? 0.1 : preset === 'dusk' ? 0.18 : 0.26;
        const streaks = [
            { x: 0.22, y: 0.14, rw: 0.38, rh: 0.045, a: baseAlpha },
            { x: 0.68, y: 0.11, rw: 0.42, rh: 0.05, a: baseAlpha * 0.92 },
            { x: 0.48, y: 0.22, rw: 0.55, rh: 0.04, a: baseAlpha * 0.78 },
            { x: 0.82, y: 0.19, rw: 0.28, rh: 0.035, a: baseAlpha * 0.65 },
            { x: 0.12, y: 0.28, rw: 0.34, rh: 0.038, a: baseAlpha * 0.55 }
        ];
        ctx.save();
        streaks.forEach((s) => {
            ctx.beginPath();
            ctx.ellipse(s.x * w, s.y * h, s.rw * w, s.rh * h, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
            ctx.fill();
        });
        ctx.restore();
    }

    refreshSkyBackground(preset = this.lightingPreset) {
        if (!this.scene) return;
        if (this._skyTexture) this._skyTexture.dispose();
        this._skyTexture = this.createSkyTexture(preset);
        this.scene.background = this._skyTexture;
    }

    syncSkyCloudsToggle() {
        const cb = document.getElementById('sky-clouds-toggle');
        if (cb) cb.checked = this.skyCloudsEnabled;
    }

    setSkyCloudsEnabled(on, silent = false) {
        this.skyCloudsEnabled = !!on;
        this.refreshSkyBackground();
        this.syncSkyCloudsToggle();
        try {
            localStorage.setItem('builder3d-sky-clouds', this.skyCloudsEnabled ? '1' : '0');
        } catch (e) {
            /* ignore */
        }
        if (!silent) {
            this.showToast(this.skyCloudsEnabled ? 'Sky clouds on' : 'Sky clouds off', 'info');
        }
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xf4f0e8, 0.24);
        this._ambientLight = ambient;
        this.scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0xbfd7ef, 0x4b473c, 0.62);
        this._hemiLight = hemi;
        this.scene.add(hemi);

        const directional = new THREE.DirectionalLight(0xffffff, 1.2);
        this._dirLight = directional;
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        directional.shadow.bias = -0.00025;
        directional.shadow.normalBias = 0.02;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        directional.shadow.camera.left = -20;
        directional.shadow.camera.right = 20;
        directional.shadow.camera.top = 20;
        directional.shadow.camera.bottom = -20;
        this.scene.add(directional);

        const point1 = new THREE.PointLight(0x00f2ff, 10, 20);
        this._pointAccent = point1;
        point1.position.set(-10, 5, -10);
        this.scene.add(point1);

        this.updateSunPosition(this.sunAngle);
    }

    setupComposer() {
        try {
            const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
            // HalfFloat + MSAA target: keeps antialiasing through the post chain and
            // gives bloom an HDR buffer to threshold against.
            const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
                type: THREE.HalfFloatType,
                samples: 4
            });
            const composer = new EffectComposer(this.renderer, renderTarget);
            composer.setPixelRatio(this.renderer.getPixelRatio());
            composer.setSize(window.innerWidth, window.innerHeight);

            const renderPass = new RenderPass(this.scene, this.camera);
            composer.addPass(renderPass);

            const gtaoPass = new GTAOPass(this.scene, this.camera, size.x, size.y);
            gtaoPass.output = GTAOPass.OUTPUT.Default;
            composer.addPass(gtaoPass);

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.5,  // strength
                0.4,  // radius
                0.82  // threshold
            );
            composer.addPass(bloomPass);

            // OutputPass applies the renderer's tone mapping + sRGB at the end of the chain.
            composer.addPass(new OutputPass());

            this.composer = composer;
            this.renderPass = renderPass;
            this.gtaoPass = gtaoPass;
            this.bloomPass = bloomPass;
        } catch (err) {
            console.warn('Post-processing unavailable - falling back to direct render.', err);
            this.composer = null;
        }
    }

    renderFrame() {
        if (this.composer) {
            // Keep the post passes pointed at the active camera (perspective <-> ortho).
            this.renderPass.camera = this.camera;
            this.gtaoPass.camera = this.camera;
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    createSkyTexture(preset = 'work') {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const palette = {
            work: ['#b7cad5', '#6f8590', '#283136'],
            dusk: ['#f4b28b', '#8d5961', '#241b28'],
            night: ['#253653', '#101624', '#040507']
        }[preset] || ['#b7cad5', '#6f8590', '#283136'];
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, palette[0]);
        g.addColorStop(0.48, palette[1]);
        g.addColorStop(1, palette[2]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.paintSkyCloudStreaks(ctx, canvas.width, canvas.height, preset);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        return tex;
    }

    setAtmospherePreset(preset) {
        const fog = {
            work: { color: 0x6a7478, near: 30, far: 96, exposure: 1.08 },
            dusk: { color: 0x6d4a50, near: 26, far: 88, exposure: 0.98 },
            night: { color: 0x101624, near: 16, far: 58, exposure: 0.86 }
        }[preset] || { color: 0x6a7478, near: 30, far: 96, exposure: 1.08 };
        if (this._skyTexture) this._skyTexture.dispose();
        this.refreshSkyBackground(preset);
        if (this.scene.fog) {
            this.scene.fog.color.setHex(fog.color);
            this.scene.fog.near = fog.near;
            this.scene.fog.far = fog.far;
        }
        if (this.renderer) this.renderer.toneMappingExposure = fog.exposure;
        if (this._horizonGroup) {
            this._horizonGroup.visible = preset !== 'night';
            this._horizonGroup.traverse((child) => {
                if (child.material && child.material.color) {
                    if (child.userData.horizonLayer === 'far') {
                        child.material.color.setHex(preset === 'dusk' ? 0x67554a : 0x53685b);
                        child.material.opacity = preset === 'dusk' ? 0.22 : 0.28;
                    } else if (child.userData.horizonLayer === 'near') {
                        child.material.color.setHex(preset === 'dusk' ? 0x3f4230 : 0x324232);
                        child.material.opacity = preset === 'dusk' ? 0.46 : 0.58;
                    }
                }
            });
        }
    }

    createHorizonBackdrop() {
        this._horizonGroup = new THREE.Group();
        const ridgeGeo = new THREE.CylinderGeometry(72, 72, 9, 128, 1, true);
        const pos = ridgeGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            if (y > 0) {
                const a = Math.atan2(z, x);
                const ridge =
                    Math.sin(a * 3.0 + 0.5) * 1.1 +
                    Math.sin(a * 7.0 - 1.2) * 0.65 +
                    Math.sin(a * 13.0) * 0.28;
                pos.setY(i, y + ridge);
            }
        }
        ridgeGeo.computeVertexNormals();
        const ridgeMat = new THREE.MeshBasicMaterial({
            color: 0x324232,
            transparent: true,
            opacity: 0.58,
            depthWrite: false,
            side: THREE.BackSide
        });
        const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.y = 3.7;
        ridge.renderOrder = -2;
        ridge.userData.horizonLayer = 'near';
        this._horizonGroup.add(ridge);

        const farRidgeGeo = new THREE.CylinderGeometry(92, 92, 7, 128, 1, true);
        const farPos = farRidgeGeo.attributes.position;
        for (let i = 0; i < farPos.count; i++) {
            const x = farPos.getX(i);
            const y = farPos.getY(i);
            const z = farPos.getZ(i);
            if (y > 0) {
                const a = Math.atan2(z, x);
                farPos.setY(i, y + Math.sin(a * 4.0 + 2.1) * 0.9 + Math.sin(a * 9.0) * 0.4);
            }
        }
        farRidgeGeo.computeVertexNormals();
        const farRidgeMat = new THREE.MeshBasicMaterial({
            color: 0x53685b,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
            side: THREE.BackSide
        });
        const farRidge = new THREE.Mesh(farRidgeGeo, farRidgeMat);
        farRidge.position.y = 4.2;
        farRidge.renderOrder = -4;
        farRidge.userData.horizonLayer = 'far';
        this._horizonGroup.add(farRidge);

        const hazeGeo = new THREE.CircleGeometry(76, 96);
        const hazeMat = new THREE.MeshBasicMaterial({
            color: 0x42554a,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const haze = new THREE.Mesh(hazeGeo, hazeMat);
        haze.rotation.x = -Math.PI / 2;
        haze.position.y = 0.012;
        haze.renderOrder = -3;
        this._horizonGroup.add(haze);
        this.scene.add(this._horizonGroup);
    }

    updateSunPosition(angle) {
        this.sunAngle = angle;
        if (this._dirLight) {
            const rad = (angle * Math.PI) / 180;
            this._dirLight.position.set(
                Math.cos(rad) * 25,
                20,
                Math.sin(rad) * 25
            );
        }
        const slider = document.getElementById('sun-angle-slider');
        if (slider) {
            slider.value = angle;
        }
    }

    createFallbackTexture(name) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (name === 'grass') {
            ctx.fillStyle = '#3a5a2a';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 20000; i++) {
                ctx.fillStyle = `rgba(60, ${100 + Math.random() * 80}, 40, 0.4)`;
                ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
            }
        } else if (name === 'asphalt') {
            ctx.fillStyle = '#222222';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 40000; i++) {
                const c = Math.random() * 40;
                ctx.fillStyle = `rgba(${c}, ${c}, ${c + 5}, 0.3)`;
                ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
            }
        } else if (name === 'marble') {
            ctx.fillStyle = '#fdfdfd';
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = 'rgba(100, 100, 110, 0.15)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                let x = Math.random() * size;
                let y = 0;
                ctx.moveTo(x, y);
                for (let j = 0; j < 20; j++) {
                    x += (Math.random() - 0.5) * 60;
                    y += size / 20;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (name === 'cobblestone') {
            ctx.fillStyle = '#444448';
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = '#222225';
            ctx.lineWidth = 4;
            const step = 64;
            for (let y = 0; y < size; y += step) {
                for (let x = 0; x < size; x += step) {
                    const ox = (Math.random() - 0.5) * 10;
                    const oy = (Math.random() - 0.5) * 10;
                    ctx.fillStyle = `hsl(240, 5%, ${25 + Math.random() * 15}%)`;
                    ctx.beginPath();
                    ctx.roundRect(x + 4 + ox, y + 4 + oy, step - 8, step - 8, 8);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        } else if (name === 'shingles') {
            ctx.fillStyle = '#1a1a1f';
            ctx.fillRect(0, 0, size, size);
            const sw = 64;
            const sh = 32;
            for (let y = 0; y < size; y += sh) {
                const offset = (y / sh % 2) * (sw / 2);
                for (let x = -sw; x < size; x += sw) {
                    ctx.fillStyle = `hsl(240, 5%, ${10 + Math.random() * 10}%)`;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.rect(x + offset, y, sw, sh);
                    ctx.fill();
                    ctx.stroke();
                    // Highlights
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.beginPath();
                    ctx.moveTo(x + offset, y + sh);
                    ctx.lineTo(x + offset + sw, y + sh);
                    ctx.stroke();
                }
            }
        } else if (name === 'terracotta') {
            ctx.fillStyle = '#a34b2f';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 5000; i++) {
                ctx.fillStyle = `rgba(140, 60, 40, 0.1)`;
                ctx.fillRect(Math.random() * size, Math.random() * size, 4, 4);
            }
        } else {
            // Generic fallback
            const h = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
            const g = ctx.createLinearGradient(0, 0, size, size);
            g.addColorStop(0, `hsl(${h} 10% 38%)`);
            g.addColorStop(1, `hsl(${(h + 40) % 360} 8% 28%)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    loadOneTexture(loader, name) {
        return new Promise((resolve) => {
            const url = `assets/textures/${name}.png`;
            loader.load(
                url,
                (tex) => {
                    try {
                        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                        tex.repeat.set(1, 1);
                        if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
                        resolve(tex);
                    } catch (e) {
                        console.warn(e);
                        resolve(this.createFallbackTexture(name));
                    }
                },
                undefined,
                () => {
                    console.warn(`Texture missing or failed: ${url} - using fallback.`);
                    resolve(this.createFallbackTexture(name));
                }
            );
        });
    }

    async loadTextures() {
        const loader = new THREE.TextureLoader();
        const results = await Promise.all(
            TEXTURE_NAMES.map((n) => this.loadOneTexture(loader, n).then((tex) => [n, tex]))
        );
        for (const [n, tex] of results) {
            this.textures[n] = tex;
        }
    }

    setupHelpers() {
        this.gridHelper = new THREE.GridHelper(
            this.gridSize,
            this.gridSize,
            0x00f2ff,
            0x333333
        );
        this.gridHelper.position.y = 0.01;
        this.scene.add(this.gridHelper);
        this._majorGridMat = new THREE.LineBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
        });
        const half = this.gridSize / 2;
        const step = 5;
        const pts = [];
        for (let i = -half; i <= half; i += step) {
            pts.push(i, 0.025, -half, i, 0.025, half);
            pts.push(-half, 0.025, i, half, 0.025, i);
        }
        const majorGeo = new THREE.BufferGeometry();
        majorGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        this.gridMajor = new THREE.LineSegments(majorGeo, this._majorGridMat);
        this.gridMajor.visible = false;
        this.gridMajor.frustumCulled = false;
        this.gridMajor.renderOrder = 2;
        this._majorGridMat.visible = false;
        this.scene.add(this.gridMajor);
        const mg = new THREE.BufferGeometry();
        mg.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
        this._measureLine = new THREE.Line(
            mg,
            new THREE.LineBasicMaterial({ color: 0x00f2ff, depthTest: true })
        );
        this._measureLine.frustumCulled = false;
        this._measureLine.visible = false;
        this.scene.add(this._measureLine);
    }

    syncPlacementGridButton() {
        const btn = document.getElementById('placement-grid-btn');
        if (!btn || !this.gridHelper) return;
        btn.classList.toggle('active', this.gridHelper.visible);
    }

    setPlacementGridVisible(on, silent = false) {
        if (!this.gridHelper) return;
        this.gridHelper.visible = !!on;
        this.syncPlacementGridButton();
        if (!silent) {
            this.showToast(this.gridHelper.visible ? '1 m placement grid on' : '1 m placement grid off', 'info');
        }
    }

    setGridVisible(visible) {
        this.setPlacementGridVisible(visible, true);
    }

    toggleGrid() {
        if (!this.gridHelper) return;
        this.setPlacementGridVisible(!this.gridHelper.visible);
    }

    getGroundYAt(x, z) {
        this._gOrigin.set(x, 400, z);
        this._groundRay.set(this._gOrigin, this._gDir);
        const list = [];
        if (this.innerPlane) list.push(this.innerPlane);
        if (this.plane) list.push(this.plane);
        list.push(...this.objects);
        const hits = this._groundRay.intersectObjects(list, false);
        if (hits.length === 0) return 0;
        return hits[0].point.y;
    }

    isFpOnGround(gy) {
        const dy = Math.abs(this.fp.y - gy);
        return this._fpVelY <= 0.12 && dy <= this.FP_GROUND_SLOP;
    }

    clampFpToSitePad() {
        const m = this.SITE_OUTER_HALF - this.PLAYER_HW - 0.02;
        this.fp.x = Math.max(-m, Math.min(m, this.fp.x));
        this.fp.z = Math.max(-m, Math.min(m, this.fp.z));
    }

    isPlayerAabbBlocked(feetX, feetY, feetZ) {
        const hw = this.PLAYER_HW;
        const h = this.PLAYER_H;
        this._pMin.set(feetX - hw, feetY, feetZ - hw);
        this._pMax.set(feetX + hw, feetY + h, feetZ + hw);
        this._playerBox.set(this._pMin, this._pMax);
        for (const o of this.objects) {
            this._blockBox.setFromObject(o);
            if (this._playerBox.intersectsBox(this._blockBox)) return true;
        }
        return false;
    }

    getSafeSpawnFeet(x, z) {
        let y = this.getGroundYAt(x, z) + 0.02;
        if (!this.isPlayerAabbBlocked(x, y, z)) return { x, y, z };
        for (let i = 0; i < 40; i++) {
            y += 0.15;
            if (!this.isPlayerAabbBlocked(x, y, z)) return { x, y, z };
        }
        for (const ox of [1, -1, 1.5, -1.5, 2, -2, 0]) {
            for (const oz of [0, 1, -1, 1.5, -1.5, 2, -2]) {
                const tx = x + ox;
                const tz = z + oz;
                y = this.getGroundYAt(tx, tz) + 0.02;
                if (!this.isPlayerAabbBlocked(tx, y, tz)) {
                    return { x: tx, y, z: tz };
                }
            }
        }
        return { x, y: 1.5, z };
    }

    tryStepFeetTo(nx, feetY, nz) {
        if (this.isPlayerAabbBlocked(nx, feetY, nz)) return false;
        this.fp.x = nx;
        this.fp.y = feetY;
        this.fp.z = nz;
        return true;
    }

    trySlipTo(nx, nz) {
        const p = this.fp;
        const g = 0.02;
        const gyT = this.getGroundYAt(nx, nz) + g;
        const gyHere = this.getGroundYAt(p.x, p.z) + g;
        const airborne = p.y > gyHere + 0.14 || this._fpVelY > 0.5;
        if (airborne) {
            if (this.isPlayerAabbBlocked(nx, p.y, nz)) return false;
            p.x = nx;
            p.z = nz;
            return true;
        }
        if (!this.isPlayerAabbBlocked(nx, p.y, nz)) {
            p.x = nx;
            p.z = nz;
            return true;
        }
        const up = gyT - p.y;
        if (up > 0.01 && up < 1.2 && !this.isPlayerAabbBlocked(nx, gyT, nz)) {
            p.x = nx;
            p.z = nz;
            p.y = gyT;
            this._fpVelY = 0;
            return true;
        }
        if (up < -0.002 && up > -0.35 && !this.isPlayerAabbBlocked(nx, gyT, nz)) {
            p.x = nx;
            p.z = nz;
            p.y = gyT;
            this._fpVelY = 0;
            return true;
        }
        return false;
    }

    tryMoveFp(dx, dz) {
        const p = this.fp;
        if (Math.abs(dx) < 1e-8 && Math.abs(dz) < 1e-8) {
            this.ejectIfInside();
            return;
        }
        let moved = false;
        if (Math.abs(dx) > 1e-8) {
            const nx = p.x + dx;
            if (this.trySlipTo(nx, p.z)) {
                moved = true;
            }
        }
        if (Math.abs(dz) > 1e-8) {
            const nz = p.z + dz;
            if (this.trySlipTo(p.x, nz)) {
                moved = true;
            }
        }
        if (moved) {
            this.ejectIfInside();
        } else {
            this.ejectIfInside();
        }
    }

    applyFpSurfaceSnap() {
        if (this._fpVelY > 0.08) return;
        const p = this.fp;
        const gy = this.getGroundYAt(p.x, p.z) + 0.02;
        if (!this.isFpOnGround(gy)) return;
        p.y = gy;
    }

    applyFpVertical(dt) {
        const p = this.fp;
        p.y += this._fpVelY * dt;
        this._fpVelY -= this.FP_GRAVITY * dt;
        const gy = this.getGroundYAt(p.x, p.z) + 0.02;
        if (p.y <= gy && this._fpVelY <= 0) {
            p.y = gy;
            this._fpVelY = 0;
        } else if (p.y < gy) {
            p.y = gy;
            this._fpVelY = 0;
        }
        this.ejectIfInside();
    }

    ejectIfInside() {
        let y = this.fp.y;
        for (let k = 0; k < 50 && this.isPlayerAabbBlocked(this.fp.x, y, this.fp.z); k++) {
            y += 0.12;
        }
        this.fp.y = y;
    }

    syncFirstPersonCamera() {
        this.camera.position.set(this.fp.x, this.fp.y + this.EYE_H, this.fp.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.fp.yaw;
        this.camera.rotation.x = this.fp.pitch;
        this.camera.rotation.z = 0;
    }

    updateFirstPerson(dt) {
        const p = this.fp;
        const speed = this.FP_SPEED * dt;
        const yaw = p.yaw;
        const f = this._v1;
        f.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        const r = this._v2;
        r.set(Math.cos(yaw), 0, -Math.sin(yaw));
        let mx = 0;
        let mz = 0;
        if (this._fpKeys.has('KeyW')) { mx += f.x; mz += f.z; }
        if (this._fpKeys.has('KeyS')) { mx -= f.x; mz -= f.z; }
        if (this._fpKeys.has('KeyA')) { mx -= r.x; mz -= r.z; }
        if (this._fpKeys.has('KeyD')) { mx += r.x; mz += r.z; }
        const l = Math.hypot(mx, mz);
        if (l > 1e-6) {
            const ix = (mx / l) * speed;
            const iz = (mz / l) * speed;
            this.tryMoveFp(ix, iz);
        } else {
            this.ejectIfInside();
        }
        this.applyFpVertical(dt);
        this.applyFpSurfaceSnap();
        this.clampFpToSitePad();
        this.syncFirstPersonCamera();
    }

    onFirstPersonPointerMove(e) {
        if (!this.fpMode) return;
        if (document.pointerLockElement !== this.renderer.domElement) return;
        this.fp.yaw -= e.movementX * this.FP_LOOK;
        this.fp.pitch = Math.max(
            -1.18,
            Math.min(1.18, this.fp.pitch - e.movementY * this.FP_LOOK)
        );
        this.syncFirstPersonCamera();
    }

    onFirstPersonKeyDown(e) {
        if (!this.fpMode) return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;
            const gy = this.getGroundYAt(this.fp.x, this.fp.z) + 0.02;
            if (this.isFpOnGround(gy)) {
                this._fpVelY = this.FP_JUMP;
            }
            return;
        }
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            e.preventDefault();
            this._fpKeys.add(e.code);
        }
    }

    onFirstPersonKeyUp(e) {
        if (!this.fpMode) return;
        if (e.code === 'Space') {
            e.preventDefault();
            return;
        }
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            this._fpKeys.delete(e.code);
        }
    }

    onPointerLockChange() {
        const ch = document.getElementById('fp-crosshair');
        if (!ch) return;
        ch.hidden = !this.fpMode
            || document.pointerLockElement !== this.renderer.domElement;
    }

    requestPointerLockIfNeeded() {
        if (!this.fpMode) return;
        if (document.pointerLockElement === this.renderer.domElement) return;
        this.renderer.domElement.requestPointerLock();
    }

    setFirstPersonUi(on) {
        document.body.classList.toggle('fp-mode', on);
        const btn = document.getElementById('fp-toggle');
        if (btn) {
            btn.classList.toggle('active', on);
            btn.textContent = on ? 'Back to build view' : 'Walk (first person)';
        }
        this.onPointerLockChange();
    }

    enterFirstPerson() {
        if (this.fpMode) return;
        if (this.isOrthographic) this.toggleOrthographic(false);
        if (this.measureMode) this.setMeasureMode(false);
        this._savedOrbit = {
            pos: this.camera.position.clone(),
            target: this.controls.target.clone()
        };
        this.controls.enabled = false;
        this._fpKeys.clear();
        this._fpVelY = 0;
        const s = this.getSafeSpawnFeet(0, 0);
        this.fp.x = s.x;
        this.fp.y = s.y;
        this.fp.z = s.z;
        this.fp.yaw = 0;
        this.fp.pitch = 0;
        this.fpMode = true;
        this.setFirstPersonUi(true);
        this.syncFirstPersonCamera();
        if (this.ghostObject) this.ghostObject.visible = false;
        const pl = this.renderer.domElement.requestPointerLock();
        if (pl && typeof pl.catch === 'function') {
            pl.catch(() => {
                this.showToast('Click the 3D view to lock the mouse and look around.', 'info');
            });
        }
        this.showToast('WASD: move - Space: jump - Mouse: look - Button: leave walk', 'info');
    }

    exitFirstPerson() {
        if (!this.fpMode) return;
        try {
            document.exitPointerLock();
        } catch (e) {
            /* empty */
        }
        this._fpKeys.clear();
        this.fpMode = false;
        this.setFirstPersonUi(false);
        this.controls.enabled = true;
        if (this._savedOrbit) {
            this.camera.position.copy(this._savedOrbit.pos);
            this.controls.target.copy(this._savedOrbit.target);
            this._savedOrbit = null;
        }
        this.controls.update();
        if (this.ghostObject) this.ghostObject.visible = true;
    }

    toggleFirstPerson() {
        if (this.fpMode) this.exitFirstPerson();
        else this.enterFirstPerson();
    }

    getActiveBuildLevel() {
        const el = document.getElementById('build-level');
        if (!el) return 0;
        const v = parseInt(el.value, 10);
        return Number.isFinite(v) ? Math.max(0, v) : 0;
    }

    applyLightingPreset(preset) {
        if (!this._ambientLight || !this._dirLight || !this._pointAccent) return;
        this.lightingPreset = preset;
        if (preset === 'work') {
            this._ambientLight.color.setHex(0xffffff);
            this._ambientLight.intensity = 0.24;
            if (this._hemiLight) {
                this._hemiLight.color.setHex(0xbfd7ef);
                this._hemiLight.groundColor.setHex(0x4b473c);
                this._hemiLight.intensity = 0.62;
            }
            this._dirLight.color.setHex(0xfff2dc);
            this._dirLight.intensity = 1.35;
            this._pointAccent.color.setHex(0x00f2ff);
            this._pointAccent.intensity = 4;
            this.setAtmospherePreset('work');
        } else if (preset === 'dusk') {
            this._ambientLight.color.setHex(0xffe8dd);
            this._ambientLight.intensity = 0.22;
            if (this._hemiLight) {
                this._hemiLight.color.setHex(0xffc49a);
                this._hemiLight.groundColor.setHex(0x5a4034);
                this._hemiLight.intensity = 0.45;
            }
            this._dirLight.color.setHex(0xffcc88);
            this._dirLight.intensity = 0.92;
            this._pointAccent.color.setHex(0xff8844);
            this._pointAccent.intensity = 3;
            this.setAtmospherePreset('dusk');
        } else if (preset === 'night') {
            this._ambientLight.color.setHex(0x445566);
            this._ambientLight.intensity = 0.12;
            if (this._hemiLight) {
                this._hemiLight.color.setHex(0x304866);
                this._hemiLight.groundColor.setHex(0x08090a);
                this._hemiLight.intensity = 0.2;
            }
            this._dirLight.color.setHex(0xaaccff);
            this._dirLight.intensity = 0.28;
            this._pointAccent.color.setHex(0x00f2ff);
            this._pointAccent.intensity = 16;
            this.setAtmospherePreset('night');
        }
        const sel = document.getElementById('lighting-preset');
        if (sel) sel.value = preset;
    }

    cycleLightingPreset() {
        const order = ['work', 'dusk', 'night'];
        const i = order.indexOf(this.lightingPreset);
        const next = order[(i + 1 + order.length) % order.length];
        this.applyLightingPreset(next);
        this.showToast(`Lighting: ${next}`, 'info');
    }

    setMajorGridVisible(on) {
        if (!this.gridMajor || !this._majorGridMat) return;
        this.majorGridEnabled = !!on;
        this.gridMajor.visible = this.majorGridEnabled;
        this._majorGridMat.visible = this.majorGridEnabled;
        this._majorGridMat.opacity = this.majorGridEnabled ? 0.75 : 0;
        const btn = document.getElementById('major-grid-btn');
        if (btn) btn.classList.toggle('active', this.majorGridEnabled);
    }

    toggleMajorGrid() {
        if (!this.gridMajor) return;
        this.setMajorGridVisible(!this.majorGridEnabled);
        this.showToast(
            this.majorGridEnabled
                ? '5 m spacing guides on (20×20 m build zone)'
                : '5 m spacing guides off',
            'info'
        );
    }

    updateOrthoFrustum() {
        if (!this._orthoCamera) return;
        const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
        const fs = this.orthoSize;
        const w = fs * aspect;
        const h = fs;
        this._orthoCamera.left = -w / 2;
        this._orthoCamera.right = w / 2;
        this._orthoCamera.top = h / 2;
        this._orthoCamera.bottom = -h / 2;
        this._orthoCamera.updateProjectionMatrix();
    }

    toggleOrthographic(force) {
        const want =
            typeof force === 'boolean' ? force : !this.isOrthographic;
        if (want && this.fpMode) {
            this.showToast('Exit walk mode for plan view.', 'info');
            return;
        }
        if (want === this.isOrthographic) return;
        if (want) {
            this._orthoState = {
                camPos: this._perspCamera.position.clone(),
                target: this.controls.target.clone(),
                polarMin: this.controls.minPolarAngle,
                polarMax: this.controls.maxPolarAngle
            };
            if (!this._orthoCamera) {
                this._orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 520);
            }
            this.updateOrthoFrustum();
            const t = this.controls.target.clone();
            this._orthoCamera.position.set(t.x, t.y + 48, t.z);
            this._orthoCamera.up.set(0, 1, 0);
            this._orthoCamera.lookAt(t);
            this.controls.object = this._orthoCamera;
            this.camera = this._orthoCamera;
            this.controls.minPolarAngle = Math.PI / 2 - 0.06;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.06;
            this.controls.update();
            this.isOrthographic = true;
            const ob = document.getElementById('ortho-toggle');
            if (ob) ob.classList.add('active');
            this.showToast('Plan view (orthographic) — V toggles · scroll zoom', 'info');
        } else if (this._orthoState) {
            this.controls.object = this._perspCamera;
            this.camera = this._perspCamera;
            this._perspCamera.position.copy(this._orthoState.camPos);
            this.controls.target.copy(this._orthoState.target);
            this.controls.minPolarAngle = this._orthoState.polarMin;
            this.controls.maxPolarAngle = this._orthoState.polarMax;
            this._orthoState = null;
            this.controls.update();
            this.isOrthographic = false;
            const ob = document.getElementById('ortho-toggle');
            if (ob) ob.classList.remove('active');
            this.showToast('Perspective view', 'info');
        }
        this.onResize();
    }

    onResize() {
        const w = window.innerWidth;
        const h = Math.max(window.innerHeight, 1);
        const aspect = w / h;
        if (!this.camera) return;
        if (this.isOrthographic && this._orthoCamera) {
            this.updateOrthoFrustum();
        } else if (this._perspCamera) {
            this._perspCamera.aspect = aspect;
            this._perspCamera.updateProjectionMatrix();
        }
        this.renderer.setSize(w, h);
        if (this.composer) this.composer.setSize(w, h);
    }

    resetOrbitCamera() {
        if (this.fpMode) return;
        if (this.isOrthographic) this.toggleOrthographic(false);
        this.controls.target.set(0, 0, 0);
        this._perspCamera.position.set(10, 10, 10);
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = this._orbitPolarMax;
        this.controls.update();
        this.showToast('Camera reset (Home)', 'info');
    }

    frameAllInView() {
        if (this.fpMode) return;
        if (this.isOrthographic) {
            if (this.objects.length === 0) {
                this.controls.target.set(0, 0, 0);
                if (this._orthoCamera) {
                    this._orthoCamera.position.set(0, 48, 0);
                    this._orthoCamera.lookAt(0, 0, 0);
                }
                this.orthoSize = 15;
                this.updateOrthoFrustum();
                this.controls.update();
                this.showToast('Nothing to frame — plan view centered', 'info');
                return;
            }
            const box = new THREE.Box3();
            for (const o of this.objects) box.expandByObject(o);
            const c = box.getCenter(new THREE.Vector3());
            this.controls.target.copy(c);
            this._orthoCamera.position.set(c.x, c.y + 48, c.z);
            this._orthoCamera.lookAt(c);
            this.controls.update();
            const s = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).z, 4);
            this.orthoSize = Math.min(42, Math.max(8, s * 0.65));
            this.updateOrthoFrustum();
            this.showToast('Plan view framed to build extents', 'info');
            return;
        }
        if (this.objects.length === 0) {
            this.resetOrbitCamera();
            return;
        }
        const box = new THREE.Box3();
        for (const o of this.objects) box.expandByObject(o);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const dist = maxDim * 1.55;
        this.controls.target.copy(center);
        this._perspCamera.position.set(
            center.x + dist * 0.72,
            center.y + dist * 0.5,
            center.z + dist * 0.72
        );
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = this._orbitPolarMax;
        this.controls.update();
        this.showToast('Framed build in view (F)', 'info');
    }

    copyBlueprintToClipboard() {
        const parts = this.objects.map((o) => this.meshToSnapshot(o));
        const payload = { v: BLUEPRINT_VERSION, parts };
        const text = JSON.stringify(payload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => this.showToast('Blueprint JSON copied to clipboard.', 'info'))
                .catch(() => this.showToast('Clipboard failed — use Save JSON.', 'danger'));
        } else {
            this.showToast('Clipboard API unavailable.', 'danger');
        }
    }

    scheduleDraftSave() {
        if (this._inHistory) return;
        clearTimeout(this._draftTimer);
        this._draftTimer = setTimeout(() => {
            try {
                const parts = this.objects.map((o) => this.meshToSnapshot(o));
                const payload = { v: BLUEPRINT_VERSION, parts, savedAt: Date.now() };
                localStorage.setItem('builder3d-draft', JSON.stringify(payload));
            } catch (e) {
                console.warn('Draft save failed', e);
            }
        }, 900);
    }

    promptRestoreDraft() {
        return new Promise((resolve) => {
            const backdrop = document.getElementById('draft-restore-backdrop');
            const accept = document.getElementById('draft-restore-accept');
            const decline = document.getElementById('draft-restore-decline');
            if (!backdrop || !accept || !decline) {
                resolve(false);
                return;
            }
            const finish = (val) => {
                backdrop.hidden = true;
                accept.removeEventListener('click', onAccept);
                decline.removeEventListener('click', onDecline);
                document.removeEventListener('keydown', onKey);
                resolve(val);
            };
            const onAccept = () => finish(true);
            const onDecline = () => finish(false);
            const onKey = (e) => {
                if (e.key === 'Escape') finish(false);
            };
            accept.addEventListener('click', onAccept);
            decline.addEventListener('click', onDecline);
            document.addEventListener('keydown', onKey);
            backdrop.hidden = false;
            accept.focus();
        });
    }

    async tryRestoreDraft() {
        try {
            const raw = localStorage.getItem('builder3d-draft');
            if (!raw || raw.length < 12) return;
            const data = JSON.parse(raw);
            if (!data.parts || !Array.isArray(data.parts) || data.parts.length === 0) return;
            const ok = await this.promptRestoreDraft();
            if (!ok) return;
            this.importBlueprintJson(raw);
        } catch (e) {
            console.warn('Draft restore skipped', e);
        }
    }

    updateCompassHud() {
        const inner = document.querySelector('.compass-hud__inner');
        if (!inner) return;
        let ang = 0;
        if (this.fpMode) {
            ang = this.fp.yaw;
        } else if (this.controls && typeof this.controls.getAzimuthalAngle === 'function') {
            ang = this.controls.getAzimuthalAngle();
        }
        inner.style.transform = `rotate(${-ang}rad)`;
    }

    updateStats(dt) {
        if (!this.statsVisible) return;
        this._fpsFrames += 1;
        this._fpsTime += dt;
        if (this._fpsTime < 0.45) return;
        const fps = Math.round(this._fpsFrames / this._fpsTime);
        this._fpsFrames = 0;
        this._fpsTime = 0;
        const el = document.getElementById('stats-overlay');
        if (el) {
            el.textContent = `FPS ${fps} · Parts ${this.objects.length}${
                this.isOrthographic ? ' · Plan' : ''
            }`;
        }
    }

    updateSiteReadout(x, y, z) {
        const el = document.getElementById('site-readout');
        if (!el) return;
        const snapHint = this.currentItem === 'pex' ? ' · PEX surface snap' : this._fineSnap ? ' · Alt: ¼ m' : ' · 1 m grid';
        el.textContent = `X ${x.toFixed(2)}  Y ${y.toFixed(2)}  Z ${z.toFixed(2)}${snapHint}`;
    }

    updateMeasureReadout(text) {
        const el = document.getElementById('measure-readout');
        if (el) el.textContent = text;
    }

    clearMeasure() {
        this._measurePointCount = 0;
        if (this._measureLine) {
            this._measureLine.visible = false;
            this._measureLine.geometry.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            ]);
        }
        this.updateMeasureReadout('—');
    }

    setMeasureMode(on) {
        if (on && this.fpMode) {
            this.showToast('Exit walk mode to measure.', 'info');
            return;
        }
        this.measureMode = on;
        const btn = document.getElementById('measure-toggle');
        if (btn) btn.classList.toggle('active', on);
        if (!on) this.clearMeasure();
        this.showToast(on ? 'Measure: click A, then B' : 'Measure off', 'info');
    }

    toggleMeasureMode() {
        this.setMeasureMode(!this.measureMode);
    }

    onMeasurePoint(world) {
        if (this._measurePointCount === 2) {
            this._measurePointCount = 0;
        }
        if (this._measurePointCount === 0) {
            this._measureA.copy(world);
            this._measurePointCount = 1;
            this._measureLine.visible = true;
            this._measureLine.geometry.setFromPoints([this._measureA, this._measureA]);
            this.updateMeasureReadout('A set — pick B');
            return;
        }
        if (this._measurePointCount === 1) {
            this._measureB.copy(world);
            this._measurePointCount = 2;
            this._measureLine.geometry.setFromPoints([this._measureA, this._measureB]);
            const d = this._measureA.distanceTo(this._measureB);
            this.updateMeasureReadout(`Distance: ${d.toFixed(3)} m`);
            this.showToast(`Measured ${d.toFixed(3)} m`, 'info');
        }
    }

    onMeasureClickFromEvent() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const list = [];
        if (this.innerPlane) list.push(this.innerPlane);
        if (this.plane) list.push(this.plane);
        list.push(...this.objects);
        const hits = this.raycaster.intersectObjects(list, false);
        if (hits.length === 0) {
            this.updateMeasureReadout('No hit — try again');
            return;
        }
        this.onMeasurePoint(hits[0].point);
    }
    ghostOverlapsPlaced(ghost) {
        if (this.currentItem === 'spray' || this.currentItem === 'paintbrush') return false;
        ghost.updateMatrixWorld(true);
        this._ghostBox.setFromObject(ghost).expandByScalar(-0.005);
        for (const o of this.objects) {
            this._othBox.setFromObject(o);
            if (this._ghostBox.intersectsBox(this._othBox)) return true;
        }
        return false;
    }

    applyLevelVisibility() {
        const filter = document.getElementById('level-filter');
        const on = filter && filter.checked;
        const want = this.getActiveBuildLevel();
        for (const o of this.objects) {
            const lv = o.userData.level ?? 0;
            o.visible = !on || lv === want;
        }
    }

    flashPlacedMesh(mesh) {
        const m = mesh.material;
        if (!m || m.emissive === undefined) return;
        try {
            m.emissive.setHex(0x00f2ff);
            m.emissiveIntensity = 0.5;
            setTimeout(() => {
                m.emissive.setHex(0x000000);
                m.emissiveIntensity = 0;
            }, 120);
        } catch (e) {
            /* empty */
        }
    }

    commitPlacedMesh(mesh) {
        this.scene.add(mesh);
        this.objects.push(mesh);
        this.applyLevelVisibility();
        this.updateTakeoff();
        this.redoStack = [];
        this.undoStack.push({ t: 'place', snap: this.meshToSnapshot(mesh) });
        this.lastPlacedSnap = this.meshToSnapshot(mesh);
        this.flashPlacedMesh(mesh);
        this.triggerPlacementVfx(mesh.position, mesh.userData.material);
        this.scheduleDraftSave();
    }

    meshIntersectsPlaced(mesh) {
        if (mesh.userData.item === 'spray') return false;
        mesh.updateMatrixWorld(true);
        this._ghostBox.setFromObject(mesh).expandByScalar(-0.005);
        for (const o of this.objects) {
            this._othBox.setFromObject(o);
            if (this._ghostBox.intersectsBox(this._othBox)) return true;
        }
        return false;
    }

    repeatLastPlacement() {
        if (this.fpMode || this.measureMode) return;
        if (!this.lastPlacedSnap) {
            this.showToast('Place a part first, then P to repeat at the ghost.', 'info');
            return;
        }
        if (!this.ghostObject || !this.ghostObject.visible) {
            this.showToast('Move the ghost to a free cell first.', 'info');
            return;
        }
        if (this._inHistory) return;
        const s = this.lastPlacedSnap;
        const geometry = this.getItemGeometry(s.item);
        const mat = this.buildStandardMaterial(s.material);
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.copy(this.ghostObject.position);
        const r = s.rotation;
        mesh.rotation.set(r[0], r[1], r[2]);
        const id = this._nextId;
        const lvl = this.getActiveBuildLevel();
        mesh.userData = { id, item: s.item, material: s.material, level: lvl };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (this.meshIntersectsPlaced(mesh)) {
            this.showToast('Can\'t repeat — overlaps another part.', 'danger');
            return;
        }
        this._nextId += 1;
        this.commitPlacedMesh(mesh);
    }

    setHelpOpen(open) {
        this.helpOpen = open;
        const el = document.getElementById('help-backdrop');
        if (el) el.hidden = !open;
    }

    fillReleaseModalDom() {
        const titleEl = document.getElementById('update-title');
        const dateEl = document.getElementById('update-date');
        const list = document.getElementById('update-list');
        const verEl = document.getElementById('app-version-pill');
        if (titleEl) {
            titleEl.textContent = `What’s new — v${APP_RELEASE.version}`;
        }
        if (dateEl) {
            dateEl.textContent = APP_RELEASE.dateLabel;
        }
        if (verEl) {
            verEl.textContent = `v${APP_RELEASE.version}`;
        }
        if (list) {
            list.innerHTML = '';
            for (const line of APP_RELEASE.highlights) {
                const li = document.createElement('li');
                li.textContent = line;
                list.appendChild(li);
            }
        }
    }

    getSeenReleaseVersion() {
        try {
            return localStorage.getItem(STORAGE_SEEN_RELEASE_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    setSeenReleaseVersion() {
        try {
            localStorage.setItem(STORAGE_SEEN_RELEASE_KEY, APP_RELEASE.version);
        } catch (e) {
            /* storage full or disabled */
        }
    }

    setUpdateModalOpen(open) {
        this.updateModalOpen = open;
        const el = document.getElementById('update-backdrop');
        if (!el) return;
        el.hidden = !open;
        if (open) {
            document.getElementById('update-dismiss-btn')?.focus();
        }
    }

    dismissUpdateModal() {
        this.setSeenReleaseVersion();
        this.setUpdateModalOpen(false);
    }

    maybeShowReleaseModal() {
        if (this.helpOpen || this.fpMode) return;
        const seen = this.getSeenReleaseVersion();
        if (seen === APP_RELEASE.version) return;
        this.fillReleaseModalDom();
        this.setUpdateModalOpen(true);
    }

    /** From toolbar: always opens; does not require a new version. */
    openUpdateModalForced() {
        this.fillReleaseModalDom();
        this.setUpdateModalOpen(true);
    }

    createGhost() {
        const geometry = this.getItemGeometry(this.currentItem);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.4
        });
        if (this.ghostObject) this.scene.remove(this.ghostObject);
        this.ghostObject = new THREE.Mesh(geometry, material);
        this.ghostObject.rotation.copy(this.ghostRotation);
        this.scene.add(this.ghostObject);
    }

    getItemGeometry(type) {
        switch (type) {
            case 'block': return new THREE.BoxGeometry(1, 1, 1);
            case 'beam': return new THREE.BoxGeometry(2, 0.2, 0.2);
            case 'slab': return new THREE.BoxGeometry(1, 0.1, 1);
            case 'column': return new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
            case 'pipe': return new THREE.CylinderGeometry(0.1, 0.1, 2, 12);
            case 'plate': return new THREE.BoxGeometry(1, 1, 0.05);
            case 'hook': return new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI);
            case 'lumber': return new THREE.BoxGeometry(0.5, 0.25, 2);
            case 'pot': return new THREE.CylinderGeometry(0.4, 0.25, 0.6, 16);
            case 'pex': return new THREE.CylinderGeometry(0.04, 0.04, 1, 12);
            case 'spray': return new THREE.SphereGeometry(0.05, 8, 8);
            case 'fence_post': return new THREE.BoxGeometry(0.1, 1.2, 0.1);
            case 'fence_rail': return new THREE.BoxGeometry(2, 0.07, 0.07);
            case 'fence_panel': return new THREE.BoxGeometry(2, 0.9, 0.04);
            case 'paintbrush': return new THREE.OctahedronGeometry(0.18);
            case 'wedge': {
                const vertices = new Float32Array([
                    -0.5,-0.5,-0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5,
                    -0.5,-0.5,-0.5, 0.5,-0.5,0.5, 0.5,-0.5,-0.5,
                    0.5,-0.5,0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5,
                    0.5,-0.5,0.5, -0.5,0.5,0.5, 0.5,0.5,0.5,
                    -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,0.5,
                    -0.5,-0.5,-0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,
                    -0.5,-0.5,-0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5,
                    0.5,-0.5,-0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5
                ]);
                const uvs = new Float32Array([
                    0,0, 0,1, 1,1, 0,0, 1,1, 1,0,
                    1,0, 0,0, 0,1, 1,0, 0,1, 1,1,
                    0,0, 1,0, 1,1, 0,0, 1,1, 0,1,
                    0,0, 1,1, 1,0, 0,0, 1,0, 1,1
                ]);
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                geo.computeVertexNormals();
                return geo;
            }
            case 'stairs': {
                const group = new THREE.Group();
                const geos = [
                    new THREE.BoxGeometry(1, 0.25, 0.25).translate(0, -0.375, -0.375),
                    new THREE.BoxGeometry(1, 0.50, 0.25).translate(0, -0.25, -0.125),
                    new THREE.BoxGeometry(1, 0.75, 0.25).translate(0, -0.125, 0.125),
                    new THREE.BoxGeometry(1, 1.00, 0.25).translate(0, 0, 0.375)
                ];
                const merged = new THREE.BufferGeometry();
                const positions = [];
                const normals = [];
                const uvs = [];
                geos.forEach((g) => {
                    positions.push(...g.attributes.position.array);
                    normals.push(...g.attributes.normal.array);
                    uvs.push(...g.attributes.uv.array);
                    g.dispose();
                });
                merged.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
                merged.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
                merged.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
                group.clear();
                return merged;
            }
            default: return new THREE.BoxGeometry(1, 1, 1);
        }
    }

    getMeshHeightForItem(item, geometry) {
        if (geometry.type === 'BoxGeometry') {
            return geometry.parameters.height;
        }
        if (geometry.type === 'CylinderGeometry') {
            return geometry.parameters.height;
        }
        if (geometry.type === 'TorusGeometry') {
            return (geometry.parameters.radius + geometry.parameters.tube) * 2;
        }
        return 1;
    }

    trySnapFenceGhost(intersect) {
        if (!FENCE_ITEMS.includes(this.currentItem)) return false;
        const hit = intersect.object;
        if (!hit || !hit.userData || hit.userData.item !== FENCE_POST) return false;
        const n = intersect.face.normal.clone().transformDirection(hit.matrixWorld);
        const axis = Math.abs(n.x) >= Math.abs(n.z) ? 'x' : 'z';
        const sign = n[axis] >= 0 ? 1 : -1;
        if (this.currentItem === FENCE_POST) {
            this.ghostObject.position.copy(hit.position);
            this.ghostObject.position[axis] += sign * 2;
        } else {
            this.ghostObject.position.copy(hit.position);
            this.ghostObject.position[axis] += sign;
            this.ghostObject.rotation.y = axis === 'x' ? 0 : Math.PI / 2;
        }
        const h = this.getMeshHeightForItem(this.currentItem, this.ghostObject.geometry);
        const gy = this.getGroundYAt(this.ghostObject.position.x, this.ghostObject.position.z);
        this.ghostObject.position.y = gy + h / 2 + 0.02;
        return true;
    }

    updateGhost() {
        if (this.fpMode) return;
        if (!this.ghostObject) return;
        if (this.currentItem === 'paintbrush') {
            const t = Date.now() * 0.006;
            const s = 1 + Math.sin(t) * 0.15;
            this.ghostObject.scale.set(s, s, s);
            this.ghostObject.rotation.y += 0.02;
        } else {
            this.ghostObject.scale.set(1, 1, 1);
        }
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const targets = [];
        if (this.innerPlane) targets.push(this.innerPlane);
        if (this.plane) targets.push(this.plane);
        targets.push(...this.objects);
        const intersects = this.raycaster.intersectObjects(targets);

        if (intersects.length > 0 && this.currentItem === 'paintbrush') {
            const intersect = intersects[0];
            this.ghostObject.position.copy(intersect.point);
            this.ghostObject.visible = true;
            const gmat = this.ghostObject.material;
            if (gmat && gmat.color) gmat.color.setHex(0x00ffff);
            this.updateSiteReadout(intersect.point.x, intersect.point.y, intersect.point.z);
            return;
        }

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const pos = intersect.point
                .clone()
                .add(intersect.face.normal.clone().multiplyScalar(0.5));
            const isHitStackable = intersect.object && intersect.object.userData && ['pipe', 'column', 'pex', 'spray'].includes(intersect.object.userData.item);
            const isCurrentStackable = ['pipe', 'column', 'pex', 'spray'].includes(this.currentItem);

            if (this.trySnapFenceGhost(intersect)) {
                this.ghostObject.visible = true;
                this.updateSiteReadout(
                    this.ghostObject.position.x,
                    this.ghostObject.position.y,
                    this.ghostObject.position.z
                );
                const blocked = this.ghostOverlapsPlaced(this.ghostObject);
                const gmat = this.ghostObject.material;
                if (gmat && gmat.color) gmat.color.setHex(blocked ? 0xff3355 : 0x00f2ff);
                return;
            }

            if (isCurrentStackable && isHitStackable && intersect.face.normal.y > -0.5) {
                // Snap Lock: Snap to the top of the hit object
                const hit = intersect.object;
                this.ghostObject.position.x = hit.position.x;
                this.ghostObject.position.z = hit.position.z;
                const hitH = this.getMeshHeightForItem(hit.userData.item, hit.geometry);
                const geom = this.ghostObject.geometry;
                const h = this.getMeshHeightForItem(this.currentItem, geom);
                
                // If we hit the top, go up. If we hit the side, try to snap to top anyway for "lock" feel
                const topY = hit.position.y + hitH / 2;
                this.ghostObject.position.y = topY + h / 2;
            } else if (this.currentItem === 'pex') {
                const n = intersect.face.normal;
                const snapPoint = intersect.point.clone().add(n.clone().multiplyScalar(0.04));
                this.ghostObject.position.x = Math.abs(n.x) > 0.5 ? snapPoint.x : Math.round(snapPoint.x * 4) / 4;
                this.ghostObject.position.y = Math.abs(n.y) > 0.5 ? snapPoint.y : Math.round(snapPoint.y * 4) / 4;
                this.ghostObject.position.z = Math.abs(n.z) > 0.5 ? snapPoint.z : Math.round(snapPoint.z * 4) / 4;
            } else {
                const g = this._fineSnap ? 4 : 1;
                this.ghostObject.position.x = Math.round(pos.x * g) / g;
                this.ghostObject.position.z = Math.round(pos.z * g) / g;
                const geom = this.ghostObject.geometry;
                const h = this.getMeshHeightForItem(this.currentItem, geom);
                this.ghostObject.position.y = Math.max(h / 2, pos.y);
                if (['column', 'pipe', 'pot', FENCE_POST].includes(this.currentItem)) {
                    const gy = this.getGroundYAt(this.ghostObject.position.x, this.ghostObject.position.z);
                    this.ghostObject.position.y = gy + h / 2 + 0.02;
                } else if (this.currentItem === 'beam' || this.currentItem === 'slab') {
                    const gy = this._fineSnap ? Math.round(pos.y * 40) / 40 : Math.round(pos.y * 10) / 10;
                    this.ghostObject.position.y = gy;
                } else {
                    this.ghostObject.position.y = this._fineSnap
                        ? Math.round(pos.y * g) / g
                        : Math.round(pos.y);
                }
            }
            if (this.currentItem === 'spray') {
                // Pin spray to surface exactly
                this.ghostObject.position.copy(intersect.point).add(intersect.face.normal.clone().multiplyScalar(0.01));
                // Align to normal
                const lookTarget = intersect.point.clone().add(intersect.face.normal);
                this.ghostObject.lookAt(lookTarget);
            }
            this.ghostObject.visible = true;
            this.updateSiteReadout(
                this.ghostObject.position.x,
                this.ghostObject.position.y,
                this.ghostObject.position.z
            );
            const blocked = this.ghostOverlapsPlaced(this.ghostObject);
            const gmat = this.ghostObject.material;
            if (gmat && gmat.color) {
                gmat.color.setHex(blocked ? 0xff3355 : 0x00f2ff);
            }
        } else {
            this.ghostObject.visible = false;
            const sr = document.getElementById('site-readout');
            if (sr) {
                const snapHint = this.currentItem === 'pex' ? ' · PEX surface snap' : this._fineSnap ? ' · Alt: ¼ m' : ' · 1 m grid';
                sr.textContent = `Cursor —${snapHint}`;
            }
            const gmat = this.ghostObject.material;
            if (gmat && gmat.color) {
                gmat.color.setHex(0x00f2ff);
            }
        }
    }

    buildStandardMaterial(materialKey) {
        if (materialKey === 'glass') {
            return new THREE.MeshStandardMaterial({ 
                color: 0xa9d0f5, 
                transparent: true, 
                opacity: 0.5, 
                roughness: 0.1, 
                metalness: 0.5 
            });
        }
        if (materialKey === 'water') {
            return new THREE.MeshStandardMaterial({ 
                color: 0x0096ff, 
                transparent: true, 
                opacity: 0.7, 
                roughness: 0.0, 
                metalness: 0.1 
            });
        }
        if (materialKey === 'pex_red') {
            return new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3, metalness: 0.1 });
        }
        if (materialKey === 'pex_blue') {
            return new THREE.MeshStandardMaterial({ color: 0x3366ff, roughness: 0.3, metalness: 0.1 });
        }

        let baseKey = materialKey;
        let colorTint = 0xffffff;
        let roughness = 0.7;
        let metalness = 0.3;

        // Coded Variations
        if (materialKey === 'dark_wood') { baseKey = 'wood'; colorTint = 0x5c4033; }
        else if (materialKey === 'light_wood') { baseKey = 'wood'; colorTint = 0xffe4c4; }
        else if (materialKey === 'mahogany') { baseKey = 'wood'; colorTint = 0x6b2e2e; }
        else if (materialKey === 'granite') { baseKey = 'concrete'; colorTint = 0x888899; roughness = 0.6; }
        else if (materialKey === 'sandstone') { baseKey = 'concrete'; colorTint = 0xd2b48c; roughness = 0.9; }
        else if (materialKey === 'slate') { baseKey = 'cobblestone'; colorTint = 0x5a636a; roughness = 0.8; }
        
        // Base Overrides
        else if (materialKey === 'grass') { roughness = 1.0; metalness = 0.0; }
        else if (materialKey === 'asphalt') { roughness = 0.9; metalness = 0.1; }
        else if (materialKey === 'terracotta') { roughness = 0.7; metalness = 0.1; }

        const map = this.textures[baseKey] || this.createFallbackTexture(baseKey);
        return new THREE.MeshStandardMaterial({
            map,
            color: colorTint,
            roughness,
            metalness
        });
    }

    applyItemOrientation(mesh, item) {
        if (item === 'hook') {
            mesh.rotation.x = Math.PI / 2;
        }
    }

    createMeshFromSnapshot(snap) {
        const geometry = this.getItemGeometry(snap.item);
        const mat = this.buildStandardMaterial(snap.material);
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.fromArray(snap.position);
        const r = snap.rotation;
        if (r && r.length >= 3) {
            mesh.rotation.set(r[0], r[1], r[2]);
        }
        const lv = Number.isFinite(snap.level) ? snap.level : 0;
        mesh.userData = {
            id: snap.id,
            item: snap.item,
            material: snap.material,
            level: lv
        };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    meshToSnapshot(mesh) {
        return {
            id: mesh.userData.id,
            item: mesh.userData.item,
            material: mesh.userData.material,
            level: mesh.userData.level ?? 0,
            position: mesh.position.toArray(),
            rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z]
        };
    }

    findMeshById(id) {
        return this.objects.find((o) => o.userData && o.userData.id === id) || null;
    }

    removeMeshById(id) {
        const mesh = this.findMeshById(id);
        if (!mesh) return null;
        this.scene.remove(mesh);
        this.objects = this.objects.filter((o) => o !== mesh);
        this.updateTakeoff();
        this.applyLevelVisibility();
        return mesh;
    }

    runUndo() {
        const op = this.undoStack.pop();
        if (!op) {
            this.showToast('Nothing to undo.', 'info');
            return;
        }
        this._inHistory = true;
        try {
            if (op.t === 'place') {
                this.removeMeshById(op.snap.id);
                this.redoStack.push(op);
            } else if (op.t === 'remove') {
                const mesh = this.createMeshFromSnapshot(op.snap);
                this.scene.add(mesh);
                this.objects.push(mesh);
                this.updateTakeoff();
                this.redoStack.push(op);
            } else if (op.t === 'paint_object') {
                const mesh = this.findMeshById(op.snapBefore.id);
                if (mesh) {
                    mesh.userData.material = op.snapBefore.material;
                    mesh.material = this.buildStandardMaterial(op.snapBefore.material);
                    this.updateTakeoff();
                }
                this.redoStack.push(op);
            } else if (op.t === 'clear') {
                for (const s of op.snaps) {
                    const m = this.createMeshFromSnapshot(s);
                    this.scene.add(m);
                    this.objects.push(m);
                }
                this._nextId = this.objects.reduce(
                    (m, o) => Math.max(m, o.userData.id || 0),
                    0
                ) + 1;
                this.updateTakeoff();
                this.redoStack.push(op);
            }
            this.applyLevelVisibility();
        } finally {
            this._inHistory = false;
        }
        this.scheduleDraftSave();
    }

    runRedo() {
        const op = this.redoStack.pop();
        if (!op) {
            this.showToast('Nothing to redo.', 'info');
            return;
        }
        this._inHistory = true;
        try {
            if (op.t === 'place') {
                const mesh = this.createMeshFromSnapshot(op.snap);
                this.scene.add(mesh);
                this.objects.push(mesh);
                this.updateTakeoff();
                this.undoStack.push(op);
            } else if (op.t === 'remove') {
                this.removeMeshById(op.snap.id);
                this.undoStack.push(op);
            } else if (op.t === 'paint_object') {
                const mesh = this.findMeshById(op.snapAfter.id);
                if (mesh) {
                    mesh.userData.material = op.snapAfter.material;
                    mesh.material = this.buildStandardMaterial(op.snapAfter.material);
                    this.updateTakeoff();
                }
                this.undoStack.push(op);
            } else if (op.t === 'clear') {
                this.purgeAllMeshes();
                this.undoStack.push(op);
            }
            this.applyLevelVisibility();
        } finally {
            this._inHistory = false;
        }
        this.scheduleDraftSave();
    }

    purgeAllMeshes() {
        for (const o of this.objects) {
            this.scene.remove(o);
        }
        this.objects = [];
        this.updateTakeoff();
        this.applyLevelVisibility();
    }

    placeObject() {
        if (this.fpMode) return;
        if (this.measureMode) return;
        if (this._inHistory) return;
        if (this.currentItem === 'paintbrush') {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObjects(this.objects);
            if (hits.length === 0) return;
            const obj = hits[0].object;
            const oldMaterial = obj.userData.material;
            const newMaterial = this.currentMaterial;
            if (oldMaterial === newMaterial) return;
            const snapBefore = this.meshToSnapshot(obj);
            obj.userData.material = newMaterial;
            obj.material = this.buildStandardMaterial(newMaterial);
            const snapAfter = this.meshToSnapshot(obj);
            this.redoStack = [];
            this.undoStack.push({ t: 'paint_object', snapBefore, snapAfter });
            this.updateTakeoff();
            this.scheduleDraftSave();
            this.triggerPlacementVfx(obj.position, newMaterial);
            this.showToast(`Painted part with ${newMaterial}`, 'info');
            return;
        }
        if (!this.ghostObject.visible) return;
        if (this.ghostOverlapsPlaced(this.ghostObject)) {
            this.showToast('Can\'t place — overlaps another part.', 'danger');
            return;
        }
        const id = this._nextId++;
        const geometry = this.getItemGeometry(this.currentItem);
        const mat = this.buildStandardMaterial(this.currentMaterial);
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.copy(this.ghostObject.position);
        mesh.rotation.copy(this.ghostObject.rotation);
        const lvl = this.getActiveBuildLevel();
        mesh.userData = {
            id,
            item: this.currentItem,
            material: this.currentMaterial,
            level: lvl
        };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.commitPlacedMesh(mesh);
    }

    removeObject() {
        if (this.fpMode) return;
        if (this.measureMode) return;
        if (this._inHistory) return;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.objects);
        if (hits.length === 0) return;
        const obj = hits[0].object;
        const snap = this.meshToSnapshot(obj);
        this.scene.remove(obj);
        this.objects = this.objects.filter((o) => o !== obj);
        this.updateTakeoff();
        this.redoStack = [];
        this.undoStack.push({ t: 'remove', snap });
        this.applyLevelVisibility();
        this.scheduleDraftSave();
        this.showToast('Part removed.', 'info');
    }

    triggerEyedropper() {
        if (this.fpMode) return;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.objects);
        if (hits.length === 0) return;
        const obj = hits[0].object;
        if (obj && obj.userData) {
            if (obj.userData.item) this.setActiveItem(obj.userData.item);
            if (obj.userData.material) this.setActiveMaterial(obj.userData.material);
            this.showToast(`Eyedropped: ${obj.userData.item} (${obj.userData.material})`, 'info');
        }
    }

    cloneHoveredObject() {
        if (this.fpMode || this.measureMode || this._inHistory) return;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.objects);
        if (hits.length === 0) {
            this.showToast('Hover a part to clone it.', 'info');
            return;
        }
        const hit = hits[0];
        const source = hit.object;
        const snap = this.meshToSnapshot(source);
        const normal = hit.face.normal.clone().transformDirection(source.matrixWorld);
        const axis = Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)
            ? 'x'
            : Math.abs(normal.y) > Math.abs(normal.z)
                ? 'y'
                : 'z';
        const offset = new THREE.Vector3();
        offset[axis] = normal[axis] >= 0 ? 1 : -1;
        snap.id = this._nextId++;
        snap.position = [
            snap.position[0] + offset.x,
            Math.max(0.05, snap.position[1] + offset.y),
            snap.position[2] + offset.z
        ];
        const mesh = this.createMeshFromSnapshot(snap);
        if (this.meshIntersectsPlaced(mesh)) {
            this._nextId -= 1;
            mesh.geometry.dispose();
            if (mesh.material && typeof mesh.material.dispose === 'function') mesh.material.dispose();
            this.showToast('Clone blocked — target space is occupied.', 'danger');
            return;
        }
        this.commitPlacedMesh(mesh);
        this.showToast(`Cloned ${snap.item}.`, 'info');
    }

    clearSceneConfirmed() {
        if (this._inHistory) return;
        const ok = window.confirm(
            'Clear the entire build? This can be undone once with Ctrl+Z.'
        );
        if (!ok) {
            this.showToast('Clear cancelled.', 'info');
            return;
        }
        if (this.objects.length === 0) {
            this.showToast('Scene is already empty.', 'info');
            return;
        }
        const snaps = this.objects.map((o) => this.meshToSnapshot(o));
        this.redoStack = [];
        this.undoStack.push({ t: 'clear', snaps });
        this.purgeAllMeshes();
        this.scheduleDraftSave();
        this.showToast('Scene cleared. Undo: Ctrl+Z', 'info');
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    buildTakeoffGroupHtml(group) {
        const rows =
            group.rows.length > 0
                ? group.rows
                      .map(
                          (r) =>
                              `<div class="takeoff-row"><span class="takeoff-row__name">${this.escapeHtml(
                                  r.name
                              )}</span><span class="takeoff-row__count">${r.count}</span></div>`
                      )
                      .join('')
                : '<span class="takeoff-empty">(none)</span>';
        return `<div class="takeoff-group" data-takeoff-group="${this.escapeHtml(group.id)}">
<button type="button" class="takeoff-group-toggle">${this.escapeHtml(group.title)}</button>
<div class="takeoff-group-body">${rows}</div></div>`;
    }

    setAllTakeoffGroupsCollapsed(collapsed) {
        document.querySelectorAll('#takeoff-body .takeoff-group').forEach((g) => {
            g.classList.toggle('collapsed', collapsed);
        });
    }

    initTakeoffPanel() {
        const body = document.getElementById('takeoff-body');
        if (body && body.dataset.takeoffBound !== '1') {
            body.dataset.takeoffBound = '1';
            body.addEventListener('click', (e) => {
                const btn = e.target.closest('.takeoff-group-toggle');
                if (!btn) return;
                btn.closest('.takeoff-group')?.classList.toggle('collapsed');
            });
        }
        document.getElementById('takeoff-expand-all')?.addEventListener('click', () => {
            this.setAllTakeoffGroupsCollapsed(false);
        });
        document.getElementById('takeoff-collapse-all')?.addEventListener('click', () => {
            this.setAllTakeoffGroupsCollapsed(true);
        });
    }

    updateTakeoff() {
        const el = document.getElementById('takeoff-body');
        if (!el) return;

        if (this.objects.length === 0) {
            el.innerHTML = '<p class="takeoff-empty">—</p>';
            return;
        }

        const byItem = new Map();
        const byMat = new Map();
        const byLevel = new Map();
        for (const o of this.objects) {
            const it = o.userData.item || 'unknown';
            const m = o.userData.material || 'unknown';
            byItem.set(it, (byItem.get(it) || 0) + 1);
            byMat.set(m, (byMat.get(m) || 0) + 1);
            const lv = o.userData.level ?? 0;
            byLevel.set(lv, (byLevel.get(lv) || 0) + 1);
        }

        const groups = [
            {
                id: 'pieces',
                title: 'Piece counts',
                rows: ITEM_TYPES.filter((k) => byItem.get(k)).map((k) => ({
                    name: k.replace(/_/g, ' '),
                    count: byItem.get(k),
                })),
            },
            {
                id: 'materials',
                title: 'Material counts',
                rows: MATERIAL_KEYS.filter((k) => byMat.get(k)).map((k) => ({
                    name: k.replace(/_/g, ' '),
                    count: byMat.get(k),
                })),
            },
            {
                id: 'levels',
                title: 'By level',
                rows: [...byLevel.entries()]
                    .sort((a, b) => a[0] - b[0])
                    .map(([lv, count]) => ({ name: `Level ${lv}`, count })),
            },
        ];

        el.innerHTML =
            `<p class="takeoff-summary">Total: ${this.objects.length}</p>` +
            groups.map((g) => this.buildTakeoffGroupHtml(g)).join('');
    }

    initTheme() {
        const KEY = 'builder3d-theme';
        let theme = 'dark';
        try {
            const saved = localStorage.getItem(KEY);
            if (saved === 'light' || saved === 'dark') theme = saved;
        } catch (e) {
            /* ignore */
        }
        this.applyTheme(theme, { silent: true, persist: false });
    }

    applyTheme(theme, { silent = false, persist = true } = {}) {
        const light = theme === 'light';
        document.body.classList.toggle('theme-light', light);
        document.body.classList.toggle('theme-dark', !light);
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.setAttribute('aria-pressed', String(light));
            btn.textContent = light ? 'Dark panel' : 'Light panel';
            const tip = light
                ? 'Switch tools panel to dark theme'
                : 'Switch tools panel to light theme (whitish background, dark text)';
            btn.setAttribute('title', tip);
            btn.setAttribute('aria-label', tip);
        }
        if (persist) {
            try {
                localStorage.setItem('builder3d-theme', light ? 'light' : 'dark');
            } catch (e) {
                /* ignore */
            }
        }
        if (!silent) {
            this.showToast(light ? 'Light tools panel' : 'Dark tools panel', 'info');
        }
    }

    toggleTheme() {
        const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
        this.applyTheme(next);
    }

    initPanelDesign() {
        const KEY = 'builder3d-panel-design';
        let mode = 'classic';
        try {
            const saved = localStorage.getItem(KEY);
            if (saved === 'pop' || saved === 'classic') mode = saved;
        } catch (e) {
            /* ignore */
        }
        this.applyPanelDesign(mode, { silent: true, persist: false });
    }

    applyPanelDesign(mode, { silent = false, persist = true } = {}) {
        const pop = mode === 'pop';
        document.body.classList.toggle('sidebar-design-pop', pop);
        const btn = document.getElementById('design-toggle-btn');
        if (btn) {
            btn.setAttribute('aria-pressed', String(pop));
            btn.textContent = pop ? 'Classic' : 'Design';
            const tip = pop
                ? 'Switch tools panel to classic accordion layout'
                : 'Pop-open button layout — sections open below each button';
            btn.setAttribute('title', tip);
            btn.setAttribute('aria-label', tip);
        }
        if (persist) {
            try {
                localStorage.setItem('builder3d-panel-design', pop ? 'pop' : 'classic');
            } catch (e) {
                /* ignore */
            }
        }
        if (!silent) {
            this.showToast(pop ? 'Pop-open panel design' : 'Classic panel layout', 'info');
        }
    }

    togglePanelDesign() {
        const next = document.body.classList.contains('sidebar-design-pop') ? 'classic' : 'pop';
        this.applyPanelDesign(next);
    }

    getTakeoffTsv() {
        const byItem = new Map();
        const byMat = new Map();
        const byLevel = new Map();
        for (const o of this.objects) {
            const it = o.userData.item || 'unknown';
            const m = o.userData.material || 'unknown';
            byItem.set(it, (byItem.get(it) || 0) + 1);
            byMat.set(m, (byMat.get(m) || 0) + 1);
            const lv = o.userData.level ?? 0;
            byLevel.set(lv, (byLevel.get(lv) || 0) + 1);
        }
        const rows = [['section', 'name', 'count']];
        for (const k of ITEM_TYPES) {
            const c = byItem.get(k) || 0;
            if (c) rows.push(['piece', k, String(c)]);
        }
        for (const k of MATERIAL_KEYS) {
            const c = byMat.get(k) || 0;
            if (c) rows.push(['material', k, String(c)]);
        }
        for (let L = 0; L <= 4; L++) {
            const c = byLevel.get(L) || 0;
            if (c) rows.push(['level', String(L), String(c)]);
        }
        return rows.map((r) => r.join('\t')).join('\n');
    }

    copyTakeoffTsv() {
        const tsv = this.getTakeoffTsv();
        if (this.objects.length === 0) {
            this.showToast('Nothing to count yet.', 'info');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(tsv)
                .then(() => this.showToast('Takeoff copied to clipboard (TSV).', 'info'))
                .catch(() => this.showToast('Clipboard failed — see console.', 'danger'));
        } else {
            this.showToast('Clipboard API unavailable.', 'danger');
        }
    }

    buildBlueprintPayload() {
        return {
            v: BLUEPRINT_VERSION,
            site: {
                outerMaterial: this.siteGround.outer,
                innerMaterial: this.siteGround.inner
            },
            parts: this.objects.map((o) => this.meshToSnapshot(o))
        };
    }

    applyGroundMaterials(outerKey, innerKey) {
        const outer = MATERIAL_KEYS.includes(outerKey) ? outerKey : 'concrete';
        const inner = MATERIAL_KEYS.includes(innerKey) ? innerKey : outer;
        const makeGroundMaterial = (key, repeat) => {
            const mat = this.buildStandardMaterial(key);
            if (mat.map) {
                mat.map = mat.map.clone();
                mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
                mat.map.repeat.set(repeat, repeat);
                mat.map.needsUpdate = true;
            }
            return mat;
        };
        this.siteGround.outer = outer;
        this.siteGround.inner = inner;
        if (this.plane) this.plane.material = makeGroundMaterial(outer, 18);
        if (this.innerPlane) this.innerPlane.material = makeGroundMaterial(inner, 5);
    }

    applySiteFromBlueprint(data) {
        const site = data && data.site ? data.site : null;
        if (!site) return;
        this.applyGroundMaterials(site.outerMaterial, site.innerMaterial);
    }

    exportBlueprint() {
        const payload = this.buildBlueprintPayload();
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json'
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'builder-blueprint.json';
        a.click();
        URL.revokeObjectURL(a.href);
        this.showToast('Blueprint file downloaded.', 'info');
    }

    importBlueprintJson(text) {
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            this.showToast('Invalid JSON file.', 'danger');
            return;
        }
        if (!data || !Array.isArray(data.parts)) {
            this.showToast('Blueprint format not recognized (need parts[]).', 'danger');
            return;
        }
        this.purgeAllMeshes();
        this.undoStack = [];
        this.redoStack = [];
        this.applySiteFromBlueprint(data);
        let maxId = 0;
        for (const s of data.parts) {
            if (!s || !s.item || !s.material || !s.position) continue;
            const id = Number.isFinite(s.id) ? s.id : this._nextId++;
            maxId = Math.max(maxId, id);
            const rot = s.rotation;
            const snap = {
                id,
                item: s.item,
                material: s.material,
                position: s.position,
                level: Number.isFinite(s.level) ? s.level : 0,
                rotation:
                    Array.isArray(rot) && rot.length >= 3
                        ? [rot[0], rot[1], rot[2]]
                        : [0, 0, 0]
            };
            const mesh = this.createMeshFromSnapshot(snap);
            this.scene.add(mesh);
            this.objects.push(mesh);
        }
        this._nextId = maxId + 1;
        this.updateTakeoff();
        this.applyLevelVisibility();
        this.scheduleDraftSave();
        this.showToast(
            `Loaded ${this.objects.length} part(s) from file.`,
            'info'
        );
    }

    setActiveMaterial(key) {
        this.currentMaterial = key;
        document.querySelectorAll('[data-material]').forEach((b) => {
            b.classList.toggle('active', b.dataset.material === key);
        });
        this.scrollSidebarToSelection('[data-material]');
    }

    setActiveItem(key) {
        this.currentItem = key;
        const fenceIdx = FENCE_ITEMS.indexOf(key);
        if (fenceIdx >= 0) this._fenceCycleIdx = fenceIdx;
        if (key.startsWith('fence_') && !WOOD_MATERIALS.includes(this.currentMaterial)) {
            this.setActiveMaterial('wood');
        }
        document.querySelectorAll('[data-item]').forEach((b) => {
            b.classList.toggle('active', b.dataset.item === key);
        });
        this.createGhost();
        this.scrollSidebarToSelection('[data-item]');
    }

    cycleMaterial() {
        const i = MATERIAL_KEYS.indexOf(this.currentMaterial);
        const next = MATERIAL_KEYS[(i + 1 + MATERIAL_KEYS.length) % MATERIAL_KEYS.length];
        this.setActiveMaterial(next);
    }

    getSidebarSectionId(toggleBtn) {
        const id = toggleBtn?.dataset?.sectionId;
        if (id) return id;
        const label = (toggleBtn?.textContent || '').trim().toLowerCase();
        return label.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    }

    readSidebarSectionsStorage() {
        try {
            const raw = localStorage.getItem('builder3d-sidebar-sections');
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    persistSidebarSectionsFromDOM() {
        const state = {};
        document.querySelectorAll('.section-toggle').forEach((btn) => {
            const key = this.getSidebarSectionId(btn);
            if (key) state[key] = btn.classList.contains('collapsed');
        });
        try {
            localStorage.setItem('builder3d-sidebar-sections', JSON.stringify(state));
        } catch (e) {
            /* storage disabled */
        }
    }

    setToolSectionCollapsed(toggleBtn, collapsed) {
        if (!toggleBtn) return;
        toggleBtn.classList.toggle('collapsed', collapsed);
        const body = toggleBtn.nextElementSibling;
        if (body && body.classList.contains('section-body')) {
            body.classList.toggle('collapsed', collapsed);
        }
    }

    restoreSidebarSections() {
        const saved = this.readSidebarSectionsStorage();
        if (!Object.keys(saved).length) return;
        document.querySelectorAll('.section-toggle').forEach((btn) => {
            const key = this.getSidebarSectionId(btn);
            if (Object.prototype.hasOwnProperty.call(saved, key)) {
                this.setToolSectionCollapsed(btn, !!saved[key]);
            }
        });
    }

    ensureSidebarSectionVisible(optionBtn) {
        if (!optionBtn) return;
        const section = optionBtn.closest('.tool-section');
        const toggle = section?.querySelector('.section-toggle');
        const body = toggle?.nextElementSibling;
        if (toggle?.classList.contains('collapsed')) {
            toggle.classList.remove('collapsed');
            if (body?.classList.contains('section-body')) body.classList.remove('collapsed');
            this.persistSidebarSectionsFromDOM();
        }
    }

    scrollSidebarToSelection(attrSelector) {
        if (this.sidebarCollapsed) return;
        const el = attrSelector
            ? document.querySelector(`#sidebar .option-btn.active${attrSelector}`)
            : document.querySelector('#sidebar .option-btn.active');
        if (!el) return;
        this.ensureSidebarSectionVisible(el);
        const motion = this.reducedMotion ? 'auto' : 'smooth';
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion });
    }

    setAllToolSectionsCollapsed(collapsed) {
        document.querySelectorAll('.section-toggle').forEach((btn) => {
            this.setToolSectionCollapsed(btn, collapsed);
        });
        this.persistSidebarSectionsFromDOM();
    }

    setSidebarWidthPx(px) {
        const min = 260;
        const max = 480;
        const w = Math.round(Math.max(min, Math.min(max, px)));
        document.documentElement.style.setProperty('--sidebar-width', `${w}px`);
        document.documentElement.style.setProperty('--sidebar-slot-width', `${w}px`);
        return w;
    }

    setSidebarCollapsed(collapsed, silent = false) {
        this.sidebarCollapsed = collapsed;
        document.body.classList.toggle('sidebar-collapsed', collapsed);
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        const expandTab = document.getElementById('sidebar-expand-tab');
        if (collapseBtn) {
            collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        }
        if (expandTab) {
            expandTab.hidden = !collapsed;
        }
        if (!collapsed) {
            document.documentElement.style.setProperty(
                '--sidebar-slot-width',
                getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() || '360px'
            );
        }
        try {
            localStorage.setItem('builder3d-sidebar-collapsed', collapsed ? '1' : '0');
        } catch (e) {
            /* storage disabled */
        }
        if (!silent) {
            this.showToast(collapsed ? 'Tools panel hidden - B or > to open' : 'Tools panel open', 'info');
        }
    }

    toggleSidebarCollapsed() {
        this.setSidebarCollapsed(!this.sidebarCollapsed);
    }

    initSidebarChrome() {
        this.initTheme();
        this.initPanelDesign();
        const WIDTH_KEY = 'builder3d-sidebar-width';
        const DEFAULT_W = 360;
        const designBtn = document.getElementById('design-toggle-btn');
        const themeBtn = document.getElementById('theme-toggle-btn');
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        const expandTab = document.getElementById('sidebar-expand-tab');
        const resizer = document.getElementById('sidebar-resizer');
        const expandAll = document.getElementById('sections-expand-all');
        const collapseAll = document.getElementById('sections-collapse-all');

        try {
            const raw = localStorage.getItem(WIDTH_KEY);
            if (raw) {
                const n = parseInt(raw, 10);
                if (Number.isFinite(n)) this.setSidebarWidthPx(n);
            }
            if (localStorage.getItem('builder3d-sidebar-collapsed') === '1') {
                this.setSidebarCollapsed(true, true);
            }
            this.restoreSidebarSections();
        } catch (e) {
            /* ignore */
        }

        designBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanelDesign();
        });

        themeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTheme();
        });

        collapseBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setSidebarCollapsed(true);
        });
        expandTab?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setSidebarCollapsed(false);
            expandTab.blur();
        });

        expandAll?.addEventListener('click', () => {
            this.setAllToolSectionsCollapsed(false);
            this.showToast('All sections expanded', 'info');
        });
        collapseAll?.addEventListener('click', () => {
            this.setAllToolSectionsCollapsed(true);
            this.showToast('All sections collapsed', 'info');
        });

        if (resizer) {
            const onMove = (e) => {
                if (!this._sidebarResizeActive || this.sidebarCollapsed) return;
                const w = this.setSidebarWidthPx(e.clientX);
                try {
                    localStorage.setItem(WIDTH_KEY, String(w));
                } catch (err) {
                    /* ignore */
                }
            };
            const endResize = () => {
                if (!this._sidebarResizeActive) return;
                this._sidebarResizeActive = false;
                document.body.classList.remove('sidebar-resizing');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', endResize);
            };
            resizer.addEventListener('mousedown', (e) => {
                if (this.sidebarCollapsed) return;
                e.preventDefault();
                this._sidebarResizeActive = true;
                document.body.classList.add('sidebar-resizing');
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', endResize);
            });
            resizer.addEventListener('dblclick', (e) => {
                e.preventDefault();
                const w = this.setSidebarWidthPx(DEFAULT_W);
                try {
                    localStorage.setItem(WIDTH_KEY, String(w));
                } catch (err) {
                    /* ignore */
                }
                this.showToast('Panel width reset', 'info');
            });
        }
    }

    paintOuterGround() {
        if (!this.plane) return;
        this.siteGround.outer = this.currentMaterial;
        this.plane.material = this.buildStandardMaterial(this.currentMaterial);
        this.scheduleDraftSave();
        this.showToast(`Outer ground painted with ${this.currentMaterial}`, 'info');
    }

    paintInnerGround() {
        if (!this.innerPlane) return;
        this.siteGround.inner = this.currentMaterial;
        this.innerPlane.material = this.buildStandardMaterial(this.currentMaterial);
        this.scheduleDraftSave();
        this.showToast(`Build zone painted with ${this.currentMaterial}`, 'info');
    }

    paintBothGround() {
        this.applyGroundMaterials(this.currentMaterial, this.currentMaterial);
        this.scheduleDraftSave();
        this.showToast(`Both grounds painted with ${this.currentMaterial}`, 'info');
    }

    applyGrassyYardPreset() {
        this.applyGroundMaterials('grass', 'grass');
        this.setActiveMaterial('grass');
        this.applyLightingPreset('dusk');
        this.scheduleDraftSave();
        this.showToast('Grassy yard: grass site + warm dusk lighting', 'info');
    }

    cycleFenceItem() {
        this._fenceCycleIdx = (this._fenceCycleIdx + 1) % FENCE_ITEMS.length;
        this.setActiveItem(FENCE_ITEMS[this._fenceCycleIdx]);
    }

    placeNextFencePost() {
        const posts = this.objects.filter((o) => o.userData.item === FENCE_POST);
        if (posts.length === 0) {
            this.setActiveItem(FENCE_POST);
            this.showToast('Place a fence post first.', 'info');
            return;
        }
        const last = posts[posts.length - 1];
        const snap = this.meshToSnapshot(last);
        snap.id = this._nextId++;
        snap.position = [last.position.x + 2, last.position.y, last.position.z];
        const mesh = this.createMeshFromSnapshot(snap);
        if (this.meshIntersectsPlaced(mesh)) {
            this._nextId -= 1;
            this.showToast('Next fence post blocked.', 'danger');
            return;
        }
        this.commitPlacedMesh(mesh);
        this.showToast('Next fence post placed.', 'info');
    }

    /** Sidebar/header tooltips - faster than native `title` (~1s OS delay). */
    initFastTooltips() {
        const TOOLTIP_DELAY_MS = 200;
        const roots = [
            document.getElementById('sidebar')
        ].filter(Boolean);
        if (!roots.length) return;

        let tip = document.getElementById('fast-tooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'fast-tooltip';
            tip.className = 'fast-tooltip';
            tip.setAttribute('role', 'tooltip');
            tip.hidden = true;
            document.body.appendChild(tip);
        }

        let showTimer = null;
        let anchor = null;

        const hide = () => {
            clearTimeout(showTimer);
            showTimer = null;
            anchor = null;
            tip.hidden = true;
        };

        const position = (target) => {
            const r = target.getBoundingClientRect();
            tip.style.left = `${Math.round(r.right + 10)}px`;
            tip.style.top = `${Math.round(r.top + r.height / 2)}px`;
        };

        const showNow = (target, text) => {
            tip.textContent = text;
            position(target);
            tip.hidden = false;
            anchor = target;
        };

        const bindNode = (node) => {
            const text = node.getAttribute('title');
            if (!text || node.dataset.fastTipBound === '1') return;
            node.dataset.fastTipBound = '1';
            node.setAttribute('aria-label', text);
            node.removeAttribute('title');

            node.addEventListener('mouseenter', () => {
                clearTimeout(showTimer);
                showTimer = setTimeout(() => showNow(node, text), TOOLTIP_DELAY_MS);
            });
            node.addEventListener('mouseleave', hide);
            node.addEventListener('focus', () => {
                clearTimeout(showTimer);
                showNow(node, text);
            });
            node.addEventListener('blur', hide);
        };

        roots.forEach((root) => {
            root.querySelectorAll('[title]').forEach(bindNode);
        });

        const scroll = document.getElementById('toolbar-scroll');
        if (scroll) {
            scroll.addEventListener('scroll', () => {
                if (!tip.hidden && anchor) position(anchor);
            });
        }
        window.addEventListener('resize', () => {
            if (!tip.hidden && anchor) position(anchor);
        });
    }

    bindEvents() {
        this.initSidebarChrome();
        this.initFastTooltips();
        window.addEventListener('resize', () => this.onResize());

        window.addEventListener(
            'keydown',
            (e) => {
                if (e.code === 'AltLeft' || e.code === 'AltRight') this._fineSnap = true;
            },
            true
        );
        window.addEventListener(
            'keyup',
            (e) => {
                if (e.code === 'AltLeft' || e.code === 'AltRight') this._fineSnap = false;
            },
            true
        );

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        document.addEventListener('mousemove', this._onPointerMove);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        this.renderer.domElement.addEventListener('click', this._onCanvasClickLock);

        window.addEventListener('keydown', this._onFpKeyDown, true);
        window.addEventListener('keyup', this._onFpKeyUp, true);

        const fpBtn = document.getElementById('fp-toggle');
        if (fpBtn) {
            fpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFirstPerson();
            });
        }

        this.fillReleaseModalDom();
        const updateBackdrop = document.getElementById('update-backdrop');
        const updateDismissBtn = document.getElementById('update-dismiss-btn');
        const updateCloseBtn = document.getElementById('update-close-btn');
        if (updateDismissBtn) {
            updateDismissBtn.addEventListener('click', () => this.dismissUpdateModal());
        }
        if (updateCloseBtn) {
            updateCloseBtn.addEventListener('click', () => this.dismissUpdateModal());
        }
        if (updateBackdrop) {
            updateBackdrop.addEventListener('click', (e) => {
                if (e.target === updateBackdrop) this.dismissUpdateModal();
            });
        }
        const whatsNewBtn = document.getElementById('whats-new-btn');
        if (whatsNewBtn) {
            whatsNewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setHelpOpen(false);
                this.openUpdateModalForced();
            });
        }

        const orthoBtn = document.getElementById('ortho-toggle');
        if (orthoBtn) {
            orthoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOrthographic();
            });
        }

        const copyBpBtn = document.getElementById('copy-blueprint-btn');
        if (copyBpBtn) {
            copyBpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyBlueprintToClipboard();
            });
        }

        const placementGridBtn = document.getElementById('placement-grid-btn');
        if (placementGridBtn) {
            placementGridBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleGrid();
            });
            this.syncPlacementGridButton();
        }
        const majorGridBtn = document.getElementById('major-grid-btn');
        if (majorGridBtn) {
            majorGridBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMajorGrid();
            });
        }
        const measureBtn = document.getElementById('measure-toggle');
        if (measureBtn) {
            measureBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMeasureMode();
            });
        }
        const measureClear = document.getElementById('measure-clear');
        if (measureClear) {
            measureClear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearMeasure();
            });
        }
        const levelSel = document.getElementById('build-level');
        if (levelSel) {
            levelSel.addEventListener('change', () => {
                this.applyLevelVisibility();
            });
        }
        const levelFilt = document.getElementById('level-filter');
        if (levelFilt) {
            levelFilt.addEventListener('change', () => {
                this.applyLevelVisibility();
            });
        }
        const lightingSel = document.getElementById('lighting-preset');
        if (lightingSel) {
            lightingSel.addEventListener('change', () => {
                this.applyLightingPreset(lightingSel.value);
            });
        }
        const sunSlider = document.getElementById('sun-angle-slider');
        if (sunSlider) {
            sunSlider.addEventListener('input', () => {
                this.updateSunPosition(parseFloat(sunSlider.value));
            });
        }
        const skyCloudsToggle = document.getElementById('sky-clouds-toggle');
        if (skyCloudsToggle) {
            skyCloudsToggle.addEventListener('change', () => {
                this.setSkyCloudsEnabled(skyCloudsToggle.checked);
            });
            this.syncSkyCloudsToggle();
        }
        const helpBtn = document.getElementById('help-btn');
        const helpClose = document.getElementById('help-close');
        const helpBackdrop = document.getElementById('help-backdrop');
        if (helpBtn) {
            helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setHelpOpen(true);
            });
        }
        if (helpClose) {
            helpClose.addEventListener('click', () => this.setHelpOpen(false));
        }
        if (helpBackdrop) {
            helpBackdrop.addEventListener('click', (e) => {
                if (e.target === helpBackdrop) this.setHelpOpen(false);
            });
        }

        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#sidebar')) return;
            if (this.fpMode) return;
            if (this.measureMode && e.button === 0) {
                e.preventDefault();
                this.onMeasureClickFromEvent();
                return;
            }
            if (e.button === 1) {
                e.preventDefault();
                this.triggerEyedropper();
                return;
            }
            if (e.button === 0) {
                if (e.shiftKey) this.removeObject();
                else this.placeObject();
            }
        });

        document.querySelectorAll('[data-material]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.setActiveMaterial(btn.dataset.material);
            });
        });
        document.querySelectorAll('[data-item]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.setActiveItem(btn.dataset.item);
            });
        });

        document.querySelectorAll('.section-toggle').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.setToolSectionCollapsed(btn, !btn.classList.contains('collapsed'));
                this.persistSidebarSectionsFromDOM();
            });
        });

        const paintOuterBtn = document.getElementById('paint-outer-btn');
        if (paintOuterBtn) {
            paintOuterBtn.addEventListener('click', () => this.paintOuterGround());
        }

        const paintInnerBtn = document.getElementById('paint-inner-btn');
        if (paintInnerBtn) {
            paintInnerBtn.addEventListener('click', () => this.paintInnerGround());
        }
        const paintBothBtn = document.getElementById('paint-both-btn');
        if (paintBothBtn) {
            paintBothBtn.addEventListener('click', () => this.paintBothGround());
        }
        const grassyYardBtn = document.getElementById('grassy-yard-btn');
        if (grassyYardBtn) {
            grassyYardBtn.addEventListener('click', () => this.applyGrassyYardPreset());
        }

        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSceneConfirmed());
        }
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.runUndo();
            });
        }
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.runRedo();
            });
        }
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.exportBlueprint());
        }
        const loadBtn = document.getElementById('load-btn');
        const fileInput = document.getElementById('load-file');
        if (loadBtn && fileInput) {
            loadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                const f = fileInput.files && fileInput.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        this.importBlueprintJson(reader.result);
                    }
                };
                reader.onerror = () => {
                    this.showToast('Failed to read file.', 'danger');
                };
                reader.readAsText(f);
                fileInput.value = '';
            });
        }
        this.initTakeoffPanel();
        const takeoffCopy = document.getElementById('export-takeoff-btn');
        if (takeoffCopy) {
            takeoffCopy.addEventListener('click', () => this.copyTakeoffTsv());
        }

        // Cloud / local server buttons
        const cloudSaveBtn = document.getElementById('cloud-save-btn');
        if (cloudSaveBtn) cloudSaveBtn.addEventListener('click', () => this.openCloudSave());
        const cloudGalleryBtn = document.getElementById('cloud-gallery-btn');
        if (cloudGalleryBtn) cloudGalleryBtn.addEventListener('click', () => this.openCloudGallery());
        const cloudSaveSubmit = document.getElementById('cloud-save-submit');
        if (cloudSaveSubmit) cloudSaveSubmit.addEventListener('click', () => this.submitCloudSave());
        const cloudNewProjBtn = document.getElementById('cloud-new-project-btn');
        if (cloudNewProjBtn) cloudNewProjBtn.addEventListener('click', () => this.createProjectAndSave());
        document.querySelectorAll('.cloud-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('cloud-save-backdrop').hidden = true;
                document.getElementById('cloud-gallery-backdrop').hidden = true;
            });
        });
        // Close cloud modals on backdrop click
        ['cloud-save-backdrop', 'cloud-gallery-backdrop'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', e => { if (e.target === el) el.hidden = true; });
        });

        window.addEventListener('keydown', (e) => {
            if (this.shouldIgnoreKeyboard()) return;
            const mod = e.ctrlKey || e.metaKey;
            if (e.key.toLowerCase() === 'i' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.triggerEyedropper();
                return;
            }
            if (e.key === 'Escape') {
                if (this.fpMode) {
                    e.preventDefault();
                    this.exitFirstPerson();
                    return;
                }
                if (this.updateModalOpen) {
                    e.preventDefault();
                    this.dismissUpdateModal();
                    return;
                }
                if (this.helpOpen) {
                    e.preventDefault();
                    this.setHelpOpen(false);
                    return;
                }
                if (this.measureMode) {
                    e.preventDefault();
                    this.setMeasureMode(false);
                    return;
                }
            }
            if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !mod) {
                e.preventDefault();
                this.setHelpOpen(!this.helpOpen);
                return;
            }
            if (e.key.toLowerCase() === 'v' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.toggleOrthographic();
                return;
            }
            if (e.key.toLowerCase() === 'f' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.frameAllInView();
                return;
            }
            if (e.key === 'Home' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.resetOrbitCamera();
                return;
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
                if (this.fpMode || this.measureMode) return;
                e.preventDefault();
                this.removeObject();
                return;
            }
            if (e.code === 'Backquote' && !mod) {
                e.preventDefault();
                this.statsVisible = !this.statsVisible;
                const st = document.getElementById('stats-overlay');
                if (st) st.hidden = !this.statsVisible;
                if (this.statsVisible) {
                    this.showToast('Stats overlay on (` to hide)', 'info');
                }
                return;
            }
            if (e.key.toLowerCase() === 't' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.toggleMeasureMode();
                return;
            }
            if (e.key.toLowerCase() === 'p' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.repeatLastPlacement();
                return;
            }
            if (e.key.toLowerCase() === 'c' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.cloneHoveredObject();
                return;
            }
            if (e.key.toLowerCase() === 'l' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.cycleLightingPreset();
                return;
            }
            if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.runUndo();
                return;
            }
            if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.runRedo();
                return;
            }
            if (e.key.toLowerCase() === 'g' && !mod) {
                e.preventDefault();
                this.toggleGrid();
            }
            if (e.key.toLowerCase() === 'm' && !mod) {
                e.preventDefault();
                this.cycleMaterial();
            }
            if (e.key.toLowerCase() === 'h' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.paintBothGround();
                return;
            }
            if (e.key.toLowerCase() === 'b' && !mod) {
                e.preventDefault();
                this.toggleSidebarCollapsed();
                return;
            }
            if (e.key.toLowerCase() === 'u' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.applyGrassyYardPreset();
                return;
            }
            if (e.key.toLowerCase() === 'n' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.placeNextFencePost();
                return;
            }
            if (e.key === ']' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                this.cycleFenceItem();
                return;
            }
            if (e.key.toLowerCase() === 'q' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                const step = -Math.PI / 2;
                if (this.currentAxis === 'x') this.ghostRotation.x += step;
                else if (this.currentAxis === 'y') this.ghostRotation.y += step;
                else if (this.currentAxis === 'z') this.ghostRotation.z += step;
                if (this.ghostObject) this.ghostObject.rotation.copy(this.ghostRotation);
                this.showToast(`Rotated -${this.currentAxis.toUpperCase()}`, 'info');
                return;
            }
            if (e.key.toLowerCase() === 'r' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                const step = Math.PI / 2;
                if (this.currentAxis === 'x') this.ghostRotation.x += step;
                else if (this.currentAxis === 'y') this.ghostRotation.y += step;
                else if (this.currentAxis === 'z') this.ghostRotation.z += step;
                if (this.ghostObject) this.ghostObject.rotation.copy(this.ghostRotation);
                this.showToast(`Rotated ${this.currentAxis.toUpperCase()}`, 'info');
            }
            if (e.key.toLowerCase() === 'x' && !mod) {
                if (this.fpMode) return;
                this.currentAxis = 'x';
                this.showToast('Axis: X', 'info');
            }
            if (e.key.toLowerCase() === 'y' && !mod) {
                if (this.fpMode) return;
                this.currentAxis = 'y';
                this.showToast('Axis: Y', 'info');
            }
            if (e.key.toLowerCase() === 'z' && !mod) {
                if (this.fpMode) return;
                this.currentAxis = 'z';
                this.showToast('Axis: Z', 'info');
            }

            if (/^[1-9]$/.test(e.key) && !mod) {
                e.preventDefault();
                const idx = parseInt(e.key, 10) - 1;
                if (ITEM_TYPES[idx]) this.setActiveItem(ITEM_TYPES[idx]);
                return;
            }
            if (e.key === '0' && !mod) {
                if (this.fpMode) return;
                e.preventDefault();
                if (ITEM_TYPES[9]) this.setActiveItem(ITEM_TYPES[9]);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = this.clock.getDelta();
        if (this.fpMode) {
            this.updateFirstPerson(dt);
        } else {
            this.controls.update();
            this.updateGhost();
        }
        this.updateCompassHud();
        this.updateStats(dt);
        this.updateParticles(dt);
        this.renderFrame();
    }

    updateParticles(dt) {
        if (this.reducedMotion) return;
        // Emit from all 'spray' objects
        const sprays = this.objects.filter(o => o.userData.item === 'spray');
        sprays.forEach(s => {
            if (Math.random() < 0.3) { // Emission rate
                this.spawnWaterParticle(s);
            }
        });

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this._particlePool.push(p);
                this.particles.splice(i, 1);
                continue;
            }
            p.vel.y -= 9.8 * dt; // Gravity
            p.mesh.position.addScaledVector(p.vel, dt);
            p.mesh.scale.setScalar(p.life / p.maxLife);
        }
    }

    getMaterialVfxColor(materialKey) {
        if (!materialKey) return 0x00f2ff;
        const key = materialKey.toLowerCase();
        if (key.includes('wood') || key === 'mahogany') return 0x8b5a2b;
        if (key.includes('concrete') || key === 'asphalt' || key === 'slate' || key === 'granite' || key === 'steel' || key === 'black_iron') return 0x7f8c8d;
        if (key === 'marble') return 0xe0e0e0;
        if (key === 'cobblestone') return 0x95a5a6;
        if (key === 'brick' || key === 'terracotta' || key === 'sandstone') return 0xd35400;
        if (key === 'glass') return 0xffffff;
        if (key.includes('water') || key.includes('blue') || key === 'pex') return 0x00f2ff;
        if (key === 'grass') return 0x27ae60;
        return 0x00f2ff;
    }

    triggerPlacementVfx(position, materialKey) {
        if (this.reducedMotion) return;
        const color = this.getMaterialVfxColor(materialKey);
        const count = 12 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            let p;
            if (this._particlePool.length > 0) {
                p = this._particlePool.pop();
                p.mesh.material.color.setHex(color);
            } else {
                const geom = new THREE.SphereGeometry(0.04, 4, 4);
                const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
                p = { mesh: new THREE.Mesh(geom, mat) };
            }
            
            p.mesh.position.copy(position);
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 1.0 + Math.random() * 2.5;
            p.vel = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 1.0,
                Math.cos(phi) * speed
            );
            
            p.maxLife = 0.4 + Math.random() * 0.4;
            p.life = p.maxLife;
            
            this.scene.add(p.mesh);
            this.particles.push(p);
        }
    }

    spawnWaterParticle(source) {
        let p;
        if (this._particlePool.length > 0) {
            p = this._particlePool.pop();
        } else {
            const geom = new THREE.SphereGeometry(0.03, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.8 });
            p = { mesh: new THREE.Mesh(geom, mat) };
        }
        
        p.mesh.position.copy(source.position);
        
        // Get normal direction from source orientation (it looks at normal)
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(source.quaternion);
        
        p.vel = dir.clone().multiplyScalar(2 + Math.random() * 2);
        p.vel.x += (Math.random() - 0.5) * 0.5;
        p.vel.y += (Math.random() - 0.5) * 0.5;
        p.vel.z += (Math.random() - 0.5) * 0.5;
        
        p.maxLife = 0.5 + Math.random() * 0.5;
        p.life = p.maxLife;
        
        this.scene.add(p.mesh);
        this.particles.push(p);
    }

    // Cloud / Backend methods

    async checkBackend() {
        try {
            await api.health();
            this._backendAvailable = true;
        } catch (e) {
            this._backendAvailable = false;
        }
        this._updateCloudUi();
    }

    _updateCloudUi() {
        const section = document.getElementById('cloud-section');
        if (!section) return;
        section.style.opacity = this._backendAvailable ? '1' : '0.45';
        section.title = this._backendAvailable ? '' : 'Backend server not running - start launch.bat';
    }

    captureScreenshot() {
        try {
            this.renderFrame();
            return this.renderer.domElement.toDataURL('image/jpeg', 0.55);
        } catch (e) {
            return null;
        }
    }

    // Open the Cloud Save modal
    async openCloudSave() {
        if (!this._backendAvailable) {
            this.showToast('Backend not running - start launch.bat first.', 'danger');
            return;
        }
        if (this.objects.length === 0) {
            this.showToast('Nothing to save - place some parts first.', 'info');
            return;
        }
        try {
            this._cloudProjects = await api.listProjects();
            this._renderSaveModal();
            document.getElementById('cloud-save-backdrop').hidden = false;
            document.getElementById('cloud-save-name').focus();
        } catch (e) {
            this.showToast('Could not load projects: ' + e.message, 'danger');
        }
    }

    _renderSaveModal() {
        const sel = document.getElementById('cloud-save-project');
        if (!sel) return;
        sel.innerHTML = this._cloudProjects
            .map(p => `<option value="${p.id}">${p.name} (${p.blueprint_count} saves)</option>`)
            .join('');
    }

    async submitCloudSave() {
        const name = (document.getElementById('cloud-save-name')?.value || '').trim();
        const projectId = document.getElementById('cloud-save-project')?.value;
        if (!name) { this.showToast('Enter a blueprint name.', 'danger'); return; }
        if (!projectId) { this.showToast('Select a project.', 'danger'); return; }

        const payload = this.buildBlueprintPayload();
        const thumbnail = this.captureScreenshot();

        try {
            let result;
            if (this._cloudSaveTargetId) {
                result = await api.updateBlueprint(this._cloudSaveTargetId, {
                    name, data: payload, thumbnail
                });
                this.showToast(`Updated "${result.name}" (v${result.version})`, 'info');
            } else {
                result = await api.saveBlueprint(projectId, name, payload, thumbnail);
                this.showToast(`Saved "${result.name}" to cloud.`, 'info');
            }
            this._cloudSaveTargetId = result.id;
            document.getElementById('cloud-save-backdrop').hidden = true;
        } catch (e) {
            this.showToast('Save failed: ' + e.message, 'danger');
        }
    }

    async createProjectAndSave() {
        const rawName = (document.getElementById('cloud-new-project-name')?.value || '').trim();
        if (!rawName) { this.showToast('Enter a project name.', 'danger'); return; }
        try {
            const proj = await api.createProject(rawName);
            this._cloudProjects.push({ ...proj, blueprint_count: 0 });
            this._renderSaveModal();
            // Auto-select new project
            const sel = document.getElementById('cloud-save-project');
            if (sel) sel.value = String(proj.id);
            document.getElementById('cloud-new-project-name').value = '';
            this.showToast(`Project "${proj.name}" created.`, 'info');
        } catch (e) {
            this.showToast('Failed to create project: ' + e.message, 'danger');
        }
    }

    // Open the Cloud Gallery / Load modal
    async openCloudGallery() {
        if (!this._backendAvailable) {
            this.showToast('Backend not running - start launch.bat first.', 'danger');
            return;
        }
        try {
            this._cloudGallery = await api.gallery();
            this._renderGallery();
            document.getElementById('cloud-gallery-backdrop').hidden = false;
        } catch (e) {
            this.showToast('Could not load gallery: ' + e.message, 'danger');
        }
    }

    _renderGallery() {
        const grid = document.getElementById('cloud-gallery-grid');
        if (!grid) return;
        if (this._cloudGallery.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary);grid-column:1/-1;text-align:center;padding:2rem;">No saved blueprints yet.</p>';
            return;
        }
        grid.innerHTML = this._cloudGallery.map(bp => `
            <div class="gallery-card" data-id="${bp.id}" title="Load: ${bp.name}">
                ${ bp.thumbnail
                    ? `<img class="gallery-thumb" src="${bp.thumbnail}" alt="${bp.name}">`
                    : `<div class="gallery-thumb gallery-thumb--empty">No Preview</div>`
                }
                <div class="gallery-info">
                    <span class="gallery-name">${bp.name}</span>
                    <span class="gallery-meta">${bp.project_name} - ${bp.part_count} parts - v${bp.version}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.loadCloudBlueprint(id);
            });
        });
    }

    async loadCloudBlueprint(id) {
        try {
            const bp = await api.getBlueprint(id);
            const data = typeof bp.data === 'string' ? JSON.parse(bp.data) : bp.data;
            this.importBlueprintJson(JSON.stringify(data));
            this._cloudSaveTargetId = Number(id); // future saves will overwrite this
            document.getElementById('cloud-gallery-backdrop').hidden = true;
            this.showToast(`Loaded "${bp.name}" (v${bp.version}) from local server.`, 'info');
        } catch (e) {
            this.showToast('Load failed: ' + e.message, 'danger');
        }
    }
}

new BuilderApp();
