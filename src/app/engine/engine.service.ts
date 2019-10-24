import { ElementRef, Injectable, NgZone } from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import { Vector2, Vector3, PlaneRotationGizmo, MeshBuilder } from 'babylonjs';
import { Planet } from './model/planet';
import { debugOutputAstAsTypeScript, BindingType } from '@angular/compiler';
import { threadId } from 'worker_threads';

@Injectable({
  providedIn: 'root'
})
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private camera: BABYLON.FreeCamera;
  private followCamera: BABYLON.FollowCamera;
  private scene: BABYLON.Scene;
  private light: BABYLON.Light;

  private spaceBox: BABYLON.Mesh;
  private bodies: Planet[];

  private meshBodies: BABYLON.Mesh[] = [];

  public constructor(private ngZone: NgZone) {
    
  }

  createScene(canvas: ElementRef<HTMLCanvasElement>): void {  
    
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    // Then, load the Babylon 3D engine:
    this.engine = new BABYLON.Engine(this.canvas,  true);

    // create a basic BJS Scene object
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new BABYLON.HemisphericLight('sunlight', new BABYLON.Vector3(0, 1, 0), this.scene);    
    
    this.generateSpaceBox();
    this.generatePlanets();

    this.scene.registerBeforeRender(() => {      
      for(let body of this.bodies)
      {
        this.meshBodies[body.id].rotate(new BABYLON.Vector3(Math.sin(body.axis * Math.PI/180), Math.cos(body.axis * Math.PI/180), 0), -0.01, BABYLON.Space.WORLD)
        this.meshBodies[body.id].position = new BABYLON.Vector3((body.distance/10) * Math.sin(body.revSpeed), 0, (body.distance/10) * Math.cos(body.revSpeed));
      }

    });
    window.addEventListener('click', () => {
      var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);      
      this.clickedObject(pickResult);
    })
    
    this.showWorldAxis(50000);
  }

  clickedObject(pickingInfo: BABYLON.PickingInfo): void {
    if (pickingInfo.hit)
    {
      this.camera.setTarget(pickingInfo.pickedPoint);      
    }
  }
  
  animate(): void {
    
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('DOMContentLoaded', () => {
        this.engine.runRenderLoop(() => {
          this.scene.render();    
        });
      });

      window.addEventListener('resize', () => {
        this.engine.resize();
      });

    });
  }

  generateSpaceBox(): void {
    this.spaceBox = MeshBuilder.CreateBox("spaceBox", {size: 50000}, this.scene);
    var spaceBoxMaterial = new BABYLON.StandardMaterial("spaceMaterial", this.scene);
    spaceBoxMaterial.backFaceCulling = false;
    spaceBoxMaterial.reflectionTexture = new BABYLON.CubeTexture('assets/textures/spacebox/', this.scene);
    spaceBoxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    spaceBoxMaterial.disableLighting = true;
    this.spaceBox.infiniteDistance = true;
    this.spaceBox.material = spaceBoxMaterial;   
    this.spaceBox.renderingGroupId = 0; 
    
  }

  generatePlanets(): void {
    this.bodies = [
      {id: 0, name: 'sol', diameter: 100, distance: 0, axis: 7.25, revSpeed: 0},
      //{id: 1, name: 'mercury', diameter: .351, distance: 4162, axis: 0},
      {id: 1, name: 'mercury', diameter: 35, distance: 4162, axis: 0, revSpeed: -15},  
      //{id: 2, name: 'venus', diameter: .891, distance: 7754, axis: 177.3},
      {id: 2, name: 'venus', diameter: 89, distance: 7754, axis: 177.3, revSpeed: 90},
      //{id: 3, name: 'earth', diameter: .916, distance: 10763, axis: 23.5}
      {id: 3, name: 'earth', diameter: 91, distance: 10763, axis: 23.5, revSpeed: 15}
    ];
    
    for (let body of this.bodies) {      
      this.meshBodies[body.id] = MeshBuilder.CreateSphere(body.name, { diameter: body.diameter });
      const material = new BABYLON.StandardMaterial(body.name + '_mat', this.scene);
      material.diffuseTexture = new BABYLON.Texture('assets/textures/' + body.name + '.jpg', this.scene);
      this.meshBodies[body.id].material = material;
      this.meshBodies[body.id].position.x = body.distance;          
      if (body.id > 0) {
        this.meshBodies[body.id].parent = this.meshBodies[0];
      }       
      this.meshBodies[body.id].renderingGroupId = 1;
    }
    this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(5, 10, -20), this.scene);
    this.moveCameraToPlanet(0);
    this.camera.maxZ = 50000;
    this.camera.attachControl(this.canvas, false);
  }

  moveCameraToPlanet(id: number) {    
    this.camera.position.y = this.meshBodies[id].position.y + (this.bodies[id].diameter * 10);
    this.camera.position.x = this.meshBodies[id].position.x - (this.bodies[id].diameter * 20);
    this.camera.position.z = this.meshBodies[id].position.z - (this.bodies[id].diameter * 20);
    this.camera.setTarget(this.meshBodies[id].position);    
  }
 
  followPlanet(id: number) {
    this.followCamera = new BABYLON.FollowCamera("followCamera", new BABYLON.Vector3(0, 0, 0), this.scene);
    this.followCamera.radius = this.bodies[id].diameter * 2;
    this.followCamera.heightOffset = this.bodies[id].diameter;
    this.followCamera.rotationOffset = 0;
    this.followCamera.cameraAcceleration = 0.05;
    this.followCamera.maxCameraSpeed = 50000;    
    this.followCamera.lockedTarget = this.meshBodies[id];
    this.camera.detachControl(this.canvas);    
    this.scene.activeCamera = this.followCamera;    
    this.followCamera.attachControl(this.canvas, true);   
    this.generateSpaceBox();
  }

  returnFreeCamera(): void {
    this.followCamera.detachControl(this.canvas);
    this.scene.activeCamera =this.camera;
    this.camera.attachControl(this.canvas);
    //this.camera.setTarget(this.meshBodies[0].position);
  }

  /**
   * creates the world axes
   *
   * Source: https://doc.babylonjs.com/snippets/world_axes
   *
   * @param size number
   */
  showWorldAxis (size: number) {

    const makeTextPlane = (text: string, color: string, textSize: number) => {
      const dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', 50, this.scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color , 'transparent', true);
      const plane = BABYLON.Mesh.CreatePlane('TextPlane', textSize, this.scene, true);
      const material = new BABYLON.StandardMaterial('TextPlaneMaterial', this.scene);
      material.backFaceCulling = false;
      material.specularColor = new BABYLON.Color3(0, 0, 0);
      material.diffuseTexture = dynamicTexture;
      plane.material = material;

      return plane;
    };

    const axisX = BABYLON.Mesh.CreateLines(
      'axisX',
      [
        BABYLON.Vector3.Zero(),
        new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
        new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
      ],
      this.scene
    );

    axisX.color = new BABYLON.Color3(1, 0, 0);
    const xChar = makeTextPlane('X', 'red', size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);

    const axisY = BABYLON.Mesh.CreateLines(
      'axisY',
      [
        BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0),
        new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
      ],
      this.scene
    );

    axisY.color = new BABYLON.Color3(0, 1, 0);
    const yChar = makeTextPlane('Y', 'green', size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);

    const axisZ = BABYLON.Mesh.CreateLines(
      'axisZ',
      [
        BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
        new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
      ],
      this.scene
    );

    axisZ.color = new BABYLON.Color3(0, 0, 1);
    const zChar = makeTextPlane('Z', 'blue', size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  }

}
