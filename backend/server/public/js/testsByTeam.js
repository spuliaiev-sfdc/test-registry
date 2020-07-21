let testsByTeamDataTable;

$(document).ready(function() {
  initTeamsAutocomplete();
  $('#button-find').click( (e) => {
    e.preventDefault();
    testsByTeamDataTable.ajax.reload();
  });

  $('#teamName').on('keypress click', function(e){
    if (e.which === 13 || e.type === 'click') {
      testsByTeamDataTable.ajax.reload();
    }
  });

  testsByTeamDataTable = $('#example').DataTable( {
    "processing": true,
    "serverSide": true,
    "ajax": $.fn.dataTable.pipeline( {
      url: '/api/tests/find',
      populateMoreFilters: (request, settings, conf) => {
        if(!request.filters) {
          request.filters = {};
        }
        try {
          let teamFilter = $("#teamName")[0].value;
          if (teamFilter.trim().length > 0) {
            request.filters["team"] = teamFilter;
          }
        } catch (e) {
          console.error("Failed to populate the filters", e);
        }
      },
      pages: 5 // number of pages to cache
    }),
    "columns": [
        { "data": "class",
          "render": function(data, type, row, meta){
            if(type === 'display'){
              data = '<a href="/api/files/viewFile?filePath=' + row.relative + '">' + data + '</a>';
            }
            return data;
          }
        },
        { "data": "module" },
        // { "data": "relative" },
        { "data": "testKind" },
    ]
  } );

} );


