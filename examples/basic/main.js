let renderer, scene, camera, controls, csm, gui;

init();
animate();

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#454e61');
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000 );

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild( renderer.domElement );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxPolarAngle = Math.PI / 2;
	camera.position.set(20, 60, 0);
	controls.target = new THREE.Vector3(-100, 10, 0);
	controls.update();
	
	let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);
	
	let params = {
		far: 1000,
		mode: 'practical',
		lightX: -1,
		lightY: -1,
		lightZ: -1,
		margin: 100,
		lightFar: 2000,
		lightNear: 1,
		helper: function () {
			let helper = csm.helper(camera.matrix);
			scene.add(helper);
		}
	};
	
	csm = new THREE.CSM({
		fov: camera.fov,
		near: camera.near,
		far: params.far,
		aspect: camera.aspect,
		cascades: 4,
		mode: params.mode,
		parent: scene,
		shadowMapSize: 1024,
		lightDirection: new THREE.Vector3(params.lightX, params.lightY, params.lightZ).normalize(),
		camera: camera
	});

	let floorMaterial = new THREE.MeshPhongMaterial({color: '#252a34'});
	csm.setupMaterial(floorMaterial);
	
	let floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(10000, 10000), floorMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.castShadow = true;
	floor.receiveShadow = true;
	scene.add(floor);
	
	let material1 = new THREE.MeshPhongMaterial({color: '#08d9d6'});
	csm.setupMaterial(material1);
	
	let material2 = new THREE.MeshPhongMaterial({color: '#ff2e63'});
	csm.setupMaterial(material2);
	
	let geometry = new THREE.BoxBufferGeometry(10, 10, 10);
	
	for(let i = 0; i < 40; i++) {
		let cube1 = new THREE.Mesh(geometry, i % 2 === 0 ? material1 : material2);
		cube1.castShadow = true;
		cube1.receiveShadow = true;
		scene.add(cube1);
		cube1.position.set(-i * 25, 20, 30);
		cube1.scale.y = Math.random() * 2 + 6;
		
		let cube2 = new THREE.Mesh(geometry, i % 2 === 0 ? material2 : material1);
		cube2.castShadow = true;
		cube2.receiveShadow = true;
		scene.add(cube2);
		cube2.position.set(-i * 25, 20, -30);
		cube2.scale.y = Math.random() * 2 + 6;
	}
	
	gui = new dat.gui.GUI();
	
	gui.add(params, 'far', 1, 5000).step(1).name('shadow far').onChange(function(value) {
		csm.far = value;
		csm.updateFrustums();
	});
	
	gui.add(params, 'mode', ['uniform', 'logarithmic', 'practical']).name('frustum split mode').onChange(function(value) {
		csm.mode = value;
		csm.updateFrustums();
	});
	
	gui.add(params, 'lightX', -1, 1).name('light direction x').onChange(function(value) {
		csm.lightDirection.x = value;
	});
	
	gui.add(params, 'lightY', -1, 1).name('light direction y').onChange(function(value) {
		csm.lightDirection.y = value;
	});
	
	gui.add(params, 'lightZ', -1, 1).name('light direction z').onChange(function(value) {
		csm.lightDirection.z = value;
	});
	
	gui.add(params, 'margin', 0, 200).name('light margin').onChange(function(value) {
		csm.lightMargin = value;
	});
	
	gui.add(params, 'lightNear', 1, 10000).name('light near').onChange(function(value) {
		for(let i = 0; i < csm.lights.length; i++) {
			csm.lights[i].shadow.camera.near = value;
			csm.lights[i].shadow.camera.updateProjectionMatrix();
		}
	});
	
	gui.add(params, 'lightFar', 1, 10000).name('light far').onChange(function(value) {
		for(let i = 0; i < csm.lights.length; i++) {
			csm.lights[i].shadow.camera.far = value;
			csm.lights[i].shadow.camera.updateProjectionMatrix();
		}
	});

	gui.add(params, 'helper').name('add frustum helper');
	
	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		
		csm.setAspect(camera.aspect);
		
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

function animate() {
	requestAnimationFrame(animate);

	csm.update(camera.matrix);
	controls.update();

	renderer.render(scene, camera);
}