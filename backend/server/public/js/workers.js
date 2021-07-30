let workersDataTable;

$(document).ready(function() {
  $('#teamName,#className,#methodName').on('keypress click', function(e){
    if (e.which === 13 || e.type === 'click') {
      workersDataTable.ajax.reload();
    }
  });

  workersDataTable = $('#workersTable').DataTable( {
    "processing": true,
    "serverSide": true,
    "ajax": $.fn.dataTable.pipeline( {
      url: '/api/workers',
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
        { "data": "started" },
        { "data": "finished" },
        { "data": "error" },
    ]
  } );
} );


