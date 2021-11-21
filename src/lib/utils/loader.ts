import requireAll from "require-all";

type MightBeModule = {
  default?: unknown;
};

/**
 * requireAll() will require ES Modules that export default something as
 * an object where the default exported symbol is inside an object with
 * the key "default". This function will coerce something required by
 * requireAll() so that default exports can be properly used as if they
 * were exported using the classic module.exports system.
 *
 * @param module a required module that might or might not be an ES Module.
 * @returns something that it is not an ES Module.
 */
function coerceModules(module: MightBeModule): unknown {
  if (module.default && typeof module.default === "function") {
    return module.default;
  }
  return module;
}

/**
 * Mass-require all the files in the given directory. Internally uses
 * requireAll, but this function already handles the case of ES Modules
 * being present in the directory.
 *
 * @param path the path where the modules have to be loaded
 * @returns an array with all the required modules from this directory
 */
export function requireAllModules<T>(path: string): unknown[] {
  const required = requireAll({
    dirname: path,
    filter: /^([^.].*)\.[jt]s$/,
    resolve: coerceModules,
  });
  return Object.values<T>(required);
}
