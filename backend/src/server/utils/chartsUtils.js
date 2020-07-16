const
  utils = require('../../corUtils.js');

/* Example Pie Data:
let pieData = {
  datasets: [{
    data: [10, 20, 30],
    backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)']
  }],

  // These labels appear in the legend and in the tooltips when hovering different arcs
  labels: [
    'Red',
    'Yellow',
    'Blue'
  ]
};

 */
const chartsUtils = {
  defaultColors: [
    'rgb(73,140,138)',
    'rgb(92,65,93)',
    'rgb(226,113,29)',
    'rgb(138,187,33)',
    'rgb(246,78,41)',
    'rgb(246,186,42)',
    'rgb(45,149,236)',
    'rgb(160,82,149)',
    'rgb(199,30,29)',
    'rgb(56,243,187)',
    'rgb(255,216,187)'
  ],
  defaultColors2: [
    'rgb(0,255,1)',
    'rgb(1,255,255)',
    'rgb(0,127,255)',
    'rgb(0,0,255)',
    'rgb(127,0,255)',
    'rgb(255,0,255)',
    'rgb(255,0,127)',
    'rgb(255,1,0)',
    'rgb(255,127,0)',
    'rgb(143,46,1)',
    'rgb(255,255,1)'
  ],
  convertToPieChart(sourceData) {
    let result = {
      datasets: [{
        data: [],
        backgroundColor: []
      }],
        // These labels appear in the legend and in the tooltips when hovering different arcs
      labels: []
    };
    for(let i=0; i<sourceData.length; i++) {
      let label = sourceData[i]._id;
      let value = sourceData[i].count;
      result.labels.push(!label ? "_" : label);
      result.datasets[0].data.push(value);
      if (i < this.defaultColors.length) {
        result.datasets[0].backgroundColor.push(this.defaultColors[i]);
      }
    }
    
    return result;
  }
}

module.exports = chartsUtils;
