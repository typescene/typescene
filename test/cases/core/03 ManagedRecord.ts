import { ManagedRecordValidationError } from "../../../dist";

consider("ManagedRecordValidationError", () => {
    it("can be created using a string", t => {
        let err = new ManagedRecordValidationError("TEST");
        if (!err.isValidationError) t.fail();
        if (err.errors.length !== 1) t.fail();
        t.assert(/TEST/.test(String(err.errors)));
    })

    it("can be created using an Error object", t => {
        let err = new ManagedRecordValidationError(Error("TEST"));
        t.assert(/TEST/.test(String(err.errors)));
    })

    it("can be created using other validation errors", t => {
        let err1 = new ManagedRecordValidationError("TEST");
        let err2 = new ManagedRecordValidationError(
            "TEST", Error("TEST"));
        let result = new ManagedRecordValidationError(err1, err2);
        t.assert(result.errors.length === 3);
    })
})
