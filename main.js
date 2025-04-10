// Import文
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// グローバル変数の定義
let scene, camera, renderer;
let clouds = [];
let yukariText;
let scrollY = 0;
let isTransitioning = false;
let targetScene = null;
let targetCamera = null;
let raycaster;
let mouse;
let buttonBg;
let textGroup;
let currentScene = 'main';
let portfolioGroup;
let backButtonBg;
let buttonHovered = false;
let teddybearModel;
let backButton;
let kkmaGroup; // kkmaグループを追加

// 丸みを帯びた長方形を作成する関数
function createRoundedRectangle(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return new THREE.ShapeGeometry(shape);
}

// 雲の作成関数
function createClouds() {
    for (let i = 0; i < 10; i++) {
        const cloudGroup = new THREE.Group();

        function createCloudPart(x, y, z, scale) {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.95
            });
            const part = new THREE.Mesh(geometry, material);
            part.position.set(x, y, z);
            part.scale.set(scale, scale * 0.7, scale);
            return part;
        }

        const mainCloud = createCloudPart(0, 0, 0, 1.2);
        cloudGroup.add(mainCloud);

        const numParts = Math.floor(Math.random() * 5) + 4;
        for (let j = 0; j < numParts; j++) {
            const offsetX = (Math.random() - 0.5) * 2.0;
            const offsetY = (Math.random() - 0.5) * 0.8;
            const offsetZ = (Math.random() - 0.5) * 2.0;
            const scale = Math.random() * 0.7 + 0.6;
            const part = createCloudPart(offsetX, offsetY, offsetZ, scale);
            cloudGroup.add(part);
        }

        cloudGroup.position.set(
            Math.random() * 20 - 10,
            Math.random() * 3 + 3,
            Math.random() * 10 - 15
        );

        const groupScale = Math.random() * 0.5 + 1.0;
        cloudGroup.scale.set(groupScale, groupScale * 0.8, groupScale);
        cloudGroup.speed = Math.random() * 0.01 + 0.005;

        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

// メインテキストの作成関数
function createYukariText() {
    const loader = new FontLoader();
    loader.load('fonts/fff.json', function (font) {
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // teddybearモデルの読み込み
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            'models/teddybear.glb',
            function (gltf) {
                teddybearModel = gltf.scene;

                // teddybearモデルのマテリアルを設定
                teddybearModel.traverse((node) => {
                    if (node.isMesh) {
                        const originalColor = node.material.color;
                        node.material = new THREE.MeshPhongMaterial({
                            color: originalColor,
                            shininess: 100,
                            specular: 0xFFFFFF,
                            emissive: 0x333333,
                            emissiveIntensity: 1.0
                        });
                    }
                });

                teddybearModel.scale.set(0.5, 0.5, 0.5);
                teddybearModel.position.set(0, 1.3, 0.3);

                teddybearModel.visible = currentScene === 'main';

                scene.add(teddybearModel);
                console.log('Teddybear loaded');
            },
            undefined,
            function (error) {
                console.error('Error loading teddybear:', error);
            }
        );

        const helpMarkGeometry = new TextGeometry('Helpmark', {
            font: font,
            size: 0.4,
            height: 0.05,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.005,
            bevelOffset: 0,
            bevelSegments: 3
        });

        const portfolioGeometry = new TextGeometry('Portfolio', {
            font: font,
            size: 0.4,
            height: 0.05,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.005,
            bevelOffset: 0,
            bevelSegments: 3
        });

        const textMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF69B4,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.8,
            shininess: 0,
            transparent: true,
            opacity: 0.9
        });
        const helpMarkMesh = new THREE.Mesh(helpMarkGeometry, textMaterial);
        const portfolioMesh = new THREE.Mesh(portfolioGeometry, textMaterial);

        helpMarkGeometry.computeBoundingBox();
        portfolioGeometry.computeBoundingBox();
        const helpMarkWidth = helpMarkGeometry.boundingBox.max.x - helpMarkGeometry.boundingBox.min.x;
        const portfolioWidth = portfolioGeometry.boundingBox.max.x - portfolioGeometry.boundingBox.min.x;

        helpMarkMesh.position.set(-helpMarkWidth / 2, 2.3, 0);
        helpMarkMesh.rotation.set(0, 0, 0);

        portfolioMesh.position.set(-portfolioWidth / 2, 1.8, 0);
        portfolioMesh.rotation.set(0, 0, 0);

        textGroup = new THREE.Group();
        textGroup.add(helpMarkMesh);
        textGroup.add(portfolioMesh);

        scene.add(textGroup);
        yukariText = textGroup;
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (currentScene === 'main' && !isTransitioning) {
        // メインシーンのアニメーション
        clouds.forEach(cloudGroup => {
            cloudGroup.position.x += cloudGroup.speed;
            if (cloudGroup.position.x > 15) {
                cloudGroup.position.x = -15;
                cloudGroup.position.z = Math.random() * 10 - 15;
                cloudGroup.position.y = Math.random() * 3 + 3;
                cloudGroup.rotation.y = Math.random() * Math.PI;
            }
        });

        if (yukariText) {
            yukariText.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.1;
        }

        // teddybearモデルのアニメーション
        if (teddybearModel) {
            const time = Date.now() * 0.001;
            teddybearModel.rotation.y = Math.sin(time) * 0.5; // 左右に揺れる
            teddybearModel.position.y = 1.3 + Math.sin(time * 2) * 0.2; // 上下に揺れる
        }

    }
    // } else if (currentScene === 'portfolio') {
    //     if (portfolioGroup) {
    //         const time = Date.now() * 0.001;

    //         // タイトルのアニメーション
    //         portfolioGroup.children.forEach(child => {
    //             if (child instanceof THREE.Mesh && child.geometry instanceof TextGeometry) {
    //                 // 微かな浮遊感
    //                 child.position.y = 4.7 + Math.sin(time * 2) * 0.05;

    //                 // 発光の強さを変化
    //                 if (child.material instanceof THREE.MeshPhongMaterial) {
    //                     child.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.2;
    //                 }
    //             }
    //         });

    //         // 3Dモデルのアニメーション
    //         portfolioGroup.children.forEach(child => {
    //             // kkmaモデルはアニメーションから除外
    //             if (child instanceof THREE.Group && !child.userData.isKkma && child !== portfolioGroup.children[1]) {
    //                 if (child.position.x < 0) { // 左側（ひよこ）
    //                     // 位置を固定
    //                     child.position.x = -1;

    //                     // 上下のジャンプ
    //                     const jumpHeight = Math.abs(Math.sin(time * 5)) * 0.2;
    //                     child.position.x += Math.sin(time * 2) * 0.25; // 左右に揺れる
    //                     child.position.y = 3.7 + jumpHeight;

    //                     // 着地時の微かな縮小と伸び
    //                     if (child.children[0]) {
    //                         const scale = 0.8 - (jumpHeight * 0.15);
    //                         child.children[0].scale.set(0.3, scale, 0.3);
    //                     }
    //                 } else { // 右側（クリオネ）
    //                     // 位置を固定
    //                     child.position.x = 1;

    //                     // ひよこと同じジャンプ動作
    //                     const jumpHeight = Math.abs(Math.sin(time * 5)) * 0.4;
    //                     child.position.x += Math.sin(time * 2) * 0.05; // 左右に揺れる
    //                     child.position.y = 4 + jumpHeight;

    //                     // 着地時の微かな縮小と伸び
    //                     if (child.children[0]) {
    //                         const scale = 0.4 - (jumpHeight * 0.15);
    //                         child.children[0].scale.set(0.3, scale, 0.3);
    //                     }
    //                 }
    //             }
    //         });
    //     }
    // }

    renderer.render(scene, camera);
}

// 初期化とイベントリスナー
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xC9F1FF);

    // 環境光の設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // 強度を0.5に調整
    scene.add(ambientLight);

    // 方向光の設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 強度を1.0に調整
    directionalLight.position.set(5, 10, 5); // 位置を調整
    scene.add(directionalLight);

    createClouds();
    createYukariText();

    animate();

    // ボタンアイコンの表示を制御
    const buttonIcon = document.getElementById('button-icon');
    if (buttonIcon) {
        buttonIcon.style.display = currentScene === 'main' ? 'block' : 'none';
    }

    // ボタンのクリックイベントを追加
    const navigateButton = document.getElementById('button-icon');
    if (navigateButton) {
        navigateButton.addEventListener('click', () => {
            window.location.href = 'set.html'; // set.htmlへの遷移
        });
    }

    // ボタンアイコンの表示を制御
    const kozinbuttonIcon2 = document.getElementById('button-icon2');
    if (kozinbuttonIcon2) {
        kozinbuttonIcon2.style.display = currentScene === 'main' ? 'block' : 'none';

        // ボタンのクリックイベントを追加
        kozinbuttonIcon2.addEventListener('click', () => {
            window.location.href = 'ket.html'; // ket.htmlへの遷移
        });
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.querySelector('.hamburger-menu').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('.nav-menu').classList.toggle('active');
});

init();
