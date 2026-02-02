/**
 * JWT 인증 미들웨어
 *
 * 【학습 개념: 인증 미들웨어의 역할】
 *
 * 인증이 필요한 라우트 앞에서 토큰을 검증합니다:
 *
 * 요청 흐름:
 * Client → [authJWT 미들웨어] → Controller
 *           ↓
 *      토큰 검증 실패 → 401 응답
 *           ↓
 *      토큰 검증 성공 → req.user에 사용자 정보 저장 → 다음 미들웨어로
 *
 * 사용 예:
 * router.get('/me', authJWT, (req, res) => {
 *   res.json(req.user);  // 인증된 사용자 정보
 * });
 */

const { verifyAccessToken, extractTokenFromHeader } = require('../utils/token');
const { errors } = require('./errorHandler');
const UserModel = require('../modules/users/user.model');

/**
 * JWT 인증 미들웨어
 *
 * 1. Authorization 헤더에서 토큰 추출
 * 2. 토큰 검증
 * 3. 사용자 정보 조회
 * 4. req.user에 사용자 정보 저장
 */
const authJWT = async (req, res, next) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw errors.unauthorized('토큰이 제공되지 않았습니다');
    }

    // 2. 토큰 검증
    const verified = verifyAccessToken(token);

    if (!verified.success) {
      // 토큰 만료 vs 잘못된 토큰 구분
      if (verified.error === 'jwt expired') {
        throw errors.unauthorized('토큰이 만료되었습니다. 갱신이 필요합니다.');
      }
      throw errors.unauthorized('유효하지 않은 토큰입니다');
    }

    // 3. 사용자 정보 조회 (토큰이 유효해도 사용자가 삭제됐을 수 있음)
    const user = await UserModel.findById(verified.data.userId);

    if (!user) {
      throw errors.unauthorized('사용자를 찾을 수 없습니다');
    }

    // 4. req.user에 사용자 정보 저장
    // 이후 컨트롤러에서 req.user로 접근 가능
    req.user = user;

    // 다음 미들웨어/컨트롤러로 진행
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 선택적 JWT 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 에러를 발생시키지 않습니다
 * 로그인하지 않아도 접근 가능하지만, 로그인 시 추가 기능을 제공하는 경우 사용
 */
const optionalAuthJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const verified = verifyAccessToken(token);

      if (verified.success) {
        const user = await UserModel.findById(verified.data.userId);
        if (user) {
          req.user = user;
        }
      }
    }

    // 토큰이 없거나 유효하지 않아도 다음으로 진행
    next();
  } catch (error) {
    // 에러가 발생해도 계속 진행 (선택적 인증이므로)
    next();
  }
};

module.exports = {
  authJWT,
  optionalAuthJWT,
};
