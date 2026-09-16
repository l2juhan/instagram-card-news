'use strict';

/**
 * roughjs UMD 번들과 변환 스크립트를 <script> 태그 하나로 합쳐서 반환한다.
 * CDN src= 대신 파일 내용을 그대로 문서에 심으므로 렌더링 시 네트워크 요청이 없다.
 */
const fs = require('fs');
const path = require('path');
const { SOURCE } = require('./convert-client.js');

const ROUGH_BUNDLE_PATH = path.join(__dirname, '..', '..', 'node_modules', 'roughjs', 'bundled', 'rough.js');

function doodleScriptTag() {
  const roughBundle = fs.readFileSync(ROUGH_BUNDLE_PATH, 'utf8');
  return `<script>${roughBundle}\n${SOURCE}</script>`;
}

function objectSpriteMarkup() {
  const sprite = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'doodle', 'objects', 'sprite.svg'), 'utf8');
  const inner = sprite.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg style="display:none" aria-hidden="true">${inner}</svg>`;
}

module.exports = { doodleScriptTag, objectSpriteMarkup };
