/**
 * 입력 검증 규칙 - express-validator 사용
 *
 * 【학습 개념: 입력 검증의 중요성】
 *
 * 왜 서버에서도 검증해야 할까요?
 *
 * 1. 클라이언트 검증은 우회 가능
 *    - 브라우저 개발자 도구로 쉽게 비활성화
 *    - API를 직접 호출하면 검증 없음
 *
 * 2. 보안 위협 방지
 *    - SQL Injection: email: "'; DROP TABLE users; --"
 *    - XSS: name: "<script>alert('hack')</script>"
 *
 * 3. 데이터 무결성
 *    - 잘못된 형식의 데이터가 DB에 저장되는 것 방지
 *
 * 【학습 개념: express-validator 사용법】
 *
 * 기본 구조:
 * 1. 검증 규칙 정의 (체이닝 방식)
 * 2. validationResult()로 에러 확인
 * 3. 에러가 있으면 400 응답
 *
 * 체이닝 예시:
 * body('email')           // req.body.email 검증
 *   .isEmail()            // 이메일 형식 확인
 *   .normalizeEmail()     // 소문자 변환, 공백 제거
 *   .withMessage('...')   // 검증 실패 시 메시지
 */

const { body, validationResult } = require('express-validator');
const { errors } = require('../../middlewares/errorHandler');

/**
 * 검증 결과 처리 미들웨어
 * 검증 규칙 배열 뒤에 추가하여 사용
 */
const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    // 첫 번째 에러 메시지만 반환 (또는 모든 에러 반환 가능)
    const firstError = validationErrors.array()[0];

    // 모든 에러를 보려면:
    // const allErrors = errors.array().map(err => err.msg);

    return next(errors.badRequest(firstError.msg));
  }

  next();
};

/**
 * 회원가입 검증 규칙
 */
const registerValidation = [
  // 이메일 검증
  body('email')
    .trim()                          // 앞뒤 공백 제거
    .notEmpty().withMessage('이메일을 입력해주세요')
    .isEmail().withMessage('올바른 이메일 형식이 아닙니다')
    .normalizeEmail()                // 소문자로 정규화
    .isLength({ max: 255 }).withMessage('이메일은 255자 이하여야 합니다'),

  // 비밀번호 검증
  body('password')
    .notEmpty().withMessage('비밀번호를 입력해주세요')
    .isLength({ min: 8 }).withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/[A-Z]/).withMessage('비밀번호에 대문자가 포함되어야 합니다')
    .matches(/[a-z]/).withMessage('비밀번호에 소문자가 포함되어야 합니다')
    .matches(/[0-9]/).withMessage('비밀번호에 숫자가 포함되어야 합니다'),

  // 비밀번호 확인 검증
  body('confirmPassword')
    .notEmpty().withMessage('비밀번호 확인을 입력해주세요')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('비밀번호가 일치하지 않습니다');
      }
      return true;
    }),

  // 이름 검증
  body('name')
    .trim()
    .notEmpty().withMessage('이름을 입력해주세요')
    .isLength({ min: 2, max: 100 }).withMessage('이름은 2-100자 사이여야 합니다')
    // XSS 방지: HTML 태그 제거
    .escape(),

  // 검증 에러 처리
  handleValidationErrors,
];

/**
 * 로그인 검증 규칙
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('이메일을 입력해주세요')
    .isEmail().withMessage('올바른 이메일 형식이 아닙니다')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('비밀번호를 입력해주세요'),

  handleValidationErrors,
];

/**
 * 토큰 갱신 검증 규칙
 */
const refreshValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh Token이 필요합니다'),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
  handleValidationErrors,
};
