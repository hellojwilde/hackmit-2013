(function (ctx) {
	var actionMethod = ["text", "email", "phone"]

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
								 "november", "december", "tomorrow", "yesterday"];

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
			var val = lexed[lexedIdx + (skip || 0)];
			lexedIdx += 1 + (skip || 0);
			return val;
		};
		var _chompVal = function (skip) { return (_chomp(skip) || [])[0]; }
		var _chompTag = function (skip) { return (_chomp(skip) || [])[1]; }
		var _chompValLen = function (skip, len) {
			var content = [];
			while (_peekVal() && len >= 0) {
				content.push(_chompVal(skip));
				skip = 0;
				len--;
			}
			return content.join(" ");
		};
		var _chompValWhile = function (fn, skip) {
			var content = [];
			while (_peekTag(skip) && fn()) {
				content.push(_chompVal(skip || 0));
				skip = 0;
			}
			return content.join(" ");
		};

		var _peek = function (skip) { 
			return lexed[lexedIdx + (skip || 0)]; 
		};
		var _peekVal = function (skip) { return (_peek(skip) || [])[0]; };
		var _peekTag = function (skip) { return (_peek(skip) || [])[1]; };

		var _isPos = function (a, c) {
			var iseq = c == a;
			var iswildcard = a == "*";
			var isany = a instanceof Array && a.indexOf(c) != -1;
			return iseq || iswildcard || isany;
		};
		var _pos = function (args) {
			var iscorrpos = true;
			for (var i = 0; i < arguments.length; i++) {
				iscorrpos = iscorrpos && _isPos(arguments[i], _peekTag(i));
			}
			return iscorrpos;
		};
		var _posSkip = function (args, skip) {
			var iscorrpos = true;
			for (var i = 0; i < args.length; i++) {
				iscorrpos = iscorrpos && _isPos(args[i], _peekTag(i + (skip || 0)));
			}
			return iscorrpos;
		};

		function dateCondition() {
			var date = false;
			var skip = 0;

			if (_posSkip(["IN"], skip)) skip++;
			if (_posSkip(["DT"], skip)) skip++;

		  if (_posSkip(["DATE", "IN", "DATE"], skip)) {
				date = _chompValLen(skip, 3);
			} else if (_posSkip(["DATE", "CD"], skip) ||
								 _posSkip([["CD", "JJ", "NN"], "DATE"],skip)) {
				date = _chompValLen(skip, 2);
			} else if (_posSkip(["DATE"], skip)) {
				date = _chompVal(skip);
			} 

			if (date) {
				return {
					subject: "time",
					verb: "is",
					to: date
				};
			}

			return false;
		}

		function locationCondition() {
			// "i am here"
			if (_pos("NN", "VBP", "RB")) {
				return {
					subject: _chompVal(),
					verb: _chompVal(),
					to: _chompVal()
				}
			// "i am at copley square"
			} else if (_pos("NN", "VBP", "IN", "NN")) {
				return {
					subject: _chompVal(),
					verb: _chompVal(),
					to: (function () { 
						_chomp(); 
						return _chompValWhile(function() { return _pos("NN"); });
					})()
				}
			}
		}

		function condition () {
			var date = dateCondition();
			if (date) return date;

			if (_pos("IF")) {
				_chomp();

				var location = locationCondition();
				if (location) return location;
			}

			return false;
		}

		function isMethodInf() {
			return (_pos("IN", ["NN", "NNP"]) && 
								actionMethod.indexOf(_peekVal(1)) != -1) ||
						 (_pos("IN", "DT", ["NN", "NNP"]) && 
						 		actionMethod.indexOf(_peekVal(2)) != -1);
		}
		function methodInf() {
			if (_pos("IN", ["NN", "NNP"])) {
				return _chompVal(1);
			} else if (_pos("IN", "DT", ["NN", "NNP"])) {
				return _chompVal(2);
			}
			return false;
		}

		function isRecipientInf() {
			return _pos("TO", ["PRP", "NN", "NNP"]);
		}

		function recipientInf() {
			_chomp();
			return _chompValWhile(function () { return !isMethodInf(); });
		}

		function action() {
			if (_pos("THEN")) _chomp();

			if (_pos("VB")) {
				var results = {
					verb: _chompVal()
				};

				// "[send] an imessage saying"
				if (_pos("DT", ["NN", "NNP"], "VBG") && 
					  actionMethod.indexOf(_peekVal(1)) != -1) {
					results.method = _chompVal(1);
					_chomp();
				// "[send] an email to sally"
				} else if (_pos("DT", ["NN", "NNP"], "TO", ["PRP", "NNP", "NN"]) && 
					 actionMethod.indexOf(_peekVal(1)) != -1) {
					results.method = _chompVal(1);
					_chomp();
					results.recipient = _chompValWhile(function () { 
						return !isMethodInf() && !_pos("VBG"); 
					});
					_chomp();
				}

				// message content
				results.content = _chompValWhile(function () { 
					return (results.method || !isMethodInf()) && 
								(results.recipient || !isRecipientInf());
				});
				
				// "via email"
				if (!results.method && isMethodInf()) {
					results.method = methodInf();
					if (isRecipientInf()) results.recipient = recipientInf();
				}

				// "to mary jane"
				if (!results.recipient && isRecipientInf()) {
					results.recipient = recipientInf();
					if (isMethodInf()) results.method = methodInf();
				}

				return results;
			}

			return false;
		}

		function rule() {
			return results = {
				condition: condition(),
			  action: action()
			};
		}

		return rule(lexed);
	}

	ctx.Parser = Parser;
})(typeof module !== "undefined" ? module.exports : window);
