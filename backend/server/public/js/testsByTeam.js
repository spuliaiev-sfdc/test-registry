let testsByTeamDataTable;

function resetSearchParameters() {
  console.log('resetSearchParameters');
  $("#teamName").val("");
  $("#methodName").val("");
  $("#className").val("");
  $("#classesTable_filter input[type='search']").val("");
  updateSearchParametersCookies();
}
function updateSearchParametersCookies(){
  console.log('updateSearchParametersCookies');
  let teamFilter = $("#teamName")[0].value;
  setCookie("Search_Team",teamFilter.trim(), 7);
  let methodNameFilter = $("#methodName")[0].value;
  setCookie("Search_Method",methodNameFilter.trim(), 7);
  let classNameFilter = $("#className")[0].value;
  setCookie("Search_Class",classNameFilter.trim(), 7);
  let searchString = $("#classesTable_filter input[type='search']")[0].value;
  setCookie("Search_Search",searchString.trim(), 7);
}
function fetchSearchParametersFromCookies(){
  console.log('fetchSearchParametersFromCookies');
  $("#teamName").val(getCookie("Search_Team"));
  $("#methodName").val(getCookie("Search_Method"));
  $("#className").val(getCookie("Search_Class"));
  $("#classesTable_filter input[type='search']").val(getCookie("Search_Search"));
}
function populateClassInformationDiv(classData) {
  let classInfoDiv = $('.classInformation');
  console.log('class Info', classData);
  FormHelper.populate(classInfoDiv, classData);

  // Populate class IntelliJ Link
  let className = classData.class;
  let methodName = '';
  let intelliJUrl = `http://localhost:63342/api/openFile/${className}/${methodName}`;
  $('#classLinkIntelliJ').attr("href-data", intelliJUrl);

  // Populate class IntelliJ Link
  let classPath = classData.relative;
  let codeSearchUrl = `https://codesearch.data.sfdc.net/source/xref/app_main_core/app/main/core/${classPath}`;
  $('#classLinkCodeSearch').attr("href", codeSearchUrl);

  // populating badged
  setBadBadge('#badge_INDEV', classData.classInfo.IN_DEV, classData.classInfo.partialIN_DEV);

  // populating methodsInfo
  FormHelper.populateList('#methodsList', classData.methodsInfo, (populatedElement, dataRowObject, dataObject) => {
    if (dataRowObject.IN_DEV) {
      populatedElement.addClass('list-group-item-secondary');
    }
  });
}


$(document).ready(function() {
  initTeamsAutocomplete();
  $('#button-find').click( (e) => {
    e.preventDefault();
    testsByTeamDataTable.ajax.reload();
  });
  $('#button-reset').click( (e) => {
    e.preventDefault();
    resetSearchParameters();
  });

  $('#classLinkIntelliJ').click( (e) => {
    e.preventDefault();
    let url = e.target.getAttribute('href-data');
    $.get(url);
  });

  $('#classesTable tbody').on( 'click', 'tr', function () {
    if ( $(this).hasClass('selected') ) {
      $(this).removeClass('selected');
    }
    else {
      testsByTeamDataTable.$('tr.selected').removeClass('selected');
      $(this).addClass('selected');
      populateClassInformationDiv(testsByTeamDataTable.row( this ).data() );
    }
  } );

  $('ul#methodsList').on( 'click', 'span.methodLinks span.badge', function () {
    let methodData = $(this).parents('.populated').data("populatedBy");
    let classData = $('.classInformation').data("populatedBy");
    if (classData && methodData) {
      let className = classData.class;
      let methodName = methodData.name;
      let badge = $(this).attr('name');
      let url = `http://localhost:63342/api/openFile/${className}/${methodName}`;
      if (badge === 'method-ATF') {
        url=`https://portal.prod.ci.sfdc.net/testhistory?pageType=history&testClass=${className}&testName=${methodName}`
      }
      if (badge === 'method-IDE') {
        url = `http://localhost:63342/api/openFile/${className}/${methodName}`;
        $.get(url);
        return;
      }
      window.open(url , '_blank');
    }
  } );

  $('#methodsList').on( 'click', '.ideLink', function () {
    let methodData = $(this).parents('.populated').data("populatedBy");
    let classData = $('.classInformation').data("populatedBy");
    let badge = $(this).attr('name');
    if (classData && methodData) {
      let className = classData.class;
      let methodName = methodData.name;
      let intelliJUrl = `http://localhost:63342/api/openFile/${className}/${methodName}`;
      $.get(intelliJUrl);
    }
  });

  $('#teamName,#className,#methodName').on('keypress click', function(e){
    if (e.which === 13 || e.type === 'click') {
      testsByTeamDataTable.ajax.reload();
    }
  });

  fetchSearchParametersFromCookies();
  testsByTeamDataTable = $('#classesTable').DataTable( {
    "processing": true,
    "serverSide": true,
    "ajax": $.fn.dataTable.pipeline( {
      url: '/api/tests/find',
      populateMoreFilters: (request, settings, conf) => {
        updateSearchParametersCookies();
        if(!request.filters) {
          request.filters = {};
        }
        try {
          let teamFilter = $("#teamName")[0].value;
          if (teamFilter.trim().length > 0) {
            request.filters["team"] = teamFilter;
          }
          let methodNameFilter = $("#methodName")[0].value;
          if (methodNameFilter.trim().length > 0) {
            request.filters["method"] = methodNameFilter;
          }
          let classNameFilter = $("#className")[0].value;
          if (classNameFilter.trim().length > 0) {
            request.filters["class"] = classNameFilter;
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


