const
  teamDataSnapshot = require('../../utils/teamDataSnapshot');

const restRequest = {

  analyse(req) {
    let result = {};
    this.detectPagination(req, result);
    this.detectSorting(req, result);
    this.detectSearchParameter(req, result);
    this.detectTeamFiltering(req, result);
    return result;
  },

  /**
   * Analyses the request for the following parameters:
   * {int} start offset of the first record in page
   * {int} length size of the page, by default is 20
   * {int} pageIndex index of the current page
   * @param req
   * @param result
   */
  detectPagination(req, result) {
    if (req.query.length || req.query.start || req.query.pageIndex) {
      result.pagination = {
        // default page size is 20
        length: parseInt(req.query.length) || 20,
      };
      if (req.query.start) {
        result.pagination.start = parseInt(req.query.start);
        result.pagination.pageIndex = result.pagination.start / result.pagination.length;
      } else {
        result.pagination.start = 0;
        result.pagination.pageIndex = 0;
      }
      if (req.query.pageIndex) {
        result.pagination.pageIndex = parseInt(req.query.pageIndex);
        result.pagination.start = result.pagination.pageIndex * result.pagination.length;
      }
    }
  },

  /**
   * Detect the columns and order from DataTable request
   */
  detectSorting(req, result) {
    if (req.query.order && req.query.columns) {
      result.sorting = {};
      for(let orderIndex = 0; orderIndex < req.query.order.length; orderIndex++) {
        let direction = req.query.order[orderIndex].dir === "asc" ? 1 : -1;
        let columnName = req.query.columns[parseInt(req.query.order[orderIndex].column)].data;
        result.sorting[columnName] = direction;
      }
    }
  },

  /**
   * Detect the Searching from DataTable request
   */
  detectSearchParameter(req, result) {
    if (req.query.search && req.query.search.value.trim().length > 0) {
      if (!result.filterByText) result.filterByText = {};
      result.filterByText.searchString = req.query.search.value.trim();
      result.filterByText.isRegExp = "true" === req.query.search.regex;
    }
  },

  /**
   * Expands the team name to list of team names using the aliases to cover old team names
   */
  detectTeamFiltering(req, result) {
    if(req.query.filters) {
      result.filters = req.query.filters;
      if(result.filters.team) {
        result.filters.team = teamDataSnapshot.getTeamAliases(result.filters.team);
      }
    }
  }
}

module.exports = restRequest;
