function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

export async function createUnicapQrImage(qrSource, studentName) {
  const [logo, qr] = await Promise.all([loadImage('/logo.png'), loadImage(qrSource)]);
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1040;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#071f45';
  context.fillRect(0, 0, canvas.width, 300);
  context.drawImage(logo, 135, 0, 450, 300);
  context.fillStyle = '#071f45';
  context.textAlign = 'center';
  context.font = '700 30px Arial, sans-serif';
  context.fillText('QR CODE DO ALUNO', 360, 350);
  context.font = '700 25px Arial, sans-serif';
  const displayName = studentName.length > 38 ? `${studentName.slice(0, 35)}...` : studentName;
  context.fillText(displayName.toUpperCase(), 360, 395);
  context.drawImage(qr, 80, 425, 560, 560);
  context.fillStyle = '#e53b2f';
  context.fillRect(0, 1022, canvas.width, 18);
  return canvas.toDataURL('image/png');
}
