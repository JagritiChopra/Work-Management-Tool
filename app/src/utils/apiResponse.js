export const sendSuccess = (res, statusCode, data, message = 'Success', meta = {}) => {
  const response = { status: 'success', message };
  if (Object.keys(meta).length) response.meta = meta;
  if (data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode, message, errors = null) => {
  const response = { status: 'fail', message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};
