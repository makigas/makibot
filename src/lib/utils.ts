import { homedir } from "os";
import { join } from "path";

export function getConfigDirectory() {
  if (process.env.XDG_CONFIG_HOME != "") {
    return process.env.XDG_CONFIG_HOME;
  } else {
    return join(homedir(), ".config");
  }
}
