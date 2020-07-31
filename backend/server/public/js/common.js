$(document).ready(function() {

});

function initTeamsAutocomplete() {
  // Init Teams Autocomplete
  // Constructs the suggestion engine
  var teamsList = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // The url points to a json file that contains an array of country names
    prefetch: {
      url: 'api/teams/list',
      transform: function (response) {
        if (response.success) {
          return response.data;
        }
        console.log('Failed to fetch the data from server', response);
        return [];
      }
    },
    identify: function(obj) {
      return obj;
    },
  });
  $('#teamName').typeahead(  {
    hint: false,
    highlight: true,
    minLength: 3
  } , {
    name: 'teamsList',
    source: teamsList,
    limit: 10 /* Specify max number of suggestions to be displayed */
  });
}
function setCookie(name,value,days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; Expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function eraseCookie(name) {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
