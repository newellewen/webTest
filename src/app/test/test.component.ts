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

  private buttons: Button[] = []

  constructor(private engineService: EngineService) { }

  ngOnInit() {
    this.buttons = [
      {id: 0, name: 'sol' },
      {id: 1, name: 'mercury'},
      {id: 2, name: 'venus'},
      {id: 3, name: 'earth'}
    ];
  }

  clickedMe(id: number): void {
    this.engineService.moveCameraToPlanet(id);
  }

}
