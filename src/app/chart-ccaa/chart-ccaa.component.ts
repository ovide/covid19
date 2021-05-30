import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-chart-ccaa',
  templateUrl: './chart-ccaa.component.html',
  styleUrls: ['./chart-ccaa.component.sass']
})
export class ChartCcaaComponent implements OnInit {
  ready = false;

  deaths = {
    title: {
      show: true,
      text: 'Morts diaris per comunitat',
      subtext: 'Cada 100.000 habitants',
    },
    xAxis: {
      type: 'category',
      data: [],
    },
    yAxis: {
      type: 'value',
    },
    series: [],
    legend: {
      type: 'plain',
      data: [],
      selected: {},
      bottom: 0,
    }
  };

  regs: {[key: string]: {name: string, pop: number}} = {
    '00': {name: 'No consta', pop: 0},
    '01': {name: 'Andalucia', pop: 8426405},
    '02': {name: 'Aragó', pop: 1320794},
    '03': {name: 'Asturies', pop: 1022292},
    '04': {name: 'Balears', pop: 1187808},
    '05': {name: 'Canaries', pop: 2207225},
    '06': {name: 'Cantabria', pop: 581684},
    '07': {name: 'Castella lleó', pop: 2408083},
    '08': {name: 'Castella la manxa', pop: 2035505},
    '09': {name: 'Catalunya', pop: 7565099},
    10: {name: 'Valencia', pop: 4974475},
    11: {name: 'Extremadura', pop: 1065371},
    12: {name: 'Galicia', pop: 2700330},
    13: {name: 'Madrid', pop: 6640705},
    14: {name: 'Murcia', pop: 1487698},
    15: {name: 'Navarra', pop: 649966},
    16: {name: 'Pais basc', pop: 2178048},
    17: {name: 'La rioja', pop: 313582},
    18: {name: 'Ceuta', pop: 84843},
    19: {name: 'Melilla', pop: 84714},
  };

  constructor(private http: HttpClient) {  }

  ngOnInit() {
    const URL_DEATHS = 'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_fallecidos_por_fecha_defuncion_nueva_serie.csv';
    this.http.get(URL_DEATHS, { responseType: 'text'})
    .pipe(map(file => this.csv2array(file)))
    .subscribe(items => {
      this.deaths.xAxis.data = items.shift().slice(2);
      const result = Object.assign({}, this.regs);
      items.forEach(line => {
        const code = line.shift();
        const name = line.shift();
        if (code !== '00' && code in result) {
          this.deaths.series.push({
            type: 'bar',
            name,
            smooth: true,
            data: line.map(v => parseInt(v, 10) / result[code].pop * 100000),
          });
          this.deaths.legend.data.push(name);
          this.deaths.legend.selected[name] = false;
        }
      });
      this.ready = true;
    });

  }

  private csv2array(text: string) {
    let p = '';
    let row = [''];
    const ret = [row];
    let i = 0;
    let r = 0;
    let s = true;
    let l: string;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) {
              row[i] += l;
            }
            s = !s;
        } else if (',' === l && s) {
          l = row[++i] = '';
        } else if ('\n' === l && s) {
            if ('\r' === p) {
              row[i] = row[i].slice(0, -1);
            }
            row = ret[++r] = [l = '']; i = 0;
        } else {
          row[i] += l;
        }
        p = l;
    }
    return ret;
  }

}
