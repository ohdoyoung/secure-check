package com.chwiyakhaenne.model;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CodeFileValidationTest {

    @Test
    void allowsEmptyContentSoBlankProjectFilesDoNotRejectWholeRequest() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();

            assertThat(validator.validate(new CodeFile("backend/__init__.py", "Python", ""))).isEmpty();
            assertThat(validator.validate(new CodeFile("backend/app.py", "Python", null)))
                    .extracting(violation -> violation.getPropertyPath().toString())
                    .contains("content");
        }
    }
}
