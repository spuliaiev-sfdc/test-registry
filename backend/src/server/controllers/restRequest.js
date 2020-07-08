
const restRequest = {

  analyse(req) {
    let result = {};
    this.detectPagination(req, result);
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
      }
      if (req.query.pageIndex) {
        result.pagination.pageIndex = parseInt(req.query.pageIndex);
        result.pagination.pageOffset = result.pagination.pageIndex * result.pagination.pageSize;
      }
    }
  }

}

module.exports = restRequest;
