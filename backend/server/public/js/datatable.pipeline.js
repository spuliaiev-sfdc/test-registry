//
// Pipelining function for DataTables. To be used to the `ajax` option of DataTables
//
$.fn.dataTable.pipeline = function ( opts ) {
  // Configuration options
  var conf = $.extend( {
    pages: 5,     // number of pages to cache
    url: '',      // script url
    data: null,   // function or object with parameters to send to the server
                  // matching how `ajax.data` works in DataTables
    method: 'GET' // Ajax HTTP method
  }, opts );

  // Private variables for storing the cache
  var cacheLower = -1;
  var cacheUpper = null;
  var cacheLastRequest = null;
  var cacheLastJson = null;

  return function ( request, drawCallback, settings ) {
    if (conf.populateMoreFilters) {
      conf.populateMoreFilters(request, settings, conf);
    }


    var ajax          = false;
    var requestStart  = request.pageOffset;
    var drawStart     = request.pageOffset;
    var requestLength = request.pageSize;
    var requestEnd    = requestStart + requestLength;

    if ( settings.clearCache ) {
      // API requested that the cache be cleared
      ajax = true;
      settings.clearCache = false;
    }
    else if ( cacheLower < 0 || requestStart < cacheLower || requestEnd > cacheUpper ) {
      // outside cached data - need to make a request
      ajax = true;
    }
    else if (
      JSON.stringify( request.order )   !== JSON.stringify( cacheLastRequest.order ) ||
      JSON.stringify( request.columns ) !== JSON.stringify( cacheLastRequest.columns ) ||
      JSON.stringify( request.search )  !== JSON.stringify( cacheLastRequest.search ) ||
      JSON.stringify( request.filters ) !== JSON.stringify( cacheLastRequest.filters )
    ) {
      // properties changed (ordering, columns, searching or filters)
      ajax = true;
    }

    // Store the request for checking next time around
    cacheLastRequest = $.extend( true, {}, request );

    if ( ajax ) {
      // Need data from the server
      if ( requestStart < cacheLower ) {
        requestStart = requestStart - (requestLength*(conf.pages-1));

        if ( requestStart < 0 ) {
          requestStart = 0;
        }
      }

      cacheLower = requestStart;
      cacheUpper = requestStart + (requestLength * conf.pages);

      request.pageOffset = requestStart;
      request.pageSize = requestLength*conf.pages;

      // Provide the same `data` options as DataTables.
      if ( typeof conf.data === 'function' ) {
        // As a function it is executed with the data object as an arg
        // for manipulation. If an object is returned, it is used as the
        // data object to submit
        var d = conf.data( request );
        if ( d ) {
          $.extend( request, d );
        }
      }
      else if ( $.isPlainObject( conf.data ) ) {
        // As an object, the data given extends the default
        $.extend( request, conf.data );
      }

      let prependedHost = conf.url.startsWith("http");
      let url;
      if (prependedHost) {
        url = new URL(conf.url);
      } else {
        url = new URL("http://host/"+conf.url);
      }
      // if filters are defined - add them to the url
      let search_params = url.searchParams;
      for(let filterName in request.filters) {
        search_params.set(filterName, request.filters[filterName]);
      }
      let finalUrl = prependedHost ? url.toString() : url.toString().substring(12);

      return $.ajax( {
        "type":     conf.method,
        "url":      finalUrl,
        "data":     request,
        "dataType": "json",
        "cache":    false,
        "success":  function ( json ) {
          cacheLastJson = $.extend(true, {}, json);

          if ( cacheLower != drawStart ) {
            json.data.splice( 0, drawStart-cacheLower );
          }
          if ( requestLength >= -1 ) {
            json.data.splice( requestLength, json.data.pageSize );
          }

          drawCallback( json );
        }
      } );
    }
    else {
      json = $.extend( true, {}, cacheLastJson );
      json.draw = request.draw; // Update the echo for each response
      json.data.splice( 0, requestStart-cacheLower );
      json.data.splice( requestLength, json.data.pageSize );

      drawCallback(json);
    }
  }
};

// Register an API method that will empty the pipelined data, forcing an Ajax
// fetch on the next draw (i.e. `table.clearPipeline().draw()`)
$.fn.dataTable.Api.register( 'clearPipeline()', function () {
  return this.iterator( 'table', function ( settings ) {
    settings.clearCache = true;
  } );
} );


//
// DataTables initialisation
//
// $(document).ready(function() {
//   $('#example').DataTable( {
//     "processing": true,
//     "serverSide": true,
//     "ajax": $.fn.dataTable.pipeline( {
//       url: 'scripts/server_processing.php',
//       pages: 5 // number of pages to cache
//     } )
//   } );
// } );