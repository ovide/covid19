import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { regression } from 'echarts-stat';


@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.sass']
})
export class ChartComponent implements OnInit {

  readyDeaths = false;
  readyReported = false;
  readyUci = false;
  limit = 55; // Només mostrem comunitats amb més de 50 morts per 100.000 habs.
  pond = 100000; // Número d'habitants per ponderar
  regressionDegree = 6;

  private visibleRegions = [];

  private pop = {
    '01': 8426405,
    '02': 1320794,
    '03': 1022292,
    '04': 1187808,
    '05': 2207225,
    '06': 581684,
    '07': 2408083,
    '08': 2035505,
    '09': 7565099,
    10: 4974475,
    11: 1065371,
    12: 2700330,
    13: 6640705,
    14: 1487698,
    15: 649966,
    16: 2178048,
    17: 313582,
    18: 84843,
    19: 84714,
  };

  totalDeaths = {
    title: {
      show: true,
      text: 'Acumulatiu de morts per comunitat',
      subtext: 'Cada 100.000 habitants',
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
    },
    series: [],
    legend: {
      type: 'plain',
      bottom: 0,
    }
  };

  incDeaths = {
    title: {
      show: true,
      text: 'Morts diaris per comunitat',
      subtext: 'Cada 100.000 habitants',
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
    },
    series: [],
    legend: {
      type: 'plain',
      bottom: 0,
    }
  };

  reported = {
    title: {
      show: true,
      text: 'Acumulatiu de casos confirmats per comunitat',
      subtext: 'Cada 100.000 habitants',
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
    },
    series: [],
    legend: {
      type: 'plain',
      bottom: 0,
    }
  };

  uciOptions = {
    title: {
      show: true,
      text: 'Porcentatge llits uci',
      subtext: 'Respecte el seu propi màxim historic'
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
    },
    series: [],
    legend: {
      type: 'plain',
      bottom: 0,
    }
  };


  constructor(private http: HttpClient) {}

  ngOnInit() {
    const deaths = 'https://raw.githack.com/datadista/datasets/master/COVID 19/ccaa_covid19_fallecidos.csv';
    this.http.get(deaths, {responseType: 'text'}).pipe(map((file: string) => {
      return this.csv2array(file);
    })).subscribe(items => {
      this.totalDeaths.xAxis.data = items.shift().slice(2);
      this.incDeaths.xAxis.data = this.totalDeaths.xAxis.data;
      const sum = [];
      for (let i = 0; i < items[0].length - 2; i++) {
        sum[i] = 0;
      }
      items.forEach(line => {
        const id = line.shift();
        if ((id !== '00') && (id !== '')) {
          const name = line.shift();
          const iline: Array<number> = line.map(item => parseInt(item, 10));
          const total = iline.map(item => item * this.pond / (this.pop[id]));
          iline.forEach((item, index) => {
            sum[index] += item * this.pond / 46940000;
          });
          const inc = [];
          Object.keys(iline).forEach(idx => {
            const cur = parseInt(idx, 10);
            if (cur === 0) {
              inc.push(0);
            }
            const prev = cur - 1;
            const diff = (iline[cur] * this.pond / (this.pop[id])) - (iline[prev] * this.pond / (this.pop[id]));
            inc.push(diff > 0 ? diff : 0);
          });
          if (total[total.length - 1] > this.limit ) {
            this.visibleRegions.push(id);
            this.totalDeaths.series.push({
              type: 'line',
              name,
              smooth: true,
              data: total,
            });
            this.incDeaths.series.push({
              type: 'bar',
              name,
              data: inc,
            });
            this.incDeaths.series.push({
              type: 'line',
              name,
              data: this.getRegression(inc, this.regressionDegree),
              smooth: true,
            });
          }
        }
      });

      this.totalDeaths.series.push({
        type: 'line',
        lineStyle: {
          width: 4,
        },
        name: 'Total',
        smooth: true,
        data: sum,
      });
      this.readyDeaths = true;
      this.reportedCases();
      this.uci();
    });
  }

  private getRegression(data: Array<number>, degree: number) {
    const input = [];
    const first = data.findIndex(value => value > 0);
    data.forEach((value, index) => input.push([index, value]));
    const result = regression('polynomial', input, degree).points;
    return result.map((value, idx) => (value[1] > 0 && idx > first) ? value[1] : 0);
  }

  private reportedCases() {
    const reported = 'https://raw.githack.com/datadista/datasets/master/COVID 19/ccaa_covid19_casos.csv';
    this.http.get(reported, {responseType: 'text'}).pipe(map((file: string) => {
      return this.csv2array(file);
    })).subscribe(items => {
      this.reported.xAxis.data = items.shift().slice(2);
      items.forEach(line => {
        const id = line.shift();
        if ((id !== '00') && (id !== '') && (this.visibleRegions.indexOf(id) >= 0)) {
          const name = line.shift();
          const iline: Array<number> = line.map(item => parseInt(item, 10));
          const total = iline.map(item => item * this.pond / (this.pop[id]));
          if (total[total.length - 1] > this.limit ) {
            this.reported.series.push({
              type: 'line',
              name,
              smooth: true,
              data: total,
            });
          }
        }
      });
      this.readyReported = true;
    });
  }

  private uci() {
    const uci = 'https://raw.githack.com/datadista/datasets/master/COVID 19/ccaa_covid19_uci.csv';
    this.http.get(uci, {responseType: 'text'}).pipe(map(file => this.csv2array(file))).subscribe(items => {
      this.uciOptions.xAxis.data = items.shift().slice(2);
      items.forEach(line => {
        const id = line.shift();
        if ((id !== '00') && (id !== '') && (this.visibleRegions.indexOf(id) >= 0)) {
          const name = line.shift();
          const iline: Array<number> = line.map(item => parseInt(item, 10));
          let max = 0;
          iline.forEach(value => {
            if (value > max) {
              max = value;
            }
          });
          const total = iline.map(item => item / max * 100);

          if (total[total.length - 1] > this.limit ) {
            this.uciOptions.series.push({
              type: 'bar',
              name,
              smooth: true,
              data: total,
            });
            this.uciOptions.series.push({
              type: 'line',
              name,
              smooth: true,
              data: this.getRegression(total, this.regressionDegree).map(value => value > 100 ? 100 : value),
            });
          }
        }
      });
      this.readyUci = true;
    });
  }

  private smooth(data: Array<number>, num: number): Array<number> {
    const result = [];
    data.forEach((item, index) => {
      const from = ((index - num) < 0) ? 0 : index - num;
      const to = ((index + num / 1.5) > data.length - 1) ? data.length - 1 : index + num / 1.5;
      let sum = 0;
      const part = data.slice(from, to);
      part.forEach(avg => sum += avg);
      result.push(sum / part.length);
    });
    return result;
  }

  changeRegressionDegree(value: string) {
    this.regressionDegree = parseInt(value, 10);
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
