import { ERROR, err } from "../errors";
import { logUnhandledException } from "./UnhandledErrorEmitter";
import { I18nService } from "./I18nService";

/** @internal Format a string with a series of parameters, like C-style sprintf */
export function sprintf(format: string, args: any[]) {
  let idx = 0;
  return format.replace(
    /\%(?:(\d+)\$)?(\{[^\}]*\}|[-+*.0-9 ]*[%a-zA-Z])/g,
    (_str, param, fmt) => {
      // special case %s as most common option
      if (fmt === "s") {
        return String((param ? args[param - 1] : args[idx++]) ?? "");
      }

      // find value, and return formatted result as a string
      fmt = fmt.replace(/\*/g, () => String(args[idx++]));
      let value = param ? args[param - 1] : args[idx++];
      let result = formatValue(fmt, value);
      if (typeof result === "object") {
        if (result.toString === Object.prototype.toString) {
          logUnhandledException(err(ERROR.Format_ObjectType));
          return "???";
        }
        if (
          result.toString === Array.prototype.toString &&
          result.map === Array.prototype.map
        ) {
          return (result as any[]).map(s => (s != null && String(s)) || "").join(", ");
        }
      }
      return String(result ?? "");
    }
  );
}

/** @internal Format given value according to spec (part after %-sign of sprintf formatter, e.g. s, 08i, {uc}, {local:date}); does NOT necessarily return a string value */
export function formatValue(format: string, value: any): any {
  if (format[0] === "{") format = format.slice(1, -1);

  // parse formatting spec or use formatter function
  let match = format.match(/^([-0+ ]+)?(\d+)?(\.\d+)?([%diufFeEgGxXsc])$/);
  if (!match) {
    // use formatter function from lookup table
    let split = format.split(":");
    let formatter = _filters[split.shift()!];
    if (!formatter) {
      logUnhandledException(err(ERROR.Format_Type, format));
      return "???";
    }
    return formatter(value, ...split);
  } else {
    let [, flags, width, dotprec, type] = match;

    // parse flags, if any
    let leftAlign: boolean | undefined;
    let positivePrefix: string | undefined;
    let padPrefix: string | undefined;
    if (flags) {
      if (flags.indexOf("-") >= 0) leftAlign = true;
      else if (flags.indexOf("0") >= 0) padPrefix = "0";
      if (flags.indexOf("+") >= 0) positivePrefix = "+";
      else if (flags.indexOf(" ") >= 0) positivePrefix = " ";
    }

    // parse width and precision, if any
    let w = +width || 0;
    let p = dotprec ? +dotprec.slice(1) || 0 : undefined;

    // format number or string
    let s: string;
    switch (type) {
      case "%":
        return "%";
      case "d":
      case "i":
      case "u":
        return _alignFmtNum(
          String(Math.round(Math.abs(+value)) || 0),
          value < 0,
          w,
          leftAlign,
          positivePrefix,
          padPrefix
        );
      case "f":
      case "F":
        s = _alignFmtNum(
          Math.abs(+value).toFixed(p),
          value < 0,
          w,
          leftAlign,
          positivePrefix,
          padPrefix
        );
        if (p === undefined) s = s.replace(/0+$/, "0");
        return type === "F" ? s.toUpperCase() : s;
      case "e":
      case "E":
        s = _alignFmtNum(
          Math.abs(+value).toExponential(p),
          value < 0,
          w,
          leftAlign,
          positivePrefix,
          padPrefix
        );
        return type === "E" ? s.toUpperCase() : s;
      case "g":
      case "G":
        s = _alignFmtNum(
          Math.abs(+value).toString(),
          value < 0,
          w,
          leftAlign,
          positivePrefix,
          padPrefix
        );
        return type === "G" ? s.toUpperCase() : s;
      case "x":
      case "X":
        s = _alignFmtNum(
          Math.abs(+value || 0).toString(16),
          value < 0,
          w,
          leftAlign,
          positivePrefix,
          padPrefix
        );
        return type === "X" ? s.toUpperCase() : s;
      case "c":
        value = value == null ? "" : String.fromCharCode(+value);
      case "s":
        s = String(value ?? "");
        if (w > 0) s = leftAlign ? _alignLeft(s, w) : _alignRight(s, w, " ");
        if (p! > 0) s = s.slice(0, p);
        return s;
    }
  }
}

/** Return a fully formatted string containing given number */
function _alignFmtNum(
  s: string,
  neg: boolean,
  width: number,
  leftAlign?: boolean,
  positivePrefix?: string,
  padPrefix?: string
) {
  let prefix = neg ? "-" : positivePrefix || "";
  if (leftAlign) return _alignLeft(prefix + s, width);
  if (!padPrefix || !/^[\da-f]/.test(s)) padPrefix = " ";
  if (prefix) return prefix + _alignRight(s, width - 1, padPrefix);
  let i18n = I18nService.get();
  if (i18n && i18n.decimalSeparator !== ".") {
    s = s.replace(".", i18n.decimalSeparator);
  }
  return _alignRight(s, width, padPrefix || " ");
}

/** Left-align given text */
function _alignLeft(str: string, width: number) {
  if (str.length >= width) return str;
  for (let i = str.length; i < width; i++) str += " ";
  return str;
}

/** Right-align given text */
function _alignRight(str: string, width: number, prefix: string) {
  if (str.length >= width) return str;
  for (let i = str.length; i < width; i++) str = prefix + str;
  return str;
}

/** List of filter functions */
const _filters: { [id: string]: (v: any, ...args: any[]) => any } = {
  "_": () => undefined,
  "!": v => !v,
  "not?": v => !v,
  "?": v => !!v,
  "!!": v => !!v,
  "n": v => +v,
  "num": v => +v,
  "or": (v, alt) => v || alt,
  "then": (v, a, b) => (v && a) || b,
  "uc": _ucFilter,
  "lc": _lcFilter,
  "uniq": _uniqueFilter,
  "pluck": _pluckFilter,
  "local": _i18nFilter,
};

// filter helper functions:
function _ucFilter(d: any) {
  if (d == null) return d;
  return String(d).toUpperCase();
}
function _lcFilter(d: any) {
  if (d == null) return d;
  return String(d).toLowerCase();
}
function _uniqueFilter(d: any) {
  if (!Array.isArray(d)) {
    if (d && d.toArray) {
      d = d.toArray();
      if (!Array.isArray(d)) return d;
    } else {
      return d;
    }
  }
  let values: any[] = [];
  let strings: any = Object.create(null);
  return d.filter(v => {
    if (v == undefined) return false;
    if (typeof v === "string") {
      if (strings[v]) return false;
      return (strings[v] = true);
    }
    if (values.indexOf(v) >= 0) return false;
    values.push(v);
    return true;
  });
}
function _pluckFilter(d: any, p: string) {
  if (!Array.isArray(d)) {
    if (d && d.toArray) {
      d = d.toArray();
      if (!Array.isArray(d)) return d;
    } else {
      return d;
    }
  }
  return (d as any[]).map(v => v && v[p]);
}
function _i18nFilter() {
  let i18n = I18nService.get();
  return i18n ? i18n.format.apply(i18n, arguments as any) : "???";
}
