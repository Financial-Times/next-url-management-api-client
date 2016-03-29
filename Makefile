include n.Makefile

.PHONY: test coverage

test: test-unit verify

test-unit:
	$(NPM_BIN_ENV); mocha

coverage:
	$(NPM_BIN_ENV); istanbul cover ./node_modules/.bin/_mocha
	open coverage/lcov-report/index.html
