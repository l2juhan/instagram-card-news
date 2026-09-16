'use strict';

/**
 * cs-doodle 템플릿 빌더 진입점. 실제 로직은 scripts/doodle/build-core.js(테마 공통 코어)
 * + scripts/doodle/themes/cs-doodle.js(팔레트·스프라이트·추가 타입)에 있다. 이 파일은
 * `node scripts/build-cs-doodle.js` 명령을 그대로 유지하기 위한 얇은 진입점이다.
 *
 *   node scripts/build-cs-doodle.js
 */
const { build } = require('./doodle/build-core.js');
const theme = require('./doodle/themes/cs-doodle.js');

if (require.main === module) {
  build(theme);
}

module.exports = { build: () => build(theme) };
