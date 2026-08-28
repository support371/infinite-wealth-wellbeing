import { getPersistenceMode } from '../services/api/src/repositories.js';

export default function health(_request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({
    status: 'ok',
    service: 'iww-api',
    persistence: getPersistenceMode(),
    project: 'fepfnzrpftxpxlgyujev'
  });
}
