/**
 * Normaliza un teléfono al formato que espera Evolution API (solo dígitos con
 * indicativo de país). Si viene un celular colombiano de 10 dígitos le antepone 57.
 */
export const normalizarTelefono = (telefono: string) => {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 10 && digitos.startsWith('3')) return `57${digitos}`;
  return digitos;
};

export const whatsappService = {
  /** Envía un mensaje de texto por WhatsApp a través de Evolution API. */
  enviarTexto: async (telefono: string, texto: string) => {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instancia = process.env.EVOLUTION_INSTANCE;
    if (!baseUrl || !apiKey || !instancia) {
      throw new Error('Evolution API no está configurada en el .env');
    }

    const response = await fetch(`${baseUrl}/message/sendText/${instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        number: normalizarTelefono(telefono),
        text: texto,
      }),
    });

    if (!response.ok) {
      const detalle = await response.text();
      throw new Error(`Evolution API respondió ${response.status}: ${detalle}`);
    }
    return response.json();
  },
};
