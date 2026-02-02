/**
 * Session 인증 미들웨어
 *
 * 【학습 개념: Session 인증 vs JWT 인증】
 *
 * Session 방식:
 * 1. 로그인 시 서버에서 세션 생성, Session ID를 쿠키로 전송
 * 2. 이후 요청에서 쿠키의 Session ID로 서버 세션 조회
 * 3. 세션에 저장된 사용자 정보로 인증 확인
 *
 * JWT와의 차이:
 * - Session: 서버에서 상태 관리 (Stateful)
 * - JWT: 클라이언트가 토큰 보관 (Stateless)
 *
 * 【학습 개념: express-session 작동 방식】
 *
 * express-session 미들웨어가 하는 일:
 * 1. 요청이 들어오면 쿠키에서 Session ID 추출
 * 2. Session ID로 저장소(메모리/DB)에서 세션 데이터 조회
 * 3. req.session 객체에 세션 데이터 연결
 *
 * 우리가 할 일:
 * - 로그인 시: req.session.userId = user.id (세션에 사용자 정보 저장)
 * - 인증 확인: req.session.userId 존재 여부 확인
 * - 로그아웃 시: req.session.destroy() (세션 삭제)
 */

const { errors } = require('./errorHandler');
const UserModel = require('../modules/users/user.model');

/**
 * Session 인증 미들웨어
 *
 * 세션에 userId가 있으면 인증된 것으로 판단
 */
const authSession = async (req, res, next) => {
  try {
    // 세션이 없거나 userId가 없으면 미인증
    if (!req.session || !req.session.userId) {
      throw errors.unauthorized('로그인이 필요합니다');
    }

    // 사용자 정보 조회 (세션이 유효해도 사용자가 삭제됐을 수 있음)
    const user = await UserModel.findById(req.session.userId);

    if (!user) {
      // 사용자가 없으면 세션 무효화
      req.session.destroy();
      throw errors.unauthorized('사용자를 찾을 수 없습니다');
    }

    // req.user에 사용자 정보 저장
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 선택적 Session 인증 미들웨어
 * 세션이 있으면 사용자 정보를 설정하고, 없어도 에러를 발생시키지 않습니다
 */
const optionalAuthSession = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await UserModel.findById(req.session.userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 에러가 발생해도 계속 진행
    next();
  }
};

module.exports = {
  authSession,
  optionalAuthSession,
};
