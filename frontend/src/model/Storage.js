import { v4 } from "uuid";
import { createEmail } from "../utils/tools";

/**
 * @class 사용자 정보 스토리지
 * @param {string} uuid - 사용자 uuid
 * @param {string} email - 사용자 email
 * @param {string} locale - 사용자 지역, 나라
 * @param {object} pool_socket - 사용자 연결 소켓
 * @param {string} pool_socket.ip - 사용자 연결 소켓 ip
 * @param {number} pool_socket.port - 사용자 연결 소켓 port
 * @param {object} pool_publisher - 사용자 연결 퍼블리셔
 * @param {string} pool_publisher.ip - 사용자 연결 퍼블리셔 ip
 * @param {number} pool_publisher.port - 사용자 연결 퍼블리셔 port
 */
class Storage {
  uuid;
  email;
  locale;
  pool_socket = {};
  pool_publisher = {};
  constructor() {
    if (!localStorage.getItem("user_info")) {
      localStorage.setItem("user_info", JSON.stringify({}));
    }
    this.apply();
    // this.get().uuid || (
    this.uuid = v4();
    // );
    this.get().locale || (this.locale = navigator.language);
    this.get().email || (this.email = createEmail());
    this.save();
  }
  apply() {
    Object.assign(this, this.get());
  }
  get() {
    return JSON.parse(localStorage.getItem("user_info"));
  }
  save() {
    localStorage.setItem("user_info", JSON.stringify(this.toJSON()));
  }
  toJSON() {
    return Object.fromEntries(Object.entries(this));
  }
}

export default Storage;
