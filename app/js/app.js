App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
});

App.Store = {
	_timeline: Ember.A(),

	timeline: function () {
		return this._timeline;
	},

	appendToTimeline: function (appendage) {
		this._timeline.pushObject(appendage);
	}
};

App.Disambiguator = {
	time: function (ambig, completeFn) {

	},

	location: function (ambig, completeFn) {

	},

	person: function (ambig, completeFn) {
		
	}
};

App.NLP = {
	parse: function (input) {
		var psr = new Parser();
		var words = new Lexer().lex(input);
		var tagged = psr.tagConditional(psr.tagDates(new POSTagger().tag(words)));
		return psr.parse(tagged);
	},

	disambiguating: null,
	startDisambiguation: function (completeFn) {

	},
	selectDisambiguation: function (response) {

	}
};

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return App.Store.timeline();
  }
});

App.IndexController = Ember.ArrayController.extend(Ember.Evented, {
	itemController: 'event',
	isDisambiguating: false,

	shouldScrollToBottom: Ember.observer(function () {
		this.trigger("shouldScrollToBottom");
	}, "content.@each"),

	actions: {
  	tell: function (input) {
  		if (!this.get("isDisambiguating")) {
	  		App.Store.appendToTimeline({
		  		type: "quote",
		  		text: input
		  	});

	  		var raw = App.NLP.parse(input);
	  		if (!raw.action) {
	  			App.Store.appendToTimeline({
			  		type: "error",
			  		text: "I'm not sure what you mean."
			  	});
	  		} else {
	  			this.set("isDisambiguating", true);
	  			App.NLP.startDisambiguation(function () {

	  			}.bind(this));
	  		}
	  	} else {

	  	}
  	}
  }
});

App.EventController = Ember.ObjectController.extend({
	isQuote: Ember.computed(function () {
		return this.get("type") == "quote";
	}).property("type"),

	isError: Ember.computed(function () {
		return this.get("type") == "error";
	}).property("type")
});

App.IndexView = Ember.View.extend({
	didInsertElement: function () {
		this.get("controller").on("shouldScrollToBottom", function () {
			this.scrollToBottom();
		}.bind(this));
		this.scrollToBottom();
	},

	scrollToBottom: function () {
		var timeline = this.$(".app-timeline");
		timeline[0].scrollHeight = (timeline[0].scrollTop);
	}
})

App.SpeechTextField = Ember.TextField.extend({
	attributeBindings: ['x-webkit-speech'],
	"x-webkit-speech": true
});

App.MapImageComponent = Ember.Component.extend({
	apiKey: 'AIzaSyDXHMEMgDLFodaZ15stoyhiktANB3lgcBA',
	lat: 0,
	lon: 0,

	mapUrl: function () {
		var lat = this.get('lat'),
			  lon = this.get('lon'),
			  apiKey = this.get('apiKey');

		return 'http://maps.googleapis.com/maps/api/staticmap?size=500x200' +
		       '&zoom=14&markers=color:blue%7Clabel:S%7C' + lat + ',' + lon +
		       '&visual_refresh=true&sensor=false&api_key=' + apiKey;
	}.property('lat', 'lon', 'apiKey')
});
