let testsByTeamDataTable;

function setGoodBadge(badgeElementId, status) {
  setBadge(badgeElementId, 'success', status);
}
function setBadBadge(badgeElementId, status, status2) {
  let kind = status ? 'success' : status2 ? 'warning' : 'success';
  setBadge(badgeElementId, kind, status);
}
function setBadBadge(badgeElementId, status, status2) {
  let kind = status ? 'danger' : status2 ? 'warning' : 'danger';
  setBadge(badgeElementId, kind, status);
}
function setBadge(badgeElementId, kind, status) {
  let badge = $('#badgeElementId');
  badge.addClass('hidden');
  badge.removeClass('badge-warning');
  badge.removeClass('badge-danger');
  badge.removeClass('badge-success');
  if (status) {
    badge.addClass('badge-' + kind);
    badge.removeClass('hidden');
  }
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

  $('#methodsList').on( 'click', '.ideLink', function () {
    let methodData = $(this).parents('.populated').data("populatedBy");
    let classData = $('.classInformation').data("populatedBy");
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

  testsByTeamDataTable = $('#classesTable').DataTable( {
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


