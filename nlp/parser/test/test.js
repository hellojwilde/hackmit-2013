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
		it("if mary calls then send hello to bob", function () {
			assert.deepEqual(
				parse("if mary calls then send hello to bob"), 
				{"condition":{"subject":"mary","verb":"calls"},
				 "action":{"verb":"send","content":"hello","to":"bob"}});
		});

		it("if mary calls me then send hello to bob", function () {
			assert.deepEqual(
				parse("if mary calls me then send hello to bob"),
				{"condition":{"subject":"mary","verb":"calls","to":"me"},
				"action":{"verb":"send","content":"hello","to":"bob"}});
		});

		it("send hello to bob if mary calls", function () {
			assert.deepEqual(
				parse("send hello to bob if mary calls"),
				{"condition":{"subject":"mary","verb":"calls"},
				"action":{"verb":"send","content":"hello","to":"bob"}})
		});

		it("if mary calls me then send hello via text to bob", function () {
			assert.deepEqual(
				parse("if mary calls me then send hello via text to bob"),
				{"condition":{"subject":"mary","verb":"calls","to":"me"},
				"action":{"verb":"send","content":"hello", "via": "text", "to": "bob"}});
		});

		it("if mary calls me then send hello on iMessage to bob", function () {
			assert.deepEqual(
				parse("if mary calls me then send hello on iMessage to bob"),
				{"condition":{"subject":"mary","verb":"calls","to":"me"},
				"action":{"verb":"send","content":"hello", "to":"bob", "via":"iMessage"}});
		});

		it("if mary calls me then send hello on iMessage to bob", function () {
			assert.deepEqual(
				parse("if mary calls me then send hello on iMessage to bob"),
					{"condition":{"subject":"mary","verb":"calls","to":"me"},
					"action":{"verb":"send","content":"hello","via":"iMessage", "to":"bob"}});
		});
	});
});