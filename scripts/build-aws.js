'use strict';

/**
 * aws 템플릿 빌더 진입점. scripts/doodle/build-core.js(테마 공통 코어) +
 * scripts/doodle/themes/aws.js(팔레트·스프라이트·content-code/content-console)로
 * templates/aws/를 생성한다.
 *
 *   node scripts/build-aws.js
 */
const { build } = require('./doodle/build-core.js');
const theme = require('./doodle/themes/aws.js');

if (require.main === module) {
  build(theme);
}

module.exports = { build: () => build(theme) };
