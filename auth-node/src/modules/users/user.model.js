/**
 * User 모델 - 데이터베이스 작업을 담당
 *
 * 【학습 개념: 모델(Model)이란?】
 * MVC 패턴에서 Model은 데이터와 비즈니스 로직을 담당합니다.
 * - 데이터베이스 CRUD (Create, Read, Update, Delete)
 * - 데이터 유효성 검사
 * - 비즈니스 규칙 적용
 *
 * 【학습 개념: Parameterized Query로 SQL Injection 방지】
 *
 * ❌ 위험한 방식 (SQL Injection 취약):
 * const query = `SELECT * FROM users WHERE email = '${email}'`;
 *
 * 만약 email이 "'; DROP TABLE users; --" 라면?
 * → SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
 * → 테이블이 삭제됩니다!
 *
 * ✅ 안전한 방식 (Parameterized Query):
 * const query = 'SELECT * FROM users WHERE email = $1';
 * pool.query(query, [email]);
 *
 * → $1 자리에 email 값이 안전하게 바인딩됩니다
 * → 특수 문자가 있어도 문자열로만 처리됩니다
 */

const { pool } = require('../../config/database');
const { hashPassword } = require('../../utils/password');

class UserModel {
  /**
   * 새 사용자 생성
   * @param {Object} userData - { email, password, name }
   * @returns {Object} - 생성된 사용자 (비밀번호 제외)
   */
  static async create({ email, password, name }) {
    // 비밀번호를 해싱합니다 (평문 저장 절대 금지!)
    const hashedPassword = await hashPassword(password);

    // Parameterized Query: $1, $2, $3에 값이 안전하게 바인딩됩니다
    const query = `
      INSERT INTO users (email, password, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `;
    // RETURNING: INSERT 후 생성된 데이터를 바로 반환 (PostgreSQL 기능)

    const values = [email, hashedPassword, name];
    const result = await pool.query(query, values);

    // 비밀번호는 반환하지 않습니다 (보안)
    return result.rows[0];
  }

  /**
   * 이메일로 사용자 찾기
   * @param {string} email - 검색할 이메일
   * @returns {Object|null} - 사용자 정보 또는 null
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    return result.rows[0] || null;
  }

  /**
   * ID로 사용자 찾기
   * @param {number} id - 검색할 사용자 ID
   * @returns {Object|null} - 사용자 정보 (비밀번호 제외) 또는 null
   */
  static async findById(id) {
    // 비밀번호는 조회하지 않습니다 (보안)
    const query = `
      SELECT id, email, name, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  /**
   * 이메일 중복 확인
   * @param {string} email - 확인할 이메일
   * @returns {boolean} - 중복 여부
   */
  static async emailExists(email) {
    const query = 'SELECT id FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    return result.rows.length > 0;
  }

  /**
   * 사용자 정보 업데이트
   * @param {number} id - 사용자 ID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Object|null} - 업데이트된 사용자 정보
   */
  static async update(id, updateData) {
    const { name } = updateData;

    const query = `
      UPDATE users
      SET name = COALESCE($1, name), updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, name, created_at, updated_at
    `;
    // COALESCE: 첫 번째 NULL이 아닌 값 반환
    // → $1이 null이면 기존 name 유지

    const result = await pool.query(query, [name, id]);

    return result.rows[0] || null;
  }

  /**
   * 비밀번호 변경
   * @param {number} id - 사용자 ID
   * @param {string} newPassword - 새 비밀번호 (평문)
   * @returns {boolean} - 성공 여부
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await hashPassword(newPassword);

    const query = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE id = $2
    `;
    const result = await pool.query(query, [hashedPassword, id]);

    return result.rowCount > 0;
  }
}

module.exports = UserModel;
