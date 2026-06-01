import http from 'http';

const tests = [
  'amazing',
  'not yet',
  'ok thanks',
  'who are you?',
  'saya mau tanya soal toko',
  'hari ini apa?',
  'what day is today?',
];

for (const q of tests) {
  await new Promise(resolve => {
    const req = http.request({ host: 'localhost', port: 3001, path: '/api/chat', method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          console.log(`Q: "${q}"\nA: ${j.text}\n`);
        } catch (e) { console.log('RAW:', b.substring(0, 200)); }
        resolve();
      });
    });
    req.write(JSON.stringify({ input: q }));
    req.end();
  });
  await new Promise(r => setTimeout(r, 700));
}
process.exit(0);
