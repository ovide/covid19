import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http/';
import { NgxEchartsModule } from 'ngx-echarts';


import { AppComponent } from './app.component';
import { ChartComponent } from './chart/chart.component';
import { ChartCcaaComponent } from './chart-ccaa/chart-ccaa.component';

@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    ChartCcaaComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxEchartsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
