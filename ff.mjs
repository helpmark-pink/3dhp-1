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
let backButton; // 追加

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






// 戻るボタンの作成関数
function createBackButton(font) {
    const buttonGroup = new THREE.Group();

    // ボタン背景のサイズを小さく
    const bgGeometry = createRoundedRectangle(1.2, 0.4, 0.1);
    const bgMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFB6C1,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    backButtonBg = new THREE.Mesh(bgGeometry, bgMaterial);

    // ボタンテキストも小さく
    const textGeometry = new TextGeometry('< Back', {
        font: font,
        size: 0.2,
        height: 0.03,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3
    });

    const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.2
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    textMesh.position.set(-textWidth / 2, -0.1, 0);

    buttonGroup.add(backButtonBg);
    buttonGroup.add(textMesh);

    // ボタンの位置を設定
    buttonGroup.position.set(0, 4.0, 0); // 必要に応じて調整

    return buttonGroup;
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
                        const originalColor = node.material.color; // 元の色を保持
                        node.material = new THREE.MeshPhongMaterial({
                            color: originalColor, // 元の色を使用
                            shininess: 100, // 艶を強調
                            specular: 0xFFFFFF, // スペキュラ反射の色
                            emissive: 0x333333, // 自発光色を設定して明るく
                            emissiveIntensity: 1.0 // 自発光の強さを設定
                        });
                    }
                });

                teddybearModel.scale.set(0.5, 0.5, 0.5); // スケールを調整
                teddybearModel.position.set(0, 1.3, 0.3); // 位置を調整

                // メインシーンでのみ表示
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
            size: 0.4,          // サイズを小さく
            height: 0.05,       // 厚みを薄く
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005, // ベベルの厚みを薄く
            bevelSize: 0.005,      // ベベルのサイズを小さく
            bevelOffset: 0,
            bevelSegments: 3
        });

        const portfolioGeometry = new TextGeometry('Portfolio', {
            font: font,
            size: 0.4,          // サイズを小さく
            height: 0.05,       // 厚みを薄く
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005, // ベベルの厚みを薄く
            bevelSize: 0.005,      // ベベルのサイズを小さく
            bevelOffset: 0,
            bevelSegments: 3
        });

        const textMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF69B4,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.8,  // 発光を少し抑える
            shininess: 0,
            transparent: true,
            opacity: 0.9           // 透明度を少し上げる
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

        const enterGeometry = new TextGeometry('Enter >', {
            font: font,
            size: 0.2,
            height: 0.03,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelOffset: 0,
            bevelSegments: 3
        });

        const buttonBgGeometry = createRoundedRectangle(1.2, 0.4, 0.1);
        const buttonBgMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFB6C1,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        buttonBg = new THREE.Mesh(buttonBgGeometry, buttonBgMaterial);

        const enterMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.2
        });

        const enterMesh = new THREE.Mesh(enterGeometry, enterMaterial);
        enterGeometry.computeBoundingBox();
        const enterWidth = enterGeometry.boundingBox.max.x - enterGeometry.boundingBox.min.x;
        enterMesh.position.set(-enterWidth / 2, -0.1, 0);

        const buttonGroup = new THREE.Group();
        buttonGroup.add(buttonBg);
        buttonGroup.add(enterMesh);
        buttonGroup.position.set(0, 1.3, 0);

        textGroup = new THREE.Group();
        textGroup.add(helpMarkMesh);
        textGroup.add(portfolioMesh);
        textGroup.add(buttonGroup);

        scene.add(textGroup);
        yukariText = textGroup;

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(buttonBg);
            buttonHovered = intersects.length > 0;

            raycaster.setFromCamera(mouse, camera);
    const intersectsBack = raycaster.intersectObject(backButton.children[0]);
    const intersectsNext = raycaster.intersectObject(nextButton.children[0]);



            if (buttonHovered) {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'default';
            }
        });

        window.addEventListener('click', (event) => {
            if (buttonHovered && !isTransitioning && currentScene === 'main') {
                isTransitioning = true;
                switchToPortfolioScene();
            }
        });
    });
}

// ポートフォリオシーンの作成関数
function createPortfolioScene() {
    portfolioGroup = new THREE.Group();

    const loader = new FontLoader();
    loader.load('fonts/fff.json', function (font) {
        // タイトルの作成
        const titleGeometry = new TextGeometry('My Portfolio', {
            font: font,
            size: 0.4,          // サイズを小さく
            height: 0.05,       // 厚みを薄く
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005, // ベベルを薄く
            bevelSize: 0.005,      // ベベルを小さく
            bevelOffset: 0,
            bevelSegments: 3
        });

        const titleMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF69B4,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });

        const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
        titleGeometry.computeBoundingBox();
        const titleWidth = titleGeometry.boundingBox.max.x - titleGeometry.boundingBox.min.x;
        titleMesh.position.set(-titleWidth / 2, 4.7, 0);
        portfolioGroup.add(titleMesh);

        // 3Dモデルの読み込み
        const gltfLoader = new GLTFLoader();

        // ひよこモデルを左側に配置
        gltfLoader.load(
            'models/hiyoko.glb',
            function (gltf) {
                const hiyokoModel = gltf.scene;
                hiyokoModel.scale.set(0.8, 0.8, 0.8);
                hiyokoModel.rotation.y = 0.3;

                const hiyokoGroup = new THREE.Group();
                hiyokoGroup.add(hiyokoModel);
                hiyokoGroup.position.set(-2.5, 4.5, 0); // Y位置を4.5に上げる

                portfolioGroup.add(hiyokoGroup);
                console.log('Hiyoko loaded');
            },
            undefined,
            function (error) {
                console.error('Error loading hiyoko:', error);
            }
        );

        // クリオネモデルを右側に配置
        gltfLoader.load(
            'models/ccc.glb',
            function (gltf) {
                const clioneModel = gltf.scene;
                clioneModel.scale.set(0.7, 0.7, 0.7);  // スケールを0.5に変更
                clioneModel.rotation.y = 0.3;

                const clioneGroup = new THREE.Group();
                clioneGroup.add(clioneModel);
                clioneGroup.position.set(2.5, 4.5, 0); // X位置を3.0に、Y位置を4.5に上げる

                portfolioGroup.add(clioneGroup);
                console.log('Clione loaded');
            },
            undefined,
            function (error) {
                console.error('Error loading clione:', error);
            }
        );

        // ボタンの作成
        backButton = createBackButton(font); // 修正

        // ボタンの位置を設定
        backButton.position.set(0, 4, 0); // 必要に応じて調整

        portfolioGroup.add(backButton);

        // イベントリスナー
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersectsBack = raycaster.intersectObject(backButton.children[0]);

            if (intersectsBack.length > 0) {
                backButton.children[0].material.opacity = 0.9;
                backButton.scale.set(1.1, 1.1, 1);
                document.body.style.cursor = 'pointer';
            } else {
                backButton.children[0].material.opacity = 0.7;
                backButton.scale.set(1, 1, 1);
                document.body.style.cursor = 'default';
            }

        });

         // ここに戻るボタンのクリックイベントリスナーを追加
    window.addEventListener('click', (event) => {
        raycaster.setFromCamera(mouse, camera);
        const intersectsBack = raycaster.intersectObject(backButton.children[0]);

        if (intersectsBack.length > 0 && !isTransitioning && currentScene === 'portfolio') {
            isTransitioning = true;
            switchToMainScene(); // メインシーンへの遷移を呼び出し
        }
    });



        portfolioGroup.visible = false;
        scene.add(portfolioGroup);
    });
}

// メインシーン
function switchToMainScene() {
    const duration = 800;
    const startTime = Date.now();

    function transition() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        if (portfolioGroup) {
            portfolioGroup.position.y = easeOut * 12;
        }

        if (progress < 1) {
            requestAnimationFrame(transition);
        } else {
            portfolioGroup.visible = false;
            portfolioGroup.position.y = 0;

            if (textGroup) {
                textGroup.visible = true;
                textGroup.position.y = -10;
            }
            clouds.forEach(cloud => {
                cloud.visible = true;
                cloud.position.y = Math.random() * 3 + 3;
            });

            // teddybearModelをメインシーンで表示
            if (teddybearModel) {
                teddybearModel.visible = true; // ここに追加
            }

            // メインシーンではリンクを非表示
            const linkContainer = document.getElementById("link-container");
            if (linkContainer) {
                linkContainer.style.display = "none";
            }

            animateMainSceneEntry();
            currentScene = 'main';
            isTransitioning = false;
        }
    }

    transition();
}

function switchToPortfolioScene() {
    if (textGroup) textGroup.visible = false;
    clouds.forEach(cloud => cloud.visible = false);

    portfolioGroup.visible = true;
    portfolioGroup.position.y = -10;

    // teddybearModelをポートフォリオシーンで非表示
    if (teddybearModel) {
        teddybearModel.visible = false; // ここに追加
    }

    // ポートフォリオシーンではリンクを表示
    const linkContainer = document.getElementById("link-container");
    if (linkContainer) {
        linkContainer.style.display = "block";
    }

     // メインシーンに戻ったときにボタンアイコンを表示
    const buttonIcon = document.getElementById('button-icon');
    buttonIcon.style.display = 'block';

    animatePortfolioEntry();
    currentScene = 'portfolio';
    isTransitioning = false;
}

function animatePortfolioEntry() {
    const duration = 600;
    const startTime = Date.now();

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        portfolioGroup.position.y = -10 + easeOut * 10;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

function animateMainSceneEntry() {
    const duration = 1000;
    const startTime = Date.now();

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        if (textGroup) textGroup.position.y = -10 + easeOut * 12;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
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

    } else if (currentScene === 'portfolio') {
        if (portfolioGroup) {
            const time = Date.now() * 0.001;

            // タイトルのアニメーション
            portfolioGroup.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.geometry instanceof TextGeometry) {
                    // 微かな浮遊感
                    child.position.y = 4.7 + Math.sin(time * 2) * 0.05;

                    // 発光の強さを変化
                    if (child.material instanceof THREE.MeshPhongMaterial) {
                        child.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.2;
                    }
                }
            });

            // 3Dモデルのアニメーション
            portfolioGroup.children.forEach(child => {
                if (child instanceof THREE.Group && child !== portfolioGroup.children[1]) {
                    if (child.position.x < 0) { // 左側（ひよこ）
                        // 位置を固定
                        child.position.x = -2.5;

                        // 上下のジャンプ
                        const jumpHeight = Math.abs(Math.sin(time * 3)) * 0.2;
                        child.position.y = 4.5 + jumpHeight;

                        // 着地時の微かな縮小と伸び
                        if (child.children[0]) {
                            const scale = 0.8 - (jumpHeight * 0.15);
                            child.children[0].scale.set(0.8, scale, 0.8);
                        }
                    } else { // 右側（クリオネ）
                        // 位置を固定
                        child.position.x = 2.6;

                        // ひよこと同じジャンプ動作
                        const jumpHeight = Math.abs(Math.sin(time * 3)) * 0.2;
                        child.position.y = 5 + jumpHeight;

                        // 着地時の微かな縮小と伸び
                        if (child.children[0]) {
                            const scale = 0.6 - (jumpHeight * 0.15);
                            child.children[0].scale.set(0.6, scale, 0.6);
                        }
                    }
                }
            });


          // 戻るボタンの縦ジャンプアニメーション
          if (backButton) {
            backButton.position.y = 3.8 + Math.abs(Math.sin(time * 3)) * 0.2; // 縦にジャンプ
        }


        }
    }

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
    createPortfolioScene();

    animate();

     // ボタンアイコンの表示を制御
     const buttonIcon = document.getElementById('button-icon');
     buttonIcon.style.display = currentScene === 'main' ? 'block' : 'none';

      // ボタンのクリックイベントを追加
    const navigateButton = document.getElementById('button-icon');
    navigateButton.addEventListener('click', () => {
        window.location.href = 'set.html'; // set.htmlへの遷移
    });

    // フッターを追加するコードをここに挿入
    document.addEventListener('DOMContentLoaded', () => {
        const footer = document.createElement('footer');
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.width = '100%';
        footer.style.textAlign = 'center';
        footer.style.backgroundColor = '#ffccff';
        footer.style.padding = '10px';
        footer.style.fontFamily = "'Comic Sans MS', cursive, sans-serif";
        footer.style.color = '#333';
        footer.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
        footer.innerHTML = '&copy; 2025 Your Name. All rights reserved.';
        document.body.appendChild(footer);
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// DOMContentLoadedイベントをリッスンして、HTMLが完全に読み込まれた後に実行
document.addEventListener("DOMContentLoaded", function () {
    // idが"link-container"の要素を取得
    const linkContainer = document.getElementById("link-container");

    // linkContainerが存在し、かつ現在のシーンがポートフォリオシーンである場合
    if (linkContainer && currentScene === 'portfolio') {
        // linkContainerの表示スタイルを"block"に設定して表示
        linkContainer.style.display = "block";
    }
});

init();
