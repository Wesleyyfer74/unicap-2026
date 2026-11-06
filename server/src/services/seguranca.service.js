import { prisma } from '../config/prisma.js';
import { describeUserAgent, getClientIp } from '../utils/user-agent.js';

const pageSize = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

export async function registrar(request, { tipo, caminho, sucesso = true, usuario } = {}) {
  try {
    const agent = describeUserAgent(request.get('user-agent') || '');
    await prisma.registroSeguranca.create({ data: {
      tipo, caminho: (caminho || request.path || '').slice(0, 500), metodo: request.method?.slice(0, 10), ip: getClientIp(request),
      ...agent, sucesso, usuarioId: usuario?.id || null, usuarioNome: usuario?.nome || null, perfil: usuario?.role || null,
    } });
  } catch { /* Registro de auditoria nunca interrompe o sistema. */ }
}

export async function listar({ page, limit, tipo, busca }) {
  const where = {
    ...(tipo && { tipo }),
    ...(busca && { OR: [
      { ip: { contains: busca } }, { usuarioNome: { contains: busca } }, { caminho: { contains: busca } }, { dispositivo: { contains: busca } },
    ] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.registroSeguranca.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.registroSeguranca.count({ where }),
  ]);
  return { items, pagination: pageSize(page, limit, total) };
}
