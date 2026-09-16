'use strict';

/**
 * cs-doodle 채택 방향: A. 볼펜 낙서 — 색펜 아웃라인 + 채색 최소.
 * 이 숫자는 scripts/doodle/convert-client.js의 브라우저용 사본과 반드시 같아야 한다
 * (Node와 브라우저 양쪽에서 rough.js를 쓰지만 모듈을 공유할 수 없어 값만 맞춘다).
 */
module.exports = {
  roughness: 1.4,
  bowing: 0.9,
  strokeWidth: 6.5,
  // rough.js maxRandomnessOffset은 절대 px값이라 도형이 커도 안 커진다. 기본값(2px)으로
  // 두면 1080px 캔버스의 큰 도형(진행바, 박스 아웃라인)이 거의 안 흔들려 보인다.
  maxRandomnessOffset: 7,
  // 채색이 꼭 필요한 소형 요소(화살촉, 체크 등)에 한해 옵트인으로 쓰는 얇은 해쳐 채움
  accentFillWeight: 2.2,
  accentHachureGap: 30,
};
