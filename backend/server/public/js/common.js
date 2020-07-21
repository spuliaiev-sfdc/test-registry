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
