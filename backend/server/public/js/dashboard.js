
var chartData = {
  labels: ["S", "M", "T", "W", "T", "F", "S"],
  datasets: [{
      data: [589, 445, 483, 503, 689, 692, 634],
      backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)']
    },
    {
      data: [639, 465, 493, 478, 589, 632, 674],
      backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)']
    }]
};

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
function initDemoCharts() {
  var chPie = document.getElementById("chPie");
  if (chPie) {
    var myPieChart = new Chart(chPie, {
      type: 'pie',
      data: pieData,
      options: {}
    });
  }

  var chLine = document.getElementById("chLine");
  if (chLine) {
    new Chart(chLine, {
      type: 'line',
      data: chartData,
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false
            }
          }]
        },
        legend: {
          display: false
        }
      }
    });
  }
}
let chartTestsByType;
let chartsDefinitions = {};

function initStatsCharts() {
  initChart('testsByType', '/api/stats/testDistribution', 'pie', {});
}

function initChart(chartElementId, url, chartType, chartOptions) {
  let cardElement = document.getElementById(chartElementId);
  let chartCanvas = $('canvas', cardElement)[0];
  let chartComponent = new Chart(chartCanvas, {
    type: chartType || 'pie',
    data: {},
    options: chartOptions || {}
  });
  chartsDefinitions[chartElementId] = {
    chartElementId, url, chartType, chartOptions, chartComponent
  };
  refreshChart(chartElementId);
  return chartsDefinitions[chartElementId];
}
function updateChartWithData(chart, data) {
  if (typeof chart === "string") {
    chart = chartsDefinitions[chart].chartComponent;
  }
  chart.data.labels = data.labels;
  chart.data.datasets = data.datasets;
  chart.update();
}
function flagLoading(chartElementId, status){
  let cardElement = document.getElementById(chartElementId);
  let chartCanvas = $('canvas', cardElement)[0];
  let chartSpinner = $('div.spinner-border', cardElement)[0];
  if (status) {
    $(chartSpinner).removeClass('hidden');
    $(chartCanvas).addClass('hidden');
  } else {
    $(chartSpinner).addClass('hidden');
    $(chartCanvas).removeClass('hidden');
  }
}
function refreshChart(chartElementId) {
  let chartInfo = chartsDefinitions[chartElementId];
  flagLoading(chartElementId, true);
  $.ajax( {
    "type"    : 'GET',
    "url"     : chartInfo.url,
    "data"    : undefined,
    "dataType": "json",
    "cache"   : false,
    "success" : function ( json ) {
      flagLoading(chartElementId, false);
      if (json.success) {
        updateChartWithData(chartElementId, json.data);
      } else {
        console.log(`Failed to get data for chart TestsByType`, json);
      }
    }
  });
}
$(document).ready(function() {
  initDemoCharts();
  initStatsCharts();
});
