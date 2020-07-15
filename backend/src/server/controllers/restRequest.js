
const restRequest = {

  analyse(req) {
    let result = {};
    this.detectPagination(req, result);
    this.detectSorting(req, result);
    this.detectSearchParameter(req, result);
    return result;
  },

  /**
   * Analyses the request for the following parameters:
   * {int} pageSize size of the page, by default is 20
   * {int} pageOffset offset of the first record in page
   * {int} pageIndex index of the current page
   * @param req
   * @param result
   */
  detectPagination(req, result) {
    if (req.query.pageSize || req.query.pageOffset || req.query.pageIndex) {
      result.pagination = {
        // default page size is 20
        pageSize: parseInt(req.query.pageSize) || 20,
      };
      if (req.query.pageOffset) {
        result.pagination.pageOffset = parseInt(req.query.pageOffset);
        result.pagination.pageIndex = result.pagination.pageOffset / result.pagination.pageSize;
      } else {
        result.pagination.pageOffset = 0;
        result.pagination.pageIndex = 0;
      }
      if (req.query.pageIndex) {
        result.pagination.pageIndex = parseInt(req.query.pageIndex);
        result.pagination.pageOffset = result.pagination.pageIndex * result.pagination.pageSize;
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
      result.filter = {};
      result.filter.searchString = req.query.search.value.trim();
      result.filter.isRegExp = "true" === req.query.search.regex;
    }
  }
}

module.exports = restRequest;
