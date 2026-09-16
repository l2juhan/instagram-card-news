'use strict';

/**
 * cs-doodle 테마 설정. build-cs-doodle.js 원본이 하드코딩하던 값을 그대로 옮긴 것이며,
 * cssRootExtra/cssRoleClasses/onDarkCss는 원본 문자열을 한 글자도 바꾸지 않고 그대로
 * 박아 뒀다 — build-core.js가 이 값들로 만든 출력이 원본과 바이트 단위로 같아야 한다.
 */
module.exports = {
  name: 'cs-doodle',
  generatedBy: 'scripts/build-cs-doodle.js',
  tokens: {
    paper: '#F6F2EA',
    surface: '#ECE5D8',
    ink: '#16171B',
    inkSoft: '#4A4B53',
    rule: '#CFC6B6',
  },
  cssRootExtra:
    '  --k-pub: #7A5800;\n' +
    '  --k-a: #AE3226;\n' +
    '  --k-b: #1F5FA8;\n' +
    '  --k-a2: #9E4A0E;\n' +
    '  --k-b2: #2A6A3B;\n' +
    '  --k-ab: #6B4226;\n' +
    '  --k-threat: #6A3491;',
  cssRoleClasses:
    '.k-pub { color: var(--k-pub); } .k-a { color: var(--k-a); } .k-b { color: var(--k-b); }\n' +
    '.k-a2 { color: var(--k-a2); } .k-b2 { color: var(--k-b2); } .k-ab { color: var(--k-ab); }\n' +
    '.k-threat { color: var(--k-threat); } .ink { color: var(--ink); } .soft { color: var(--ink-soft); }',
  onDarkCss:
    '\n.on-dark { --ink: #F6F2EA; --ink-soft: #D6CFC2; --rule: rgba(246, 242, 234, 0.3); --surface: rgba(246, 242, 234, 0.12); }\n' +
    '.on-dark .card { background: #16171B; }\n' +
    '.on-dark .note-mark { background: #F6F2EA; color: #16171B; }\n',
  spriteFiles: ['sprite.svg'],
  extraTypes: {},
};
