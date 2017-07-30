import { Service, mapService } from "../Service";

/** Quick 2-digit number padding implementation for date/time formatting */
let d2 = (n: number) => n < 10 ? "0" + n : String(n);

/** Quick 4-digit number padding implementation for year formatting */
function d4(n: number) {
    var s = String(d4);
    return "000".slice(0, Math.max(3 - s.length, 0)) + s;
};

/** String splitter for day/month names */
let capSplit = (s: string) => s.split(/(?=[A-Z])/);

/** English weekday names */
let dayNames = capSplit("SundayMondayTuesdayWednesdayThursdayFridaySaturday");

/** English abbreviated weekday names */
let dayNamesAbbr = capSplit("SunMonTueWedThuFriSat");

/** English month names */
let monthNames = capSplit("JanuaryFebruaryMarchAprilMayJuneJulyAugustSeptemberOctoberNovemberDecember");

/** English abbreviated month names */
let monthNamesAbbr = capSplit("JanFebMarAprMayJunJulAugSepOctNovDec");

/** Base culture service (mapped on `culture-neutral` and `culture` initially); to be overridden with a language and region specific culture service, mapped as `culture-xx-YY/zz`, and aliased as `culture` using `addServiceAlias` to set as the current culture */
@mapService("culture-neutral", "culture")
export class CultureService extends Service {
    /** The name of this culture, defaults to "none" but should be set to _languagecode-countrycode/regioncode_ and/or shorter forms such as _languagecode-countrycode_ and _languagecode_ */
    public readonly name = "neutral";

    /** Text flow direction for this culture's language, either `ltr` or `rtl`, or undefined (platform default) */
    public readonly textFlowDirection?: "ltr" | "rtl";

    /** Translate given text (may include placeholders and prefixes used by `UI.tl`) */
    public translateText(text: string) {
        return text;
    }

    /** Pluralize text based on given number and substitution form(s); defaults to English singular/plural rules without automatic pluralization (i.e. both singular and plural forms need to be specified in the placeholder) */
    public pluralizeText(n: number, forms: string[]) {
        return (n > 1 || n < -1) ? (forms[1] || forms[0]) : forms[0];
    }

    /** Returns given number formatted using culture specific rules, and using given precision (i.e. fixed number of decimals to display e.g. `2.00`, and/or rounding at given number of decimals, default 8, to avoid binary-to-decimal rounding errors such as `1.99999999`...); default implementation uses decimal point (`.`) and no thousands separators, but may revert to scientific notation for numbers with more than 20 digits (platform default) */
    public formatNumber(n: number | string, fixedDecimals?: number, roundDecimals = 8) {
        if (typeof n !== "number") n = parseFloat(n);
        if (roundDecimals! >= 0) {
            var factor = 1;
            while (roundDecimals!--) factor *= 10;
            n = Math.round(n * factor) / factor;
        }
        return fixedDecimals! >= 0 ? n.toFixed(fixedDecimals) : String(n);
    }

    /** Returns given number formatted as a currency, with given currency symbol and fixed number of decimals; defaults to "$", non-breaking space, and number with 2 fixed decimals; specific culture implementations should override defaults but still accept the same arguments */
    public formatCurrency(n: number | string, currencySymbol = "$", fixedDecimals = 2) {
        return currencySymbol + "\xa0" + this.formatNumber(n, fixedDecimals);
    }

    /** Returns given number formatted as a percentage, with given percentage symbol and fixed number of decimals; defaults to number without fixed decimals and "%" character; specific culture implementations should override defaults but still accept the same arguments */
    public formatPercentage(n: number | string, percSymbol = "%", fixedDecimals?: number) {
        return this.formatNumber(n, fixedDecimals) + percSymbol;
    }

    /** Collection of date/time formatters specific to this culture, used by `.formatDateTime`; defaults to a mostly international English format; replacement algorithm requires inclusion of all lengths of possible placeholders (including e.g. `yyy` and `%`) */
    protected readonly dateTimeFormatters: CultureService.DateTimeFormatters = {
        "d": d => d.getDate().toString(),
        "dd": d => d2(d.getDate()),
        "ddd": d => dayNamesAbbr[d.getDay()],
        "dddd": d => dayNames[d.getDay()],
        "h": d => (d.getHours() % 12 || 12).toString(),
        "hh": d => d2(d.getHours() % 12 || 12),
        "H": d => d.getHours().toString(),
        "HH": d => d2(d.getHours()),
        "m": d => d.getMinutes().toString(),
        "mm": d => d2(d.getMinutes()),
        "M": d => String(d.getMonth() + 1),
        "MM": d => d2(d.getMonth() + 1),
        "MMM": d => monthNamesAbbr[d.getMonth()],
        "MMMM": d => monthNames[d.getMonth()],
        "s": d => d.getSeconds().toString(),
        "ss": d => d2(d.getSeconds()),
        "t": d => (d.getHours() < 12 ? "a" : "p"),
        "tt": d => (d.getHours() < 12 ? "AM" : "PM"),
        "y": d => String(d.getFullYear() % 100),
        "yy": d => d2(d.getFullYear() % 100),
        "yyy": d => d2(d.getFullYear() % 100),
        "yyyy": d => d.getFullYear().toString(),
        "/": () => "/",
        ":": () => ":",
        "%": () => "",
        "%d": (d, s) => s.formatDateTime(d, "d/M/y"),
        "%dd": (d, s) => s.formatDateTime(d, "d MMM yyyy"),
        "%ddd": (d, s) => s.formatDateTime(d, "d MMMM yyyy"),
        "%dddd": (d, s) => s.formatDateTime(d, "dddd, d MMMM yyyy"),
        "%t": (d, s) => s.formatDateTime(d, "h:mm tt"),
        "%tt": (d, s) => s.formatDateTime(d, "h:mm:ss tt"),
        "%T": (d, s) => s.formatDateTime(d, "H:mm"),
        "%TT": (d, s) => s.formatDateTime(d, "H:mm:ss"),
    }

    /** Returns given date/time formatted using given format string (e.g. `dd/MMM/yyyy HH:mm`) using the following default placeholders, which may be (re-) defined by the culture service (defaults to `%dd %t`):
     * * `%d`: short date, e.g. 20/1/17,
     * * `%dd`: medium date, e.g. 20 Jan 2017
     * * `%ddd`: long date, e.g. 20 January 2017
     * * `%dddd`: full date, e.g. Friday, 20 January 2017
     * * `%t`: time, e.g. 2:20 PM
     * * `%tt`: time with seconds, e.g. 2:20:00 PM
     * * `%T`: 24-hour time, e.g. 14:20
     * * `%TT`: 24-hour time with seconds, e.g. 14:20:00
     * * `d`: date 0-31,
     * * `dd`: date 00-31,
     * * `ddd`: abbreviated weekday name,
     * * `dddd`: full weekday name,
     * * `h`: hours 0-12,
     * * `hh`: hours 00-12,
     * * `H`: hours 0-23,
     * * `HH`: hours 00-23,
     * * `m`: minutes 0-59,
     * * `mm`: minutes 00-59,
     * * `M`: month 0-12,
     * * `MM`: month 00-12,
     * * `MMM`: abbreviated month name,
     * * `MMMM`: full month name,
     * * `s`: seconds 0-59,
     * * `ss`: seconds 00-59,
     * * `t`: a/p,
     * * `tt`: AM/PM,
     * * `y`: year 0-99,
     * * `yy`: year 00-99,
     * * `yyyy`: year 0000-9999,
     * * `/`: date separator,
     * * `:`: time separator
     */
    public formatDateTime(d: Date, format = "%dd %t") {
        var result = "";
        for (var i = 0, len = format.length; i < len; i++) {
            if (format[i] === "\\") {
                result += format[i + 1] || "";
                continue;
            }
            for (var j = i, buf = "";
                j < len && this.dateTimeFormatters[buf + format[j]];)
                buf += format[j++];
            if (buf) {
                result += this.dateTimeFormatters[buf](d, this);
                i = j - 1;
                continue;
            }
            result += format[i];
        }
        return result;
    }
}

export namespace CultureService {
    /** Collection of date/time formatter function, indexed by placeholder name (e.g. `M`, `MM`, `MMM`), which return the relevant string representation of a given date argument */
    export interface DateTimeFormatters {
        /** Returns the relevant string representation of given date */
        [s: string]: (this: DateTimeFormatters, d: Date, s: CultureService) => string;
    }
}
