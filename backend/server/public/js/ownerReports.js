let workersDataTable;

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
  $('#teamName,#className,#methodName').on('keypress click', function(e){
    if (e.which === 13 || e.type === 'click') {
      testsByTeamDataTable.ajax.reload();
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
    ]
  } );
} );


