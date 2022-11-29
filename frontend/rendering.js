import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// three.js globals.
var camera, scene, renderer;

// Create the Draco loader.
var dracoLoader = new DRACOLoader();

// Specify path to a folder containing WASM/JS decoding libraries.
// It is recommended to always pull your Draco JavaScript and WASM decoders
// from the below URL. Users will benefit from having the Draco decoder in
// cache as more sites start using the static URL.
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.4.1/"
);

dracoLoader.preload();

const loader = new GLTFLoader();

// dracoLoader.setDecoderPath("./test/result_test/");
loader.setDRACOLoader(dracoLoader);

function initThreejs() {
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    15
  );
  camera.position.set(3, 0.25, 3);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x443333);
  scene.fog = new THREE.Fog(0x443333, 1, 4);

  // Ground
  var plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(8, 8),
    new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.03;
  plane.receiveShadow = true;
  scene.add(plane);

  // Lights
  var light = new THREE.HemisphereLight(0x443333, 0x111122);
  scene.add(light);

  var light = new THREE.SpotLight();
  light.angle = Math.PI / 16;
  light.penumbra = 0.5;
  light.castShadow = true;
  light.position.set(-1, 1, 1);
  scene.add(light);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  var timer = Date.now() * 0.0003;

  camera.position.x = Math.sin(timer) * 0.5;
  camera.position.z = Math.cos(timer) * 0.5;
  camera.lookAt(new THREE.Vector3(0, 0.1, 0));

  renderer.render(scene, camera);
}

function loadDracoMesh(dracoFile) {
  dracoLoader.load(dracoFile, function (geometry) {
    geometry.computeVertexNormals();

    var material = new THREE.MeshStandardMaterial({
      vertexColors: THREE.VertexColors,
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}
window.onload = function () {
  initThreejs();
  animate();

  // loader.load(
  //   "./test/char_old-test6.gltf",
  //   function (gltf) {
  //     scene.add(gltf.scene);
  //     console.log();
  //     gltf.animations; // Array<THREE.AnimationClip>
  //     gltf.scene; // THREE.Group
  //     gltf.scenes; // Array<THREE.Group>
  //     gltf.cameras; // Array<THREE.Camera>
  //     gltf.asset; // Object
  //   },
  //   // called while loading is progressing
  //   function (xhr) {
  //     console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  //   },
  //   // called when loading has errors
  //   function (error) {
  //     console.log("An error happened");
  //   }
  // );
  loadDracoMesh("test/캐릭터.drc");
};
