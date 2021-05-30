import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { regression } from 'echarts-stat';


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

  regs: {[key: string]: {name: string, pop: number, color: string}} = {
    '00': {name: 'No consta', pop: 0},
    '01': {name: 'Andalucia', pop: 8426405, color: '#641E16'},
    '02': {name: 'Aragó', pop: 1320794, color: '#E74C3C'},
    '03': {name: 'Asturies', pop: 1022292, color: '#512E5F'},
    '04': {name: 'Balears', pop: 1187808, color: '#BB8FCE'},
    '05': {name: 'Canaries', pop: 2207225, color: '#154360'},
    '06': {name: 'Cantabria', pop: 581684, color: '#85C1E9'},
    '07': {name: 'Castella lleó', pop: 2408083, color: '#0E6251'},
    '08': {name: 'Castella la manxa', pop: 2035505, color: '#45B39D'},
    '09': {name: 'Catalunya', pop: 7565099, color: '#145A32'},
    10: {name: 'Valencia', pop: 4974475, color: '#58D68D'},
    11: {name: 'Extremadura', pop: 1065371, color: '#58D68D'},
    12: {name: 'Galicia', pop: 2700330, color: '#58D68D'},
    13: {name: 'Madrid', pop: 6640705, color: '#784212'},
    14: {name: 'Murcia', pop: 1487698, color: '#E59866'},
    15: {name: 'Navarra', pop: 649966, color: '#E59866'},
    16: {name: 'Pais basc', pop: 2178048, color: '#CACFD2'},
    17: {name: 'La rioja', pop: 313582, color: '#CACFD2'},
    18: {name: 'Ceuta', pop: 84843, color: '#CACFD2'},
    19: {name: 'Melilla', pop: 84714, color: '#CACFD2'},
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
          const data = line.map(v => parseInt(v, 10) / result[code].pop * 100000);
          const sl = [];
          let sum = 0;
          const dg = 7;
          data.forEach((v, i) => {
            if (i % dg === 0) {
              sl.push(sum / dg);
              sum = 0;
            } else {
              sum += v;
              sl.push(null);
            }
          });
          this.deaths.series.push({
            type: 'bar',
            name,
            data,
            color: this.regs[code].color,
          });
          this.deaths.series.push({
            type: 'line',
            name,
            smooth: true,
            data: sl,
            connectNulls: true,
            color: this.regs[code].color,
          });
          
          this.deaths.legend.data.push(name);
          this.deaths.legend.selected[name] = false;
        }
      });
      this.ready = true;
    });

  }


  private getRegression(data: Array<number>, degree: number) {
    const input = [];
    const first = data.findIndex(value => value > 0);
    data.forEach((value, index) => input.push([index, value]));
    const result = regression('polynomial', input, degree).points;
    return result.map((value, idx) => (value[1] > 0 && idx > first) ? value[1] : 0);
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
