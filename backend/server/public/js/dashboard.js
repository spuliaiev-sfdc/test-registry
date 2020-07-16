
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
function initStatsCharts() {
  let chartTestsByTypeCanvas = document.getElementById("testsByType");
  chartTestsByType = new Chart(chartTestsByTypeCanvas, {
    type: 'pie',
    data: {},
    options: {}
  });
}
function updateChartWithData(chart, data) {
  chart.data.labels = data.labels;
  chart.data.datasets = data.datasets;
  chart.update();
}

function refreshChart(chartElementId, chart, url) {
  let chartCanvas = document.getElementById(chartElementId);
  $('div.spinner-border', chartCanvas.parentElement).removeClass('hidden');
  $(chartCanvas).addClass('hidden');
  $.ajax( {
    "type"    : 'GET',
    "url"     : url,
    "data"    : undefined,
    "dataType": "json",
    "cache"   : false,
    "success" : function ( json ) {
      if (json.success) {
        let chartCanvas = document.getElementById(chartElementId);
        $('div.spinner-border', chartCanvas.parentElement).addClass('hidden');
        $(chartCanvas).removeClass('hidden');
        updateChartWithData(chart, json.data);
      } else {
        console.log(`Failed to get data for chart TestsByType`, json);
      }
    }
  });
}
$(document).ready(function() {
  initDemoCharts();
  initStatsCharts();
  refreshChart("testsByType", chartTestsByType, "/api/stats/testDistribution");
});
