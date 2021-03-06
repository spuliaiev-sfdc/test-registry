
const restResponse = {
  ok(entity) {
    return {
      data: entity,
      success: true
    };
  },

  oklist(entity) {
    if (typeof entity === 'undefined' || !entity ) {
      entity = { data: [], pagination: {
          length: 0,
          start: 0,
          pageIndex: 0,
          recordsTotal: 0,
          recordsFiltered: 0
      }};
    }
    return {
      data: entity.data,
      pagination: entity.pagination,
      success: true
    };
  },
  failed(code, message) {
    return {
      success: false,
      errorCode: code,
      errors: [message]
    };
  },

  failedTemplate(code, message) {
    return (paramName) => {
      return {
      success: false,
      errorCode: code,
      errors: [message+paramName]
    }};
  },

  format(response) {
   return JSON.stringify(response, null, 2);
  }
}
restResponse.INVALID_PARAMETER = restResponse.failedTemplate(400, "Invalid parameter ");
restResponse.MISSING_PARAMETER = restResponse.failedTemplate(400, "Missing parameter ");

module.exports = restResponse;
