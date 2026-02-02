/**
 * 비밀번호 보안 유틸리티 - bcrypt
 *
 * 【학습 개념: 해싱 vs 암호화】
 * - 암호화 (Encryption): 양방향, 복호화 가능
 *   예: AES로 암호화한 데이터는 키로 복호화 가능
 *
 * - 해싱 (Hashing): 단방향, 복호화 불가능
 *   예: bcrypt로 해싱한 비밀번호는 원본 복구 불가
 *   → 비밀번호 저장에는 해싱을 사용해야 합니다!
 *
 * 【학습 개념: bcrypt 작동 원리】
 *
 * 1. Salt (소금)
 *    - 각 비밀번호에 랜덤한 값을 추가합니다
 *    - 같은 비밀번호도 다른 해시값이 됩니다
 *    - Rainbow Table 공격 방지
 *
 * 2. Cost Factor (작업 인자)
 *    - 해싱에 걸리는 시간을 조절합니다
 *    - 숫자가 클수록 더 오래 걸림 (2^cost번 반복)
 *    - 10 = 약 0.1초, 12 = 약 0.3초
 *    - 무차별 대입 공격을 느리게 만듦
 *
 * 3. 해시 결과물 구조
 *    $2b$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrkHx6DGmXFq
 *    ├──┤├─┤├──────────────────────┤├──────────────┤
 *    알고리즘 cost     salt (22자)      hash (31자)
 *
 * 【학습 개념: Rainbow Table 공격】
 * - 미리 계산된 해시값 데이터베이스
 * - "password123" → "abc123..." 같은 매핑을 저장
 * - Salt가 없으면 해시값만으로 원래 비밀번호 추측 가능
 * - Salt를 사용하면 같은 비밀번호도 매번 다른 해시값!
 */

const bcrypt = require('bcrypt');

// Cost Factor 설정
// 10-12 정도가 적당 (보안과 성능의 균형)
const SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 * @param {string} plainPassword - 평문 비밀번호
 * @returns {Promise<string>} - 해싱된 비밀번호
 */
const hashPassword = async (plainPassword) => {
  // bcrypt.hash()는 내부적으로 salt를 생성하고 해싱합니다
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hashedPassword;
};

/**
 * 비밀번호 검증
 * @param {string} plainPassword - 사용자가 입력한 비밀번호
 * @param {string} hashedPassword - DB에 저장된 해시값
 * @returns {Promise<boolean>} - 일치 여부
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  // bcrypt.compare()는 해시에서 salt를 추출해서 비교합니다
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

/**
 * 비밀번호 강도 검증
 *
 * 【보안 규칙】
 * - 최소 8자 이상
 * - 대문자 포함
 * - 소문자 포함
 * - 숫자 포함
 * - 특수문자 포함 (선택사항으로 처리)
 *
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} - { isValid, errors }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호에 대문자가 포함되어야 합니다');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호에 소문자가 포함되어야 합니다');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호에 숫자가 포함되어야 합니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
};
