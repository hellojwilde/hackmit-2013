(function (ctx) {
	function Parser() {}

	Parser.prototype.tagConditional = function(lexed) {
		return lexed.map(function (item) {
			if (item[0] == "if" || item[0] == "when" ||
					item[0] == "whenever") {
				item[1] = "IF";
			}

			if (item[0] == "then") {
				item[1] = "THEN";
			}

			return item;
		});
	};

	Parser.prototype.tagDates = function(lexed) {
		var dates = ["second", "seconds", "minute", "minutes", "hour", "hours",
								 "day", "days", "week", "weeks", "month", "months", "year", 
								 "years", "monday", "tuesday", "wednesday", "thursday", "friday",
								 "saturday", "sunday", "january", "february", "march", "april", 
								 "may", "june", "july", "august", "september", "october", 
								 "november", "december"];

		return lexed.map(function (item) {
			if (dates.indexOf(item[0]) != -1) {
				item[1] = "DATE";
			}

			return item;
		})
	};

	Parser.prototype.parse = function(lexed) {
		var lexedIdx = 0;

		var _chomp = function (skip) {
			var val = lexed[lexedIdx += (skip || 0)];
			lexedIdx++;
			return val;
		};
		var _chompVal = function (skip) { return (_chomp(skip) || [])[0]; }

		var _peek = function (skip) { 
			return lexed[lexedIdx + (skip || 0)]; 
		};
		var _peekVal = function (skip) { return (_peek(skip) || [])[0]; };
		var _peekTag = function (skip) { return (_peek(skip) || [])[1]; };

		var _pos = function () {
			var iscorrpos = true;
			for (var i = 0; i < arguments.length; i++) {
				var a = arguments[i];
				var c = _peekTag(i);

				var iseq = c == a;
				var iswildcard = a == "*";
				var isany = a instanceof Array && a.indexOf(c) != -1;

				iscorrpos = iscorrpos && (iseq || iswildcard || isany);
			}
			return iscorrpos;
		};

		function condition () {
			if (_pos("IF", "NN", ["VB", "VBZ"], ["PRP", "NN"])) {
				return {
					subject: _chompVal(1),
					verb: _chompVal(),
					to: _chompVal()
				};
			} else if (_pos("IF", "NN", ["VB", "VBZ"])) {
				return {
					subject: _chompVal(1),
					verb: _chompVal()
				};
			}

			return false;
		}

		function action() {
			if (_pos("THEN")) _chomp();

			if (_pos("VB", "*", "TO", "NN")) {
				return {
					verb: _chompVal(),
					content: _chompVal(),
					to: _chompVal(1)
				};
			} else if (_pos("VB", "*")) {
				return {
					verb: _chompVal(),
					content: _chompVal()
				};
			}
		}

		function rule() {
			var results = {};

			results.condition = condition();
			results.action = action();

			if (!results.condition) results.condition = condition();
			return results;
		}

		return rule(lexed);
	}

	ctx.Parser = Parser;
})(typeof module !== "undefined" ? module.exports : window);
