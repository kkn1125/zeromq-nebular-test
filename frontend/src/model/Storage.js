import { v4 } from "uuid";

class Storage {
  uuid;
  email;
  locale;
  pool_socket;
  pool_publish;
  constructor() {
    if (!localStorage.getItem("user_info")) {
      localStorage.setItem("user_info", JSON.stringify({}));
    }
    this.apply();
    if (!this.get().uuid) {
      this.uuid = v4();
      this.locale = navigator.language;
    }
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
