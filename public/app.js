lucide.createIcons();
const form = document.querySelector('#tts-form');
const input = document.querySelector('#text');
const counter = document.querySelector('#counter');
const message = document.querySelector('#message');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const audio = document.querySelector('#audio');
const download = document.querySelector('#download');
let objectUrl;
let busy = false;
const count = () => [...input.value].length;
input.addEventListener('input', () => {
  counter.textContent = `${count().toLocaleString('en-US')} / 1,000 characters`;
  counter.classList.toggle('over', count() > 1000);
  message.textContent = count() > 1000 ? 'Please shorten your text to 1,000 characters.' : '';
});
document.querySelector('#clear').addEventListener('click', () => {
  if (busy) return;
  input.value = '';
  input.dispatchEvent(new Event('input'));
  input.focus();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  if (!input.value.trim()) { message.textContent = 'Add some text to generate your audio.'; input.focus(); return; }
  if (count() > 1000) { message.textContent = 'Please shorten your text to 1,000 characters.'; input.focus(); return; }
  busy = true;
  generate.disabled = true;
  input.readOnly = true;
  document.querySelector('#clear').disabled = true;
  generate.querySelector('span').textContent = 'Generating...';
  message.textContent = 'Creating your voiceover...';
  audio.pause();
  result.hidden = true;
  try {
    const response = await fetch('/api/tts', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:input.value.trim()}),signal:AbortSignal.timeout(120000)});
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Audio could not be generated. Please try again later.'); }
    const blob = await response.blob();
    if (!blob.size || !blob.type.includes('audio/')) throw new Error('No audio was returned. Please try again.');
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    audio.src = objectUrl;
    download.href = objectUrl;
    const extension = blob.type.includes('wav') ? 'wav' : 'mp3';
    download.download = `tiktok-tts.${extension}`;
    download.querySelector('span').textContent = `Download ${extension.toUpperCase()}`;
    result.hidden = false;
    message.textContent = '';
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  } catch(error) {
    message.textContent = error.name === 'TimeoutError' ? 'This is taking longer than usual. Please try a shorter script.' : error instanceof TypeError ? 'Could not connect. Check your connection and try again.' : error.message;
  } finally {
    busy = false;
    generate.disabled = false;
    input.readOnly = false;
    document.querySelector('#clear').disabled = false;
    generate.querySelector('span').textContent = 'Generate audio';
  }
});
