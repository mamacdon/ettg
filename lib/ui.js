/*global define */
/*jslint browser:true laxbreak:true*/
define(['ettg/generator'], function(TitleGenerator) {
	function $$array(query, node) {
		return Array.prototype.slice.call((node || document).querySelectorAll(query));
	}
	function empty(node) {
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}
	}
	
	/**
	 * @param {String} str
	 * @return The string in Title Case.
	 */
	function titleCase(str) {
		var result = [], words = str.split(/\s+/);
		for (var i=0; i < words.length; i++) {
			var word = words[i];
			if (word === "") {
				continue;
			}
			var isFirst = i === 0,
			    isShort = /^(of|the|to|in|and|for)$/.test(word),
			    capitalized = word.substr(0,1).toUpperCase() + word.substr(1);
			if (isFirst) {
				result.push(capitalized);
			} else {
				result.push(" " + (isShort ? word : capitalized));
			}
		}
		return result.join("");
	}
	
	var uiScript = {
		generator: null,
		init: function() {
			this.addListeners();
			var self = this;
			this.generator = new TitleGenerator(
				function() {
					self.nextClicked();
				}, this.onError.bind(this));
		},
		onError: function(err) {
			var errNode = document.createElement("div");
			errNode.classList.add("error");
			if (typeof err.responseText === 'string') {
				errNode.innerText = err.url + ' error ' + err.status + ': ' + err.responseText;
			} else {
				errNode.innerText = err.toString();
			}
			var titlebox = document.getElementById('titlebox');
			titlebox.parentNode.insertBefore(titlebox.nextSibling, errNode);
		},
		addListeners: function() {
			this.listeners = [];
			this.enableNext();
			document.getElementById('nextbutton').addEventListener("click", function(evt) { evt.preventDefault(); });
			document.getElementById('groovecheckbox').addEventListener("change", this.applyGroove.bind(this));
		},
		enableNext: function() {
			var self = this;
			var nextMouseListener = this.nextClicked.bind(this);
			var nextKeyListener = function(evt) {
				if (evt.keyCode === 13 /*ENTER*/) {
					self.nextClicked.apply(self, arguments);
				}
			};
			document.getElementById('nextbutton').addEventListener("mousedown", nextMouseListener);
			document.getElementById('nextbutton').addEventListener("keydown", nextKeyListener);
			this.listeners.push(['mousedown', nextMouseListener]);
			this.listeners.push(['keydown', nextKeyListener]);
		},
		disableNext: function() {
			var nextButton = document.getElementById('nextbutton');
			this.listeners.forEach(function(l) {
				nextButton.removeEventListener(l[0], l[1]);
			});
		},
		nextClicked: function(evt) {
			this.disableNext();
			this.generator.advance().then(this.advanceComplete.bind(this));
			if (evt) {
				evt.preventDefault();
			}
		},
		applyGroove: function() {
			var state = !!document.getElementById('groovecheckbox').checked;
			$$array("#titlebox,#titlebox span,#titlebox hr").forEach(function(element) {
				var cl = element.classList, grooveClass = "groove";
				if (state) {
					cl.add(grooveClass);
				} else {
					cl.remove(grooveClass);
				}
			});
		},
		advanceComplete: function(title) {
			this.enableNext();
			document.getElementById('nextbutton').focus();

			var titleNode = document.createElement('div');
			titleNode.innerHTML = title.replace(/\[(\w+?)\]/g, "<div class=\"$1\">").replace(/\[(\/\w+)\]/g, "</div>");
			var newTitle = {};
			$$array('div.title, div.sequel, div.subtitle', titleNode).forEach(function(spanNode, i) {
				newTitle[spanNode.className] = spanNode;
				var text = spanNode.firstChild.textContent;
				var nicerText = titleCase(text);
				empty(spanNode);
				spanNode.appendChild(document.createTextNode(nicerText));
			});
			var self = this;
			var onFadedOut = function() {
				var titlebox = document.getElementById('titlebox');
				empty(titlebox);
				if (newTitle.sequel) {
					// Need sequel, title, hr, subtitle for formatting to look nice
					titlebox.appendChild(newTitle.title);
					titlebox.appendChild(newTitle.sequel);
//					titlebox.appendChild("<hr>");
					titlebox.appendChild(newTitle.subtitle);
				} else {
					titlebox.appendChild(newTitle.title);
				}
				self.applyGroove();
			};
			onFadedOut();
//			document.getElementById('titlebox')
//				.fadeOut(200, onFadedOut)
//				.fadeIn(300);
		}
		
//		enableSequelsClicked: function() {
//			this.generator.sequels = !!document.getElementById("enableSequels").checked;
//			document.getElementById("sizebox").innerHTML = this.generator.getSize().commafy();
//		}
	};
	return uiScript;
});
