const fail = (message, status) => Response.json({error: message}, {status, headers: {'Cache-Control':'no-store'}});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/tts') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return fail('Please use the Generate audio button.', 405);
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return fail('Please generate audio on this website.', 403);
    if (!request.headers.get('content-type')?.includes('application/json')) return fail('Please submit text.', 415);
    if (Number(request.headers.get('content-length')) > 16000) return fail('Please shorten your text to 1,000 characters.', 413);
    let body;
    try {
      const raw = await request.text();
      if (raw.length > 16000) return fail('Please shorten your text to 1,000 characters.', 413);
      body = JSON.parse(raw);
    } catch { return fail('Please enter your text and try again.', 400); }
    if (typeof body.text !== 'string' || !body.text.trim()) return fail('Add some text to generate your audio.', 400);
    const text = body.text.trim();
    if ([...text].length > 1000) return fail('Please shorten your text to 1,000 characters.', 400);
    try {
      const result = await env.AI.run('@cf/myshell-ai/melotts', {prompt:text, lang:'en'});
      let audio = result;
      if (result && typeof result.audio === 'string') {
        audio = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0));
      }
      if (!(audio instanceof ReadableStream) && !(audio instanceof ArrayBuffer) && !ArrayBuffer.isView(audio)) {
        return fail('The voice service could not return audio. Please try again.', 502);
      }
      const bytes = new Uint8Array(await new Response(audio).arrayBuffer());
      const wav = String.fromCharCode(...bytes.subarray(0,4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8,12)) === 'WAVE';
      const mp3 = String.fromCharCode(...bytes.subarray(0,3)) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224);
      if (!wav && !mp3) return fail('The voice service returned an unsupported audio file. Please try again.', 502);
      const extension = wav ? 'wav' : 'mp3';
      return new Response(bytes, {headers:{'Content-Type':wav?'audio/wav':'audio/mpeg','Content-Disposition':`attachment; filename="tiktok-tts.${extension}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    } catch {
      return fail('The voice service is busy or today\'s free allowance has been reached. Please try again later.', 503);
    }
  }
};
