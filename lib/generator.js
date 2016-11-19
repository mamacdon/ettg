/*eslint-env node*/
define(['Deferred', 'ettg/parser', 'text!ettg/rules.txt'], function(Deferred, GrammarParser, rules) {
	/**
	 * @static
	 * @param {Number} min
	 * @param {Number} max
	 * @returns A random integer drawn from the interval [min, max).
	 */
	function randRange(min, max) {
		return Math.floor(Math.random()*max + min);
	}

	/**
	 * @param array {Array}
	 * @returns {Array} A copy of array which has been jumbled up a bit
	 */
	function shuffle(array) {
		var copy = [].concat(array);
		for (var i=0; i < array.length; i++) {
			var j = randRange(0, array.length);
			var tmp = copy[i];
			copy[i] = copy[j];
			copy[j] = tmp;
		}
		return copy;
	}

	/**
	 * @param {String} str
	 * @return The string in Title Case.
	 */
	function titleCase(str) {
		var result = "",
		    words = str.split(/\s+/);
		for (var i=0; i < words.length; i++) {
			var word = words[i];
			if (word === "") { continue; }
			var isFirst = i === 0,
			    isShort = /^(of|the|to|in|and|for)$/.test(word),
			    capitalized = word.substr(0,1).toUpperCase() + word.substr(1);
			if (isFirst) {
				result += capitalized;
			} else {
				result += " " + (isShort ? word : capitalized);
			}
		}
		return result;
	}
	
	var TITLES_PER_CALL = 25;
	/**
	 * @name uivol.TitleGenerator
	 * @class
	 * @param {Function} initCallback Callback to invoke after initialization is done.
	 * @param {Function} errorCallback Callback to invoke on error
	 */
	function TitleGenerator(initCallback, errorCallback) {
		this.initCallback = initCallback;
		this.errorCallback = errorCallback;
		
		this.isFetching = false;
		this.titles = [];
		this.current = -1;
		
		this.grammar = new GrammarParser(rules).getGrammar();
		
		// Initialize, which will do the initial Ajax request
		this.fetch().then(this.initCallback, this.errorCallback);
	}
	TitleGenerator.prototype = /** @lends uivol.TitleGenerator */{
		BUFFA: 5,
		/**
		 * @private
		 * @returns {Deferred}
		 */
		fetch: function() {
			if (!this.isFetching) {
				this.isFetching = true;

				var doit = new Deferred();
				var grammar = this.grammar;
				setTimeout(function() {
					var titles = []; 
					for (var i=0; i < TITLES_PER_CALL; i++) {
						titles.push(grammar.generateString());
					}
					doit.resolve(titles);
				}, 1);
				var self = this;
				return doit.then(function(newTitles) {
					self.isFetching = false;
					
					// Cheap hack until I fix the consecutive occurrences of same word:
					// just shuffle the titles we got
					self.titles = self.titles.concat(shuffle(newTitles));
					
					if (self.current === -1) {
						self.current++;
					}
					return self.titles;
				});
			}
		},
		/**
		 * Advances to the next title.
		 * @private
		 * @returns {Deferred} A deferred that's resolved with the next title.
		 */
		advance: function() {
			var self = this;
			var nextTitle = function() {
				return self.titles[self.current++];
			};
			if (this.current + this.BUFFA >= this.titles.length) {
				// Need to load more
				return this.fetch().then(nextTitle);
			} else {
				var d = new Deferred();
				setTimeout(function() {
					d.resolve(nextTitle());
				}, 0);
				return d;
			}
		}
	};

	return TitleGenerator;
});
