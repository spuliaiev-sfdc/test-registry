
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
$(document).ready(function() {
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
});
