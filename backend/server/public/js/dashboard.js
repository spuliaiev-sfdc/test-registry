
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
let chartsDefinitions = {};

function initStatsCharts() {
  initChart('testsByType', '/api/stats/testDistribution', 'pie', {}, 'Tests by type');
  initChart('testsByLibs', '/api/stats/testDistributionByLibs', 'pie', {}, 'Tests by libs');
  initChart('libraryCounts', '/api/stats/counts', 'text', {});
}

function initChart(chartElementId, url, chartType, chartOptions, title) {
  let cardElement = document.getElementById(chartElementId);
  let chartCanvas = $('canvas', cardElement)[0];
  if (title) {
    let chartTitle = $('div.card-title', cardElement)[0];
    $(chartTitle).text(title);
  }
  let chartComponent;
  let type;
  if (chartType === "pie" || chartType === "line") {
    chartComponent = new Chart(chartCanvas, {
      type: chartType || 'pie',
      data: {},
      options: chartOptions || {}
    });
    type = 'chart';
  } else {
    chartComponent = new TextCard(chartCanvas, chartOptions || {});
    type = 'text';
  }
  chartsDefinitions[chartElementId] = { chartElementId, url, chartType, chartOptions, chartComponent, type, title };
  refreshChart(chartElementId);
  return chartsDefinitions[chartElementId];
}
function updateChartWithData(chart, data) {
  let chartInfo = chart;
  if (typeof chart === "string") {
    chartInfo = chartsDefinitions[chart];
    chart = chartInfo.chartComponent;
  }
  let chartData = data.chartData ? data.chartData : data;
  chart.data.labels = chartData.labels;
  chart.data.datasets = chartData.datasets;
  chart.update();

  if (chartInfo.title) {
    let cardElement = document.getElementById(chartInfo.chartElementId);
    let chartTitle = $('div.card-title', cardElement)[0];
    let newTitle = chartInfo.title;
    if (data.team) {
      newTitle += ` for ${data.team}`;
    }
    $(chartTitle).text(newTitle);
  }

}
function updateTextWithData(chart, data) {
  let chartInfo = chart;
  if (typeof chart === "string") {
    chartInfo = chartsDefinitions[chart];
  }
  let cardElement = document.getElementById(chartInfo.chartElementId);
  let dataElements = $('.data-values', cardElement);
  for(let dataIndex = 0; dataIndex < dataElements.length; dataIndex++) {
    let element = $(dataElements[dataIndex]);
    let dataField = element.attr('data-field');
    let dataTarget = element.attr('data-target');
    if (dataField && data[dataField]) {
      if (dataTarget === 'value') {
        element.val(data[dataField]);
      }
      if (dataTarget === 'text') {
        element.text(data[dataField]);
      }
      if (dataTarget === 'html') {
        element.html(data[dataField]);
      }
    }
  }

}
function flagLoading(chartElementId, status, alert){
  let cardElement = document.getElementById(chartElementId);
  let chartCanvas = $('.card-body', cardElement);
  let chartSpinner = $('div.spinner-block', cardElement);
  let chartAlert = $('div.alert-icon', cardElement);
  if (status) {
    $(chartCanvas).addClass('hidden');
    $(chartAlert).addClass('hidden');
    $(chartSpinner).removeClass('hidden');
  } else {
    $(chartSpinner).addClass('hidden');
    if (typeof alert === 'boolean' && alert){
      $(chartCanvas).addClass('hidden');
      $(chartAlert).removeClass('hidden');
    } else {
      $(chartAlert).addClass('hidden');
      $(chartCanvas).removeClass('hidden');
    }
  }
}
function refreshChart(chartElementId) {
  let chartInfo = chartsDefinitions[chartElementId];
  flagLoading(chartElementId, true);
  $.ajax( {
    "type"    : 'GET',
    "url"     : chartInfo.url+"?team="+$("#teamName")[0].value,
    "data"    : undefined,
    "dataType": "json",
    "cache"   : false,
    "success" : function ( json ) {
      flagLoading(chartElementId, false);
      if (json.success) {
        let chart = chartsDefinitions[chartElementId];
        if (chart.type === 'chart') {
          updateChartWithData(chartElementId, json.data);
          if (json.data.teams) {
              $("#teamsDescription").text(json.data.teams);
          }
        }
        if (chart.type === 'text') {
          updateTextWithData(chartElementId, json.data);
        }
      } else {
        flagLoading(chartElementId, false, true);
        console.log(`Failed to get data for chart `+chartElementId, json);
      }
    }
  });
}
$(document).ready(function() {
  initDemoCharts();
  initStatsCharts();

  initTeamsAutocomplete();
  $('#teamName').on('keypress click', function(e){
    if (e.which === 13 || e.type === 'click') {
      refreshChart('testsByType');
      refreshChart('testsByLibs');
      refreshChart('libraryCounts');
    }
  });
});
