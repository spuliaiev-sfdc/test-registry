$(document).ready(function() {
  $('#commandReIndexAll').on('keypress click', function(e) {
    $.ajax({
      url: "/api/commands/reindexAll",
      success: function (json) {
        if (json.success) {
          console.log("GOOD", json);
          window.location = "/workers/" + json.workerId;
        }
      },
      error: function (err) {
        console.log("Failed", err);
        alert("Failed to enqueue!! " + err);
      }
    });
  });

});

