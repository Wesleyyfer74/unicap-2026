export function getClientIp(request) {
  const forwarded = request.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : request.ip || request.socket.remoteAddress || '').trim().slice(0, 64) || null;
}

export function describeUserAgent(value = '') {
  const userAgent = value.slice(0, 1000);
  const sistema = /Windows NT/i.test(userAgent) ? 'Windows' : /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS' : /Mac OS X/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : 'Não identificado';
  const navegador = /Edg\//i.test(userAgent) ? 'Microsoft Edge' : /OPR\//i.test(userAgent) ? 'Opera' : /Firefox\//i.test(userAgent) ? 'Firefox' : /CriOS\//i.test(userAgent) ? 'Chrome (iOS)' : /Chrome\//i.test(userAgent) ? 'Chrome' : /Safari\//i.test(userAgent) ? 'Safari' : 'Não identificado';
  const model = userAgent.match(/;\s*([^;()]+(?:SM-[A-Z0-9-]+|Pixel\s*[^;)]+|Redmi\s*[^;)]+|Mi\s*[^;)]+|iPhone|iPad)[^;)]*)/i)?.[1]?.trim();
  const dispositivo = model || (/iPhone/i.test(userAgent) ? 'iPhone' : /iPad/i.test(userAgent) ? 'iPad' : /Android/i.test(userAgent) ? 'Celular Android' : /Mobile/i.test(userAgent) ? 'Celular' : 'Computador');
  return { userAgent, dispositivo: dispositivo.slice(0, 191), sistema, navegador };
}
