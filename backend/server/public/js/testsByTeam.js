let testsByTeamDataTable;

$(document).ready(function() {
  // $('#example').DataTable();
  $('#button-find').click( (e) => {
    e.preventDefault();
    testsByTeamDataTable.ajax.reload();
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
        { "data": "class" },
        { "data": "module" },
        // { "data": "relative" },
        { "data": "testKind" },
    ]
  } );

} );


