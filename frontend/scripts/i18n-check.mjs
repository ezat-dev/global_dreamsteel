/* 한/영 사전 키 점검 — `npm run i18n:check`
 *
 * src/i18n/ko/*.json 과 en/*.json 의 키가 서로 맞는지 본다. 한쪽에만 키를 넣고 잊으면
 * 그 문구는 영어 화면에서 한국어로 나온다(오류는 안 나서 눈치채기 어렵다). 그걸 잡는다.
 * en/server.json은 사전이 아니라 바꿈표(백엔드 한글 문구 → 영어)라 짝이 없어도 된다.
 *
 * 문제가 있으면 목록을 찍고 종료 코드 1로 끝난다.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
const SKIP = new Set(['server.json']);

/** { a: { b: 'x' } } → ['a.b'] */
function keysOf(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object'
    ? keysOf(v, `${prefix}${k}.`)
    : [`${prefix}${k}`]));
}

const read = (lng, file) => JSON.parse(readFileSync(join(root, lng, file), 'utf8'));
const files = (lng) => readdirSync(join(root, lng)).filter((f) => f.endsWith('.json') && !SKIP.has(f));

let problems = 0;
const all = new Set([...files('ko'), ...files('en')]);
for (const file of [...all].sort()) {
  const inKo = files('ko').includes(file);
  const inEn = files('en').includes(file);
  if (!inKo || !inEn) {
    console.log(`✗ ${file}: ${inKo ? 'en' : 'ko'} 쪽 파일이 없습니다`);
    problems += 1;
    continue;
  }
  const ko = new Set(keysOf(read('ko', file)));
  const en = new Set(keysOf(read('en', file)));
  const onlyKo = [...ko].filter((k) => !en.has(k));
  const onlyEn = [...en].filter((k) => !ko.has(k));
  if (onlyKo.length || onlyEn.length) {
    problems += onlyKo.length + onlyEn.length;
    console.log(`✗ ${file}`);
    onlyKo.forEach((k) => console.log(`    영어에 없음: ${k}`));
    onlyEn.forEach((k) => console.log(`    한국어에 없음: ${k}`));
  } else {
    console.log(`✓ ${file} (${ko.size}개)`);
  }
}

if (problems) {
  console.log(`\n맞지 않는 곳 ${problems}개`);
  process.exit(1);
}
console.log('\n두 언어의 키가 모두 맞습니다.');
