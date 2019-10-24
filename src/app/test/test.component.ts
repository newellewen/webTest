import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { EngineService } from '../engine/engine.service';
import { Button } from './model/button';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TestComponent implements OnInit {

  public buttons: Button[] = []

  constructor(private engineService: EngineService) { }

  ngOnInit() {
    this.buttons = [
      {id: 0, name: 'sol' },
      {id: 1, name: 'mercury'},
      {id: 2, name: 'venus'},
      {id: 3, name: 'earth'},
      {id: 99, name: 'return'}
    ];
  }

  clickedMe(id: number): void {
    if (id===99) {
      this.engineService.returnFreeCamera();
    }
    else {
      this.engineService.followPlanet(id);
    }
    
  }

}
