import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../public/_worker.js';

function request(text, origin='https://example.com') {
  return new Request('https://example.com/api/tts', {method:'POST', headers:{'Content-Type':'application/json',origin}, body:JSON.stringify({text})});
}

test('rejects invalid input before calling AI', async()=>{
  const env={AI:{run(){throw new Error('AI must not run');}}};
  for(const text of ['', ' '.repeat(20), 'x'.repeat(1001), null]) {
    assert.equal((await worker.fetch(request(text),env)).status,400);
  }
  assert.equal((await worker.fetch(request('Hello','https://other.example'),env)).status,403);
});

test('labels WAV bytes correctly even when they arrive as base64', async()=>{
  const bytes=Buffer.from('RIFF0000WAVEfmt ');
  const response=await worker.fetch(request('Hello'),{AI:{run:async()=>({audio:bytes.toString('base64')})}});
  assert.equal(response.headers.get('content-type'),'audio/wav');
  assert.match(response.headers.get('content-disposition'),/\.wav/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
});

test('labels MP3 and rejects unknown bytes', async()=>{
  const response=await worker.fetch(request('Hello'),{AI:{run:async()=>new Uint8Array([255,251,0,0])}});
  assert.equal(response.headers.get('content-type'),'audio/mpeg');
  const unknown=await worker.fetch(request('Hello'),{AI:{run:async()=>new Uint8Array([1,2,3,4])}});
  assert.equal(unknown.status,502);
});

test('does not expose upstream error details', async()=>{
  const response=await worker.fetch(request('Hello'),{AI:{run:async()=>{throw new Error('private provider detail');}}});
  assert.equal(response.status,503);
  assert.ok(!(await response.text()).includes('private provider detail'));
});
