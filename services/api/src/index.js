import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { authenticateRequest } from './auth.js';
import { auditAfter } from './audit.js';
import { getPersistenceMode, repositories } from './repositories.js';
import { requirePermission } from './rbac.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin(origin, callback) {
  const allowed = (process.env.APP_ORIGINS || '').split(',').map((item)=>item.trim()).filter(Boolean);
  if (!origin || allowed.includes(origin) || /^https:\/\/infinite-wealth-wellbeing(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) callback(null, true);
  else callback(new Error('origin_not_allowed'));
}}));
app.use(express.json({ limit: '256kb' }));
app.use((req,_res,next)=>{req.id=req.headers['x-request-id']||crypto.randomUUID();next();});

app.get('/api/health', (_req, res) => res.json({ status:'ok', service:'iww-api', persistence:getPersistenceMode(), project:'fepfnzrpftxpxlgyujev' }));

const protectedApi = express.Router();
protectedApi.use(authenticateRequest);
protectedApi.get('/session', (req,res)=>res.json({ userId:req.user.id, organizationId:req.organizationId, role:req.membership.role }));
protectedApi.get('/programmes', requirePermission('member.read'), async (req,res,next)=>{try{res.json({data:await repositories.programmes.list(req)});}catch(e){next(e);}});
protectedApi.post('/programmes', requirePermission('programme.manage'), auditAfter('programme.create','programme'), async(req,res,next)=>{try{const parsed=z.object({title:z.string().min(2).max(160),description:z.string().max(5000).optional(),programme_type:z.string().min(2).max(80)}).parse(req.body);res.status(201).json({data:await repositories.programmes.create(req,parsed)});}catch(e){next(e);}});
const providerSchema = z.string().trim().min(2).max(120).regex(/^[a-z0-9_]+$/);
protectedApi.post('/integrations/:provider/request', requirePermission('integration.manage'), auditAfter('integration.request','integration_connection'), async(req,res,next)=>{try{const provider=providerSchema.parse(req.params.provider);res.status(201).json({data:await repositories.integrations.request(req,provider)});}catch(e){next(e);}});
protectedApi.post('/integrations/:provider/revoke', requirePermission('integration.manage'), auditAfter('integration.revoke','integration_connection'), async(req,res,next)=>{try{const provider=providerSchema.parse(req.params.provider);res.json({data:await repositories.integrations.revoke(req,provider)});}catch(e){next(e);}});
app.use('/api/v1', protectedApi);

app.use((error,req,res,_next)=>{
  if (error instanceof z.ZodError) return res.status(400).json({error:'validation_failed',details:error.flatten(),requestId:req.id});
  if (error.statusCode) return res.status(error.statusCode).json({error:error.message,requestId:req.id});
  console.error('[request-failed]',req.id,error.message);
  return res.status(500).json({error:'internal_error',requestId:req.id});
});

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const port = Number(process.env.PORT || 8787);
  app.listen(port,()=>console.log(`IWW API listening on ${port}`));
}

export default app;
