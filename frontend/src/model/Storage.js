import { v4 } from "uuid";
import { createEmail } from "../utils/tools";

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
    this.get().uuid || (this.uuid = v4());
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
