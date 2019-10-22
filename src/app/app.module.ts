import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { EngineComponent } from './engine/engine.component';
import { TestComponent } from './test/test.component';

@NgModule({
  declarations: [
    AppComponent,
    EngineComponent,
    TestComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
