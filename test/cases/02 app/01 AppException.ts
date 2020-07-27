import { AppException, I18nService } from "../../../dist";

consider("AppException", () => {
  it("can be created", t => {
    const MyError = AppException.type("TEST", "Test error");
    if (new MyError()) t.ok();
  });

  it("can be thrown", t => {
    const MyError = AppException.type("TEST", "Test error");
    t.assert(MyError.code === "TEST");
    try {
      throw new MyError();
    } catch (err) {
      t.assert(err.code === MyError.code);
      if (err.code === "TEST") t.ok();
    }
  });

  it("can translate messages", t => {
    // create an I18n service just for translating the error message
    class MyI18n extends I18nService {
      locale = "en-US";
      tt(value: any, _type: string) {
        if (value === "Test error $$") {
          return "$$ 123";
        }
        return value;
      }
      getNonTranslatable() {
        return {};
      }
    }

    // create an error and make sure its message gets translated
    new MyI18n().register();
    const MyError = AppException.type("TEST", "Test error $$");
    try {
      throw new MyError(456);
    } catch (err) {
      t.assert(err.message === "456 123", "Messsage is correct");
      t.ok();
    }
  });
});
