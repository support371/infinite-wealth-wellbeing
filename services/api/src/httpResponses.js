export function success(res, { status = 200, code = 'ok', data = null, meta = {} } = {}) {
  return res.status(status).json({
    ok: true,
    code,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
}

export function accepted(res, { code = 'accepted', data = null, meta = {} } = {}) {
  return success(res, { status: 202, code, data, meta });
}

export function failure(res, { status = 400, code = 'bad_request', message = 'Request could not be processed', details = null } = {}) {
  return res.status(status).json({
    ok: false,
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}
