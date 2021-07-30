let ownershipReportsDataTable;

$(document).ready(function() {
  $('#RunOwnershipReport').on('click', function(e) {
    $.ajax({
      url: "/api/commands/ownershipReport",
      success: function (json) {
        if (json.success) {
          console.log("GOOD", json);
        }
      },
      error: function (err) {
        console.log("Failed", err);
        alert("Failed!! " + err);
      }
    });
  });

  ownershipReportsDataTable = $('#ownershipReportsDataTable').DataTable( {
    "processing": true,
    "serverSide": true,
    "ajax": $.fn.dataTable.pipeline( {
      url: '/api/ownershipReports',
      populateMoreFilters: (request, settings, conf) => {
        if(!request.filters) {
          request.filters = {};
        }
      },
      pages: 5 // number of pages to cache
    }),
    "columns": [
        { "data": "id",
          "render": function(data, type, row, meta){
            if(type === 'display'){
              data = '<a href="/api/files/viewFile?filePath=' + row.relative + '">' + data + '</a>';
            }
            return data;
          }
        },
        { "data": "name" },
        { "data": "status" },
    ]
  } );
} );


