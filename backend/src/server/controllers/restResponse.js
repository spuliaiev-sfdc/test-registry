
const restResponse = {
  ok(entity) {
    return {
      data: entity,
      success: true
    };
  },

  oklist(entity) {
    return {
      data: entity.data,
      pagination: entity.pagination,
      success: true
    };
  },
  failed(code, message) {
    return {
      success: true,
      errorCode: code,
      errors: [message]
    };
  },

  failedTemplate(code, message) {
    return (paramName) => {
      return {
      success: true,
      errorCode: code,
      errors: [message+paramName]
    }};
  },

  format(response) {
   return JSON.stringify(response, null, 2);
  }
}
restResponse.INVALID_PARAMETER = restResponse.failedTemplate(400, "Invalid parameter ");

module.exports = restResponse;