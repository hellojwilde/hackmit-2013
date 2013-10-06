var assert = require("assert");

var lexicon = require("../../lexer/lexicon.js");
var Lexer = require("../../lexer/lexer").Lexer;
var Tagger = require("../../lexer/tagger").POSTagger;
var Parser = require("../parser").Parser;

function parse(input) {
	var psr = new Parser();
	var tgr = new Tagger(lexicon.POSTAGGER_LEXICON, lexicon.LEXICON_TAG_MAP);

	var words = new Lexer().lex(input);
	var tagged = psr.tagConditional(psr.tagDates(tgr.tag(words)));
	return psr.parse(tagged);
}

describe("Parser", function () {
	describe("#parse", function () {
		// Time Conditions!
		it("tomorrow", function () {
			assert.deepEqual(parse("tomorrow"),
				{"condition":{"type":"time","subject":"time","verb":"is","to":"tomorrow"},"action":false});
		});

		it("day after tomorrow", function () {
			assert.deepEqual(parse("day after tomorrow"),
				{"condition":{"type":"time","subject":"time","verb":"is","to":"day after tomorrow"},"action":false});
		});

		// Actions!
		it("send an email to mary jane saying hello, mary!", function () {
			assert.deepEqual(parse("send an email to mary jane saying hello, mary!"),
				{"condition":false,"action":{"verb":"send","method":"email","recipient":"mary jane","content":"hello , mary !"}});
		});

		it("send an email saying hello to mary jane", function () {
			assert.deepEqual(parse("send an email saying hello to mary jane"),
				{"condition":false,"action":{"verb":"send","method":"email","content":"hello","recipient":"mary jane"}})
		});

		it("send hello to mary jane via email", function () {
			assert.deepEqual(parse("send hello to mary jane via email"),
				{"condition":false,"action":{"verb":"send","content":"hello","recipient":"mary jane","method":"email"}});
		});

		it("send hello to mary jane", function () {
			assert.deepEqual(parse("send hello to mary jane"),
				{"condition":false,"action":{"verb":"send","content":"hello","recipient":"mary jane"}});
		});

		it("send hello over email", function () {
			assert.deepEqual(parse("send hello over email"),
				{"condition":false,"action":{"verb":"send","content":"hello","method":"email"}});
		});

		it("send an email to mary jane saying hello", function () {
			assert.deepEqual(parse("send an email to mary jane saying hello"),
				{"condition":false,"action":{"verb":"send","method":"email","recipient":"mary jane","content":"hello"}});
		});

		it("send an email saying  hello to mary jane", function () {
			assert.deepEqual(parse("send an email saying  hello  to mary jane"),
				{"condition":false,"action":{"verb":"send","method":"email","content":"hello","recipient":"mary jane"}});
		});

		it("send an email to mary saying hello to bob I am a proxy", function () {
			assert.deepEqual(parse("send an email to mary saying hello to bob I am a proxy"),
				{"condition":false,"action":{"verb":"send","method":"email","recipient":"mary","content":"hello to bob I am a proxy"}});
		});

		it("send an email to mary saying hello via email I am a proxy", function () {
			assert.deepEqual(parse("send an email to mary saying hello via email I am a proxy"),
				{"condition":false,"action":{"verb":"send","method":"email","recipient":"mary","content":"hello via email I am a proxy"}});
		});

		it("send an email to me saying buy more dish soap", function () {
			assert.deepEqual(parse("send an email to me saying buy more dish soap "),
				{"condition":false,"action":{"verb":"send","method":"email","recipient":"me","content":"buy more dish soap"}});
		});
	});
});