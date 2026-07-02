// Directional smoke tests for the analysis engine: AI-sludge copy must score
// high on cliché and low on originality; concrete, credit-driven copy the
// reverse. Run with: npm test

const assert = require('assert');
const { analyze } = require('../lib/analyzer');

const AI_SLUDGE = `
Welcome to Apex Sound Studios — where the magic happens. In today's fast-paced
music industry, standing out from the crowd is more important than ever. Whether
you're a seasoned professional or just starting out on your musical journey, our
state-of-the-art facility is here to elevate your sound and take your music to
the next level. We don't just record music — we craft sonic journeys. Our
world-class team is passionate about music and dedicated to excellence,
seamlessly blending cutting-edge technology with a wealth of experience to
unlock your full potential. From concept to completion, we bring your creative
vision to life. Our services are a testament to our commitment — mixing,
mastering, and production, meticulously crafted with passion. Rest assured, your
music deserves the perfect blend of artistry and innovation. Look no further —
unleash your creativity with us and leave a lasting impression on your
listeners. Contact us today for professional quality results at affordable rates.
All genres welcome — no project is too big or small!
`;

const STANDOUT_COPY = `
I mix records at my studio in East Nashville, built in 2011 around a 32-channel
Neve 8058 and a pair of ATC SCM45s. The outboard rack holds two 1176s, an LA-2A,
a Distressor pair, and a Bricasti M7; drums usually go through Coles 4038
overheads and an RE-20 on kick. Since 2009 I've mixed over 300 records,
including two RIAA gold singles and an album that hit #4 on the Billboard
Americana chart. Selected credits and my full discography are on Discogs at
discogs.com/artist/example. Mixing is $600 per song, delivered in five business
days with two revisions included, plus instrumental and TV mix versions at
24-bit / 96 kHz. Mastering for vinyl pre-master and DDP delivery is available.
`;

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok    ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('AI-sludge fixture:');
const bad = analyze(AI_SLUDGE);
console.log(`  scores: ${JSON.stringify(bad.scores)} verdict: ${bad.verdict}`);
check('cliché score is high (≥55)', bad.scores.cliche >= 55, `got ${bad.scores.cliche}`);
check('verdict is AI-cliché heavy', bad.verdict === 'AI-cliché heavy', `got ${bad.verdict}`);
check('originality is low (<40)', bad.scores.originality < 40, `got ${bad.scores.originality}`);
check('finds "elevate your sound"', bad.findings.cliches.some((f) => f.id === 'elevate'));
check('finds "look no further"', bad.findings.cliches.some((f) => f.id === 'look-no-further'));
check('finds generic "affordable rates"', bad.findings.generic.some((f) => f.id === 'affordable'));
check('finds generic "all genres"', bad.findings.generic.some((f) => f.id === 'all-genres'));

console.log('Standout fixture:');
const good = analyze(STANDOUT_COPY);
console.log(`  scores: ${JSON.stringify(good.scores)} verdict: ${good.verdict}`);
check('standout score is high (≥45)', good.scores.standout >= 45, `got ${good.scores.standout}`);
check('verdict is Standout', good.verdict === 'Standout', `got ${good.verdict}`);
check('cliché score is low (<20)', good.scores.cliche < 20, `got ${good.scores.cliche}`);
check('finds named console', good.findings.standout.some((f) => f.id === 'console'));
check('finds outboard gear', good.findings.standout.some((f) => f.id === 'outboard'));
check('finds awards', good.findings.standout.some((f) => f.id === 'awards'));
check('finds transparent pricing', good.findings.standout.some((f) => f.id === 'pricing'));
check('finds verifiable credit link', good.findings.standout.some((f) => f.id === 'verified-credits'));

console.log('Ordering:');
check('standout copy out-scores sludge on originality',
  good.scores.originality > bad.scores.originality + 30,
  `${good.scores.originality} vs ${bad.scores.originality}`);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
