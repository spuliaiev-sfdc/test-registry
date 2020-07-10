$(document).ready(function() {
  // $('#example').DataTable();
  $('#button-find').click( (e) => {
    e.preventDefault();
    $.get("/api/tests/find?team=Accounts&pageSize=15&pageIndex=1", null, ( data, textStatus, jqXHR ) => {


    });
  });

  $('#example').DataTable( {
    "processing": true,
    "serverSide": true,
    "ajax": $.fn.dataTable.pipeline( {
      url: '/api/tests/find?team=Accounts', // &pageSize=15&pageIndex=1
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


