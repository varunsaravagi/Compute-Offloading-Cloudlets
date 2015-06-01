

var world, mass, body, shape, timeStep=1/60, sphereBody, sphereShape, groundShape, groundBody,
         camera, scene, renderer, geometry, material, mesh, planeGeometry, planeMaterial, planeMesh;


function initThree() {
  	scene = new THREE.Scene();
  	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100 );
  	camera.position.z = 5;
  	scene.add( camera );

  	geometry = new THREE.SphereGeometry(1);
  	material = new THREE.MeshBasicMaterial( { color: 0xff0000} );
  	mesh = new THREE.Mesh( geometry, material );
  	scene.add( mesh );
  	
  	planeGeometry = new THREE.PlaneGeometry(400,3);
  	planeMaterial = new THREE.MeshBasicMaterial({color:0xff00ff});
  	planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  	scene.add(planeMesh);

  	renderer = new THREE.CanvasRenderer();
  	renderer.setSize( window.innerWidth, window.innerHeight );
  	document.body.appendChild( renderer.domElement );
}

function initCannon(){

	world = new CANNON.World();
	world.gravity.set(0,0,-9.82);
	world.broadphase = new CANNON.NaiveBroadphase();

	mass = 5, radius = 1;
	sphereShape = new CANNON.Sphere(radius);
	sphereBody = new CANNON.Body(mass, sphereShape);
	sphereBody.position.set(0,0,0);
	world.add(sphereBody);

	groundShape = new CANNON.Plane();
	groundBody = new CANNON.Body(0, groundShape);
	world.add(groundBody);

}
function animate() {
	//for(var i =0; i<60;++i){
		requestAnimationFrame( animate );
		updatePhysics();
		render();
	//}
    
}

function updatePhysics() {
    // Step the physics world
    //for(var i=0;i<60;++i){
    	world.step(timeStep);	       
    // Copy coordinates from Cannon.js to Three.js
    //console.log(mesh);
    	sphereBody.position.copy(mesh.position);
    	sphereBody.quaternion.copy(mesh.quaternion);
    	//console.log(planeMesh);
    	groundBody.position.copy(planeMesh.position);
    	groundBody.quaternion.copy(planeMesh.quaternion);
    	
    	// mesh.position.copy(sphereBody.position);
    	// mesh.quaternion.copy(sphereBody.quaternion);
    	// //console.log(planeMesh);
    	// planeMesh.position.copy(groundBody.position);
    	// planeMesh.quaternion.copy(groundBody.quaternion);
	//}
 }
 
 function render() {
    renderer.render( scene, camera );
 }
// for(var i=0;i<60;++i){
// 	world.step(timeStep);
// 	console.log(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
// }