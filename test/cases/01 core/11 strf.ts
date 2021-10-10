import { strf, I18nString } from "../../../dist";

consider("String formatting", () => {
  it("returns an I18nString", t => {
    t.test(strf("abc") instanceof I18nString);
  });
  it("can output a format string on its own", t => {
    t.test(strf("abc").toString() === "abc");
  });
  it("can format string values", t => {
    t.test(strf("abc %s ghi", "def").toString() === "abc def ghi");
  });
  it("can format numbers", t => {
    t.test(strf("abc %n def", 5.000000001).toString() === "abc 5 def");
  });
  it("strips literal %", t => {
    t.test(strf("%s%%%s", "1", "2").toString() === "1%2");
  });
});
